import * as THREE from 'three'

export class HeadMotion {
  private target: THREE.Object3D

  // Current rotation
  private currentX = 0
  private currentY = 0
  private currentZ = 0

  // Target rotation
  private targetX = 0
  private targetY = 0
  private targetZ = 0

  private timer = 0

  // How often the avatar chooses a new head position
  private changeInterval = 3

  constructor(target: THREE.Object3D) {
    this.target = target

    console.log(
      '[HeadMotion] Initialized:',
      target.name
    )
  }

  update(delta: number, elapsed: number) {
    this.timer += delta

    // Choose a new head position
    if (this.timer >= this.changeInterval) {
      this.timer = 0

      // Left / right
      this.targetY =
        (Math.random() - 0.5) * 0.30

      // Up / down
      this.targetX =
        (Math.random() - 0.5) * 0.16

      // Head tilt
      this.targetZ =
        (Math.random() - 0.5) * 0.12

      console.log(
        '[HeadMotion] New target:',
        {
          x: this.targetX.toFixed(3),
          y: this.targetY.toFixed(3),
          z: this.targetZ.toFixed(3),
        }
      )

      // Random interval between movements
      this.changeInterval =
        2.5 + Math.random() * 2.5
    }

    // Smooth movement
    const smoothing = Math.min(
      delta * 2,
      1
    )

    this.currentX +=
      (this.targetX - this.currentX) *
      smoothing

    this.currentY +=
      (this.targetY - this.currentY) *
      smoothing

    this.currentZ +=
      (this.targetZ - this.currentZ) *
      smoothing

    // Very subtle idle movement
    const idleX =
      Math.sin(elapsed * 0.45) * 0.008

    const idleY =
      Math.sin(elapsed * 0.35) * 0.012

    const idleZ =
      Math.sin(elapsed * 0.25) * 0.006

    this.target.rotation.x =
      this.currentX + idleX

    this.target.rotation.y =
      this.currentY + idleY

    this.target.rotation.z =
      this.currentZ + idleZ
  }

  reset() {
    this.currentX = 0
    this.currentY = 0
    this.currentZ = 0

    this.targetX = 0
    this.targetY = 0
    this.targetZ = 0

    this.target.rotation.set(0, 0, 0)
  }
}