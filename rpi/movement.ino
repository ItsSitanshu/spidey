#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define SERVO_MIN 150  // ~0.5 ms
#define SERVO_MAX 600  // ~2.5 ms

// Servo channels for one leg
#define COXA 0
#define FEMUR 1
#define TIBIA 2


//

void setup() {
  Wire.begin(21, 22); // SDA, SCL
  Serial.begin(115200);
  pwm.begin();
  pwm.setPWMFreq(50); // 50 Hz
  delay(10);

  Serial.println("Setting leg to stand position...");
  stand(); // move leg to stand position
}

void loop() {
  walkStep(); // move leg in a simple walk cycle
  delay(1000);
}

// Function to set leg to stand pose
void stand() {
  pwm.setPWM(COXA, 0, 375);  // middle position
  pwm.setPWM(FEMUR, 0, 400); // slightly down
  pwm.setPWM(TIBIA, 0, 350); // slightly bent
}

// Function to move leg forward (simple walk)
void walkStep() {
  // Lift leg
  pwm.setPWM(FEMUR, 0, 300);
  pwm.setPWM(TIBIA, 0, 250);
  delay(500);

  // Move leg forward (rotate coxa)
  pwm.setPWM(COXA, 0, 450);
  delay(500);

  // Put leg down
  pwm.setPWM(FEMUR, 0, 400);
  pwm.setPWM(TIBIA, 0, 350);
  delay(500);

  // Move leg back to start
  pwm.setPWM(COXA, 0, 375);
  delay(500);
}