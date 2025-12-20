/*
  Simple ESP32 program to reset all servos on two PCA9685 boards to 0 degrees
  - PCA9685 #1 at address 0x40
  - PCA9685 #2 at address 0x41
  - Sets all 32 channels (16 per board) to 0 degrees
*/

#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

// Two PCA9685 drivers
Adafruit_PWMServoDriver pwm1 = Adafruit_PWMServoDriver(0x40);
Adafruit_PWMServoDriver pwm2 = Adafruit_PWMServoDriver(0x41);

// Servo pulse width limits
#define SERVO_MIN 150  // pulse for 0 degrees
#define SERVO_MAX 600  // pulse for 180 degrees

// Convert angle to pulse width
int angleToPulse(int angle) {
  if (angle < 0) angle = 0;
  if (angle > 180) angle = 180;
  return map(angle, 0, 180, SERVO_MIN, SERVO_MAX);
}

void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Initialize I2C
  Wire.begin(21, 22); // SDA=21, SCL=22 on ESP32
  
  Serial.println("Initializing PCA9685 boards...");
  
  // Initialize both boards
  pwm1.begin();
  pwm1.setPWMFreq(50); // 50Hz for servos
  
  pwm2.begin();
  pwm2.setPWMFreq(50);
  
  delay(100);
  
  Serial.println("Resetting all servos to 0 degrees...");
  
  int pulse = angleToPulse(0); // Get pulse for 0 degrees
  
  // Reset all 16 channels on first board
  for (int ch = 0; ch < 16; ch++) {
    pwm1.setPWM(ch, 0, pulse);
    Serial.print("PWM1 Channel ");
    Serial.print(ch);
    Serial.println(" -> 0°");
    delay(50); // Small delay between servo commands
  }
  
  // Reset all 16 channels on second board
  for (int ch = 0; ch < 16; ch++) {
    pwm2.setPWM(ch, 0, pulse);
    Serial.print("PWM2 Channel ");
    Serial.print(ch);
    Serial.println(" -> 0°");
    delay(50);
  }
  
  Serial.println("\nAll servos reset to 0 degrees!");
  Serial.println("Type '90' or '180' to move all servos to that angle.");
}

void loop() {
  // Check for serial input to move servos to different angles
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    int angle = input.toInt();
    
    if (angle >= 0 && angle <= 180) {
      Serial.print("Moving all servos to ");
      Serial.print(angle);
      Serial.println(" degrees...");
      
      int pulse = angleToPulse(angle);
      
      // Set all channels on both boards
      for (int ch = 0; ch < 16; ch++) {
        pwm1.setPWM(ch, 0, pulse);
        pwm2.setPWM(ch, 0, pulse);
      }
      
      Serial.println("Done!");
    } else {
      Serial.println("Invalid angle. Enter 0-180.");
    }
  }
  
  delay(100);
}