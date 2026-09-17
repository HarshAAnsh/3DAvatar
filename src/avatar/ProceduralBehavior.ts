import * as THREE from "three";
import { FacialAnimationEngine } from "./FacialAnimationEngine";

export class ProceduralBehavior {
  private engine: FacialAnimationEngine;

  // -------------------------
  // Blink
  // -------------------------
  private blinkTimer = 0;
  private nextBlinkTime = 3;
  private isBlinking = false;
  private blinkProgress = 0;

  // -------------------------
  // Gaze
  // -------------------------
  private gazeTimer = 0;

  private gazeX = 0;
  private gazeY = 0;

  private targetGazeX = 0;
  private targetGazeY = 0;

  private gazeChangeInterval = 2.5;

  constructor(engine: FacialAnimationEngine) {
    this.engine = engine;

    console.log("[ProceduralBehavior] Created");
  }

  update(delta: number, elapsed: number) {
    this.updateBlink(delta);
    this.updateGaze(delta, elapsed);
  }

  // =========================================================
  // BLINK
  // =========================================================

  private updateBlink(delta: number) {
    this.blinkTimer += delta;

    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
      console.log("[ProceduralBehavior] BLINK");

      this.isBlinking = true;
      this.blinkProgress = 0;
    }

    if (!this.isBlinking) {
      return;
    }

    this.blinkProgress += delta * 6;

    let value = 0;

    if (this.blinkProgress < 0.5) {
      // Closing
      value = this.blinkProgress * 2;
    } else {
      // Opening
      value = (1 - this.blinkProgress) * 2;
    }

    value = THREE.MathUtils.clamp(value, 0, 1);

    this.engine.setAvatarBlendshape("eyeBlink_L", value, "procedural");

    this.engine.setAvatarBlendshape("eyeBlink_R", value, "procedural");

    if (this.blinkProgress >= 1) {
      this.isBlinking = false;

      this.blinkTimer = 0;

      this.nextBlinkTime = 3 + Math.random() * 3;

      this.engine.setAvatarBlendshape("eyeBlink_L", 0, "procedural");

      this.engine.setAvatarBlendshape("eyeBlink_R", 0, "procedural");
    }
  }

  // =========================================================
  // GAZE
  // =========================================================

  private updateGaze(delta: number, elapsed: number) {
    this.gazeTimer += delta;

    // Pick a new gaze target every few seconds
    if (this.gazeTimer >= this.gazeChangeInterval) {
      this.gazeTimer = 0;

      // Much larger movement for testing/visibility
      this.targetGazeX = (Math.random() - 0.5) * 1.2;

      this.targetGazeY = (Math.random() - 0.5) * 0.8;

      console.log(
        "[ProceduralBehavior] New gaze target:",
        this.targetGazeX.toFixed(2),
        this.targetGazeY.toFixed(2),
      );
    }

    // Smooth movement toward target
    const smoothing = Math.min(delta * 2.5, 1);

    this.gazeX += (this.targetGazeX - this.gazeX) * smoothing;

    this.gazeY += (this.targetGazeY - this.gazeY) * smoothing;

    // Small natural idle movement
    const idleX = Math.sin(elapsed * 0.7) * 0.03;

    const idleY = Math.sin(elapsed * 0.9) * 0.02;

    const finalX = THREE.MathUtils.clamp(this.gazeX + idleX, -1, 1);

    const finalY = THREE.MathUtils.clamp(this.gazeY + idleY, -1, 1);

    // ---------------------------------------------------------
    // Horizontal gaze
    // ---------------------------------------------------------

    if (finalX > 0) {
      // Looking toward the avatar's right
      this.engine.setAvatarBlendshape("eyeLookOut_L", finalX, "procedural");

      this.engine.setAvatarBlendshape("eyeLookIn_L", 0, "procedural");

      this.engine.setAvatarBlendshape("eyeLookIn_R", finalX, "procedural");

      this.engine.setAvatarBlendshape("eyeLookOut_R", 0, "procedural");
    } else {
      // Looking toward the avatar's left
      const value = Math.abs(finalX);

      this.engine.setAvatarBlendshape("eyeLookIn_L", value, "procedural");

      this.engine.setAvatarBlendshape("eyeLookOut_L", 0, "procedural");

      this.engine.setAvatarBlendshape("eyeLookOut_R", value, "procedural");

      this.engine.setAvatarBlendshape("eyeLookIn_R", 0, "procedural");
    }

    // ---------------------------------------------------------
    // Vertical gaze
    // ---------------------------------------------------------

    if (finalY > 0) {
      // Looking up

      this.engine.setAvatarBlendshape("eyeLookUp_L", finalY, "procedural");

      this.engine.setAvatarBlendshape("eyeLookUp_R", finalY, "procedural");

      this.engine.setAvatarBlendshape("eyeLookDown_L", 0, "procedural");

      this.engine.setAvatarBlendshape("eyeLookDown_R", 0, "procedural");
    } else {
      // Looking down

      const value = Math.abs(finalY);

      this.engine.setAvatarBlendshape("eyeLookDown_L", value, "procedural");

      this.engine.setAvatarBlendshape("eyeLookDown_R", value, "procedural");

      this.engine.setAvatarBlendshape("eyeLookUp_L", 0, "procedural");

      this.engine.setAvatarBlendshape("eyeLookUp_R", 0, "procedural");
    }

    // Debug every few seconds
    if (Math.floor(elapsed) % 3 === 0 && delta > 0) {
      // intentionally light logging
    }
  }
}
