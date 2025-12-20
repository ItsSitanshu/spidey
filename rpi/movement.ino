/*
  Hexapod controller for ESP32 + 2x PCA9685 (Adafruit_PWMServoDriver)
  - Two drivers at addresses 0x40 and 0x41 on same SDA/SCL
  - Tripod gait
  - Control via Raspberry Pi over I2C (ESP32 as I2C slave at 0x08)
  - Also supports Serial commands as fallback
    Serial joystick format examples:
      JOY x y z         (x,y,z in -100..100)
      DOCK              (start docking)
      PATROL_START      (begin recording waypoints)
      PATROL_ADD        (add current pose to track)
      PATROL_PLAY       (play patrol track)
      PATROL_CLEAR      (clear track)
  
  RPi I2C Protocol:
  - ESP32 is I2C slave at address 0x08
  - RPi sends 4 bytes: [CMD, X, Y, Z] where values are signed int8 (-100 to 100)
  - CMD byte commands:
      0x01: Update virtual joystick (X, Y, Z values)
      0x02: Trigger docking sequence
      0x03: Start patrol recording
      0x04: Add patrol waypoint
      0x05: Play patrol
      0x06: Clear patrol
      0x07: Return to home
      0x08: Emergency stop (return to home immediately)
*/

#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

// I2C slave address for ESP32 (controlled by RPi)
#define I2C_SLAVE_ADDR 0x08

// Virtual joystick values controlled by RPi
volatile int8_t virtualJoyX = 0;
volatile int8_t virtualJoyY = 0;
volatile int8_t virtualJoyZ = 0;
volatile bool newI2CCommand = false;
volatile uint8_t i2cCommand = 0;

// Two PCA9685 drivers — make sure the second board is set to 0x41 (address jumpers)
Adafruit_PWMServoDriver pwm1 = Adafruit_PWMServoDriver(0x40);
Adafruit_PWMServoDriver pwm2 = Adafruit_PWMServoDriver(0x41);

// Pulse width limits (tweak per your servos)
#define SERVO_MIN 150 // ~0.5 ms (pulse)
#define SERVO_MAX 600 // ~2.5 ms (pulse)

// Map degrees 0..180 to pulses
int angleToPulse(int angle) {
  if (angle < 0) angle = 0;
  if (angle > 180) angle = 180;
  long pulse = map(angle, 0, 180, SERVO_MIN, SERVO_MAX);
  return (int)pulse;
}

// Basic smoothing interpolation
float lerp(float a, float b, float t) { return a + (b - a) * t; }

// Leg/servo channel mapping: 6 legs (0..5), each with COXA, FEMUR, TIBIA
// We'll split channels across the two PCA9685s. Adjust to your wiring!
struct ServoID { Adafruit_PWMServoDriver* driver; uint8_t channel; };

// For this mapping: legs 0-2 on pwm1, legs 3-5 on pwm2
// Each leg uses 3 channels (coxa, femur, tibia)
ServoID legServo[6][3];

// Servo offsets & flip flags (micro-adjustments)
int servoOffset[6][3] = { // degrees offsets for calibration: {coxa,femur,tibia}
  {0, 0, 0}, // leg0
  {0, 0, 0}, // leg1
  {0, 0, 0}, // leg2
  {0, 0, 0}, // leg3
  {0, 0, 0}, // leg4
  {0, 0, 0}  // leg5
};
bool servoFlip[6][3] = { // if true, angle is inverted
  {false,false,false},
  {false,false,false},
  {false,false,false},
  {false,false,false},
  {false,false,false},
  {false,false,false}
};

// Default "home" angles (degrees) for a neutral stance — tune for your robot
int homeCoxa[6]  = {90, 90, 90, 90, 90, 90};
int homeFemur[6] = {100,100,100,100,100,100};
int homeTibia[6] = {70, 70, 70, 70, 70, 70};

// Gait groups (tripod): groupA and groupB
const uint8_t groupA[3] = {0, 3, 4};
const uint8_t groupB[3] = {1, 2, 5};

// Docking sensor pins (optional)
const int DOCK_SENSOR_PIN = 25;  // reading from docking beacon or bumper
const int DOCKED_PIN = 26;       // confirm docked (e.g., charger switch)

// Patrol track storage (in RAM)
const int MAX_WAYPOINTS = 20;
struct Pose {
  int coxa[6];
  int femur[6];
  int tibia[6];
};
Pose patrolTrack[MAX_WAYPOINTS];
int patrolCount = 0;
bool recordingPatrol = false;

// Timing / gait parameters (tweak)
int stepDurationMs = 350; // one half-step per tripod
int liftAngle = -20;      // how much femur lifts (negative = up depending on your geometry)
int stepCoxaAngle = 25;   // how far coxa swings forward/back

// State
Pose currentPose, targetPose;
unsigned long lastStepTime = 0;
bool currentPhase = 0; // 0 = groupA swing, 1 = groupB swing
unsigned long lastUpdate = 0;
int interpolationSteps = 8; // number of small interpolation steps per movement

// I2C receive callback
void onI2CReceive(int numBytes) {
  if (numBytes >= 4) {
    uint8_t cmd = Wire.read();
    int8_t x = Wire.read();
    int8_t y = Wire.read();
    int8_t z = Wire.read();
    
    // Discard any extra bytes
    while (Wire.available()) Wire.read();
    
    i2cCommand = cmd;
    
    switch (cmd) {
      case 0x01: // Update virtual joystick
        virtualJoyX = x;
        virtualJoyY = y;
        virtualJoyZ = z;
        break;
      case 0x02: // Docking
      case 0x03: // Patrol start
      case 0x04: // Patrol add
      case 0x05: // Patrol play
      case 0x06: // Patrol clear
      case 0x07: // Home
      case 0x08: // Emergency stop
        newI2CCommand = true;
        break;
      default:
        break;
    }
  } else {
    // Discard incomplete messages
    while (Wire.available()) Wire.read();
  }
}

// I2C request callback (optional - can send status back to RPi)
void onI2CRequest() {
  // Send status byte: bit 0 = docked, bit 1 = recording patrol, etc.
  uint8_t status = 0;
  if (recordingPatrol) status |= 0x02;
  if (digitalRead(DOCKED_PIN) == HIGH) status |= 0x01;
  Wire.write(status);
}

void setupServoMapping() {
  // pwm1 channels for legs 0-2:
  // leg0 channels 0-2
  // leg1 channels 3-5
  // leg2 channels 6-8
  for (int l = 0; l < 3; ++l) {
    int base = l * 3;
    legServo[l][0] = { &pwm1, (uint8_t)(base + 0) }; // coxa
    legServo[l][1] = { &pwm1, (uint8_t)(base + 1) }; // femur
    legServo[l][2] = { &pwm1, (uint8_t)(base + 2) }; // tibia
  }
  // pwm2 channels for legs 3-5:
  for (int l = 3; l < 6; ++l) {
    int base = (l - 3) * 3;
    legServo[l][0] = { &pwm2, (uint8_t)(base + 0) }; // coxa
    legServo[l][1] = { &pwm2, (uint8_t)(base + 1) }; // femur
    legServo[l][2] = { &pwm2, (uint8_t)(base + 2) }; // tibia
  }
}

void writeServoDeg(int leg, int which, int deg) {
  int ang = deg + servoOffset[leg][which];
  if (servoFlip[leg][which]) ang = 180 - ang;
  if (ang < 0) ang = 0;
  if (ang > 180) ang = 180;
  int pulse = angleToPulse(ang);
  Adafruit_PWMServoDriver* drv = legServo[leg][which].driver;
  uint8_t ch = legServo[leg][which].channel;
  drv->setPWM(ch, 0, pulse);
}

void applyPose(const Pose &p) {
  for (int l = 0; l < 6; ++l) {
    writeServoDeg(l, 0, p.coxa[l]);
    writeServoDeg(l, 1, p.femur[l]);
    writeServoDeg(l, 2, p.tibia[l]);
  }
}

void interpolateTo(const Pose &next, int steps, int delayMs) {
  for (int s = 1; s <= steps; ++s) {
    for (int l = 0; l < 6; ++l) {
      currentPose.coxa[l]  = (int)lerp(currentPose.coxa[l],  next.coxa[l],  (float)s/steps);
      currentPose.femur[l] = (int)lerp(currentPose.femur[l], next.femur[l], (float)s/steps);
      currentPose.tibia[l] = (int)lerp(currentPose.tibia[l], next.tibia[l], (float)s/steps);
    }
    applyPose(currentPose);
    delay(delayMs);
  }
}

Pose poseFromOffsets(int coxaOffsets[6], int femurOffsets[6], int tibiaOffsets[6]) {
  Pose p;
  for (int i = 0; i < 6; ++i) {
    p.coxa[i]  = homeCoxa[i]  + coxaOffsets[i];
    p.femur[i] = homeFemur[i] + femurOffsets[i];
    p.tibia[i] = homeTibia[i] + tibiaOffsets[i];
  }
  return p;
}

void tripodStep(int fwdVal, int strafeVal, int yawVal, float speedFactor) {
  int stepC = (int)(stepCoxaAngle * (fwdVal / 100.0f));
  int strafeC = (int)(stepCoxaAngle * (strafeVal / 100.0f));
  int yawC = (int)(stepCoxaAngle * (yawVal / 100.0f));

  int coxaOffsets[6]  = {0,0,0,0,0,0};
  int femurOffsets[6] = {0,0,0,0,0,0};
  int tibiaOffsets[6] = {0,0,0,0,0,0};

  const uint8_t* swingGroup = currentPhase ? groupB : groupA;
  const uint8_t* stanceGroup = currentPhase ? groupA : groupB;

  for (int i = 0; i < 3; ++i) {
    int leg = swingGroup[i];
    coxaOffsets[leg]  = stepC - (yawC * (i - 1)); // small per-leg yaw bias
    femurOffsets[leg] = liftAngle; // lift
    tibiaOffsets[leg] = -10;       // fold slightly when lifted
  }

  for (int i = 0; i < 3; ++i) {
    int leg = stanceGroup[i];
    coxaOffsets[leg]  = -stepC/2; // push back
    femurOffsets[leg] = 0;
    tibiaOffsets[leg] = 0;
  }

  for (int l = 0; l < 6; ++l) {
    if (l < 3) coxaOffsets[l] += strafeC/2;
    else coxaOffsets[l] -= strafeC/2;
  }

  Pose next = poseFromOffsets(coxaOffsets, femurOffsets, tibiaOffsets);

  // Interpolate into the step
  int interpDelay = max(10, (int)(stepDurationMs * (1.0f/speedFactor) / interpolationSteps));
  interpolateTo(next, interpolationSteps, interpDelay);

  // Now put swing legs down to stance (reverse lift)
  for (int i = 0; i < 3; ++i) {
    int leg = swingGroup[i];
    femurOffsets[leg] = 0;
    tibiaOffsets[leg] = 0;
  }
  Pose settled = poseFromOffsets(coxaOffsets, femurOffsets, tibiaOffsets);
  interpolateTo(settled, interpolationSteps, interpDelay);

  // flip phase for next call
  currentPhase = !currentPhase;
}

void returnHome() {
  Serial.println("Returning to home pose.");
  Pose home;
  for (int i=0;i<6;i++) { 
    home.coxa[i]=homeCoxa[i]; 
    home.femur[i]=homeFemur[i]; 
    home.tibia[i]=homeTibia[i]; 
  }
  interpolateTo(home, 12, 20);
}

String serialBuffer = "";
void handleSerialCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;

  if (cmd.startsWith("JOY")) {
    int x=0,y=0,z=0;
    int got = sscanf(cmd.c_str(), "JOY %d %d %d", &x, &y, &z);
    if (got >= 3) {
      tripodStep(x, y, z, 1.0f);
    } else {
      Serial.println("Invalid JOY format. Use: JOY x y z  (values -100..100)");
    }
  } else if (cmd == "DOCK") {
    Serial.println("Starting docking sequence...");
    runDockingSequence();
  } else if (cmd == "PATROL_START") {
    recordingPatrol = true;
    patrolCount = 0;
    Serial.println("Patrol recording started.");
  } else if (cmd == "PATROL_ADD") {
    if (!recordingPatrol) {
      Serial.println("Not recording. Send PATROL_START first.");
    } else if (patrolCount < MAX_WAYPOINTS) {
      patrolTrack[patrolCount++] = currentPose;
      Serial.print("Added waypoint "); Serial.println(patrolCount);
    } else {
      Serial.println("Patrol track full.");
    }
  } else if (cmd == "PATROL_SAVE") {
    recordingPatrol = false;
    Serial.print("Patrol saved with "); Serial.print(patrolCount); Serial.println(" waypoints.");
  } else if (cmd == "PATROL_PLAY") {
    if (patrolCount == 0) Serial.println("No waypoints to play.");
    else {
      Serial.println("Playing patrol...");
      playPatrol();
    }
  } else if (cmd == "PATROL_CLEAR") {
    patrolCount = 0;
    recordingPatrol = false;
    Serial.println("Patrol cleared.");
  } else if (cmd == "HOME") {
    returnHome();
  } else {
    Serial.print("Unknown command: ");
    Serial.println(cmd);
  }
}

// Docking routine (simple):
void runDockingSequence() {
  Pose dockPose;
  for (int i=0;i<6;i++) {
    dockPose.coxa[i] = homeCoxa[i];
    dockPose.femur[i] = homeFemur[i] + 10;
    dockPose.tibia[i] = homeTibia[i] - 10;
  }
  interpolateTo(dockPose, 15, 40);

  unsigned long start = millis();
  const unsigned long timeout = 20000;
  Serial.println("Searching for docking contact...");
  while (millis() - start < timeout) {
    int val = digitalRead(DOCK_SENSOR_PIN);
    if (val == HIGH) {
      Serial.println("Dock sensor triggered — finalizing docking pose.");
      Pose finalPose = dockPose;
      for (int i=0;i<6;i++) {
        finalPose.femur[i] += 5;
        finalPose.tibia[i] -= 5;
      }
      interpolateTo(finalPose, 8, 80);
      unsigned long waitStart = millis();
      while (millis()-waitStart < 5000) {
        if (digitalRead(DOCKED_PIN) == HIGH) {
          Serial.println("Docked confirmed.");
          return;
        }
        delay(100);
      }
      Serial.println("Docked (sensor) but dock confirmation not seen.");
      return;
    }
    for (int l=0;l<6;l++) {
      int c = dockPose.coxa[l] + ( (millis()/500 % 2) ? 3 : -3);
      writeServoDeg(l, 0, c);
    }
    delay(150);
  }
  Serial.println("Docking timeout — aborting.");
}

// Play patrol sequence
void playPatrol() {
  for (int p = 0; p < patrolCount; ++p) {
    interpolateTo(patrolTrack[p], 12, 40);
    delay(300);
  }
  Serial.println("Patrol complete.");
}

// Process I2C commands
void processI2CCommand() {
  if (!newI2CCommand) return;
  newI2CCommand = false;
  
  switch (i2cCommand) {
    case 0x02: // Docking
      Serial.println("I2C: Starting docking sequence...");
      runDockingSequence();
      break;
    case 0x03: // Patrol start
      recordingPatrol = true;
      patrolCount = 0;
      Serial.println("I2C: Patrol recording started.");
      break;
    case 0x04: // Patrol add
      if (recordingPatrol && patrolCount < MAX_WAYPOINTS) {
        patrolTrack[patrolCount++] = currentPose;
        Serial.print("I2C: Added waypoint "); Serial.println(patrolCount);
      }
      break;
    case 0x05: // Patrol play
      if (patrolCount > 0) {
        Serial.println("I2C: Playing patrol...");
        playPatrol();
      }
      break;
    case 0x06: // Patrol clear
      patrolCount = 0;
      recordingPatrol = false;
      Serial.println("I2C: Patrol cleared.");
      break;
    case 0x07: // Home
    case 0x08: // Emergency stop
      returnHome();
      virtualJoyX = 0;
      virtualJoyY = 0;
      virtualJoyZ = 0;
      break;
  }
}

// Setup
void setup() {
  Serial.begin(115200);
  delay(100);

  // Initialize I2C as slave BEFORE initializing PCA9685 drivers
  Wire.begin(I2C_SLAVE_ADDR, 21, 22, 100000); // addr, SDA, SCL, frequency
  Wire.onReceive(onI2CReceive);
  Wire.onRequest(onI2CRequest);

  // Now initialize PCA9685 on the same I2C bus
  pwm1.begin();
  pwm1.setPWMFreq(50);
  pwm2.begin();
  pwm2.setPWMFreq(50);
  delay(10);

  pinMode(DOCK_SENSOR_PIN, INPUT);
  pinMode(DOCKED_PIN, INPUT);

  setupServoMapping();

  // initialize home pose
  for (int i=0;i<6;i++) {
    currentPose.coxa[i] = homeCoxa[i];
    currentPose.femur[i] = homeFemur[i];
    currentPose.tibia[i] = homeTibia[i];
  }
  applyPose(currentPose);

  Serial.println("Hexapod ready. Controlled via RPi I2C (addr 0x08) or serial commands.");
  Serial.println("I2C Protocol: [CMD][X][Y][Z] - CMD 0x01=joystick, 0x02=dock, 0x07=home");
}

// Main loop
void loop() {
  // Handle serial commands (fallback/debug)
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialBuffer.length() > 0) {
        handleSerialCommand(serialBuffer);
        serialBuffer = "";
      }
    } else {
      serialBuffer += c;
    }
  }

  // Process any I2C commands
  processI2CCommand();

  // If recording patrol, don't auto-step
  if (recordingPatrol) {
    delay(50);
    return;
  }

  // Read virtual joystick values from RPi
  int joyX = virtualJoyX;
  int joyY = virtualJoyY;
  int joyZ = virtualJoyZ;

  // If joystick is near zero, idle
  if (joyX == 0 && joyY == 0 && joyZ == 0) {
    delay(40);
  } else {
    tripodStep(joyX, joyY, joyZ, 1.0f);
  }
}