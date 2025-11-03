import board
import busio
import math
import time

from adafruit_pca9685 import PCA9685
from maps.beta import *


class ServoDriver:
    def __init__(self, freq=50):
        self.freq = freq
        self.available = False
        try:

            i2c = busio.I2C(board.SCL, board.SDA)
            self.pca = PCA9685(i2c)
            self.pca.frequency = freq
            self.available = True
            print("[INFO] PCA9685 driver initialized.")
        except Exception as e:
            self.available = False
            print("[WARN] PCA9685 not available, falling back to mock driver. Error:", e)

    def angle_to_pwm(self, angle_deg):
        angle = float(angle_deg)
        pulse_min = 500.0
        pulse_max = 2500.0
        us = pulse_min + (pulse_max - pulse_min) * (angle / 180.0)

        period = 1000000.0 / self.freq
        value = int((us / period) * 4096)
        return max(0, min(4095, value))

    def set_servo(self, channel, angle_deg):
        pwm = self.angle_to_pwm(angle_deg)
        if self.available:
            self.pca.channels[channel].duty_cycle = pwm
        else:
            print(f"[MOCK SERVO] ch {channel} -> angle {angle_deg:.1f}° pwm {pwm}")

class HexapodController:
    def __init__(self, servo_driver, servo_map, neutral_angles=NEUTRAL_ANGLES):
        self.servo_driver = servo_driver
        self.servo_map = servo_map
        self.neutral = neutral_angles

        self.foot_positions = {leg: (0.15 * 1.0, 0.0, -0.18) for leg in servo_map.keys()}  # front/back lateral offsets

        lateral = [0.12, 0.06, -0.06, -0.12, -0.06, 0.06]  
        forward = [0.08, 0.0, -0.08, -0.08, 0.0, 0.08]     
        
        for i in self.foot_positions:
            self.foot_positions[i] = (forward[i], lateral[i], -0.18)
        self.step_height = 0.06
        self.step_length = 0.04

    def send_joint_angles(self, leg, angles):
        ch_coxa, ch_femur, ch_tibia = self.servo_map[leg]

        self.servo_driver.set_servo(ch_coxa, angles[0])
        self.servo_driver.set_servo(ch_femur, angles[1])
        self.servo_driver.set_servo(ch_tibia, angles[2])

    def move_to_neutral(self):
        for leg, angs in self.neutral.items():
            chs = self.servo_map[leg]
            self.send_joint_angles(leg, angs)
            time.sleep(0.01)

    def step_tripod(self, triplet, direction=1, step_time=0.4):
        t0 = time.time()
        dt = 0.02
        steps = int(step_time / dt)
        for s in range(steps):
            phase = s / steps
            for leg in self.servo_map.keys():
                x0, y0, z0 = self.foot_positions[leg]
                if leg in triplet:
                    z = z0 + self.step_height * math.sin(math.pi * phase)
                    x = x0 + direction * self.step_length * math.sin(math.pi * phase)
                else:
                    z = z0
                    x = x0 - direction * (self.step_length * 0.02) * math.sin(2 * math.pi * phase)

                angles = leg_ik(x, y0, z)
                self.send_joint_angles(leg, angles)
            time.sleep(dt)

    def perform_step(self, direction=1):
        g1 = [0, 3, 4]
        g2 = [1, 2, 5]
        self.step_tripod(g1, direction=direction, step_time=0.35)
        time.sleep(0.02)
        self.step_tripod(g2, direction=direction, step_time=0.35)

def leg_ik(x, y, z, coxa_len=COXA, femur_len=FEMUR, tibia_len=TIBIA):
    coxa_angle = math.degrees(math.atan2(y, x))  # yaw

    horiz_dist = math.hypot(x, y) - coxa_len
    if horiz_dist < 0:
        horiz_dist = 0.0

    r = math.hypot(horiz_dist, z)

    r = max(1e-6, min(r, femur_len + tibia_len - 1e-6))

    try:
        cos_alpha = (femur_len**2 + r**2 - tibia_len**2) / (2 * femur_len * r)
        alpha = math.acos(max(-1.0, min(1.0, cos_alpha)))
        cos_beta = (femur_len**2 + tibia_len**2 - r**2) / (2 * femur_len * tibia_len)
        beta = math.acos(max(-1.0, min(1.0, cos_beta)))
    except ValueError:
        return NEUTRAL_ANGLES[0]

    theta = math.atan2(z, horiz_dist)
    femur_angle = math.degrees(theta + alpha)   # upward positive
    tibia_angle = math.degrees(math.pi - beta)  # hinge angle

    return (coxa_angle + 90, femur_angle, tibia_angle)
