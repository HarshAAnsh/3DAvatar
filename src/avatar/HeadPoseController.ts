import * as THREE from 'three'

export class HeadPoseController {
  private target: THREE.Object3D

  private currentQuaternion =
    new THREE.Quaternion()

  private targetQuaternion =
    new THREE.Quaternion()

  private neutralQuaternion =
    new THREE.Quaternion()

  private matrix =
    new THREE.Matrix4()

  private relativeQuaternion =
    new THREE.Quaternion()

  private smoothing = 0.15

  private calibrated = false

  constructor(target: THREE.Object3D) {
    this.target = target

    console.log(
      '[HeadPose] Initialized:',
      target.name
    )
  }

  setSmoothing(value: number) {
    this.smoothing =
      THREE.MathUtils.clamp(
        value,
        0.01,
        1
      )
  }

  setMatrix(data: ArrayLike<number>) {
    if (data.length !== 16) {
      console.warn(
        '[HeadPose] Invalid matrix length:',
        data.length
      )

      return
    }

    this.matrix.fromArray(data)

    const rawQuaternion =
      new THREE.Quaternion()

    rawQuaternion.setFromRotationMatrix(
      this.matrix
    )

    if (!this.calibrated) {
      this.targetQuaternion.copy(
        rawQuaternion
      )

      return
    }

    // Convert current pose into a pose
    // relative to the calibrated neutral pose.
    this.relativeQuaternion
      .copy(this.neutralQuaternion)
      .invert()
      .multiply(rawQuaternion)

    this.targetQuaternion.copy(
      this.relativeQuaternion
    )
  }

  calibrate() {
    this.neutralQuaternion.copy(
      this.targetQuaternion
    )

    this.currentQuaternion.identity()
    this.targetQuaternion.identity()

    this.calibrated = true

    this.target.quaternion.identity()

    console.log(
      '[HeadPose] Calibrated'
    )
  }

  update(delta: number) {
    const alpha =
      THREE.MathUtils.clamp(
        delta * 10 * this.smoothing,
        0,
        1
      )

    this.currentQuaternion.slerp(
      this.targetQuaternion,
      alpha
    )

    this.target.quaternion.copy(
      this.currentQuaternion
    )
  }

  reset() {
    this.currentQuaternion.identity()

    this.targetQuaternion.identity()

    this.neutralQuaternion.identity()

    this.relativeQuaternion.identity()

    this.calibrated = false

    this.target.quaternion.identity()
  }

  isCalibrated() {
    return this.calibrated
  }
}