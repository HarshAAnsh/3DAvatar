/**
 * Maps standard ARKit 52 blendshape names
 * to the morph-target names used by facecap.glb.
 *
 * ARKit naming:
 *   eyeBlinkLeft
 *   mouthSmileLeft
 *   jawOpen
 *
 * Avatar naming:
 *   eyeBlink_L
 *   mouthSmile_L
 *   jawOpen
 */

export const ARKIT_TO_AVATAR: Record<string, string> = {
  // =========================
  // Brows
  // =========================

  browInnerUp: "browInnerUp",

  browDownLeft: "browDown_L",

  browDownRight: "browDown_R",

  browOuterUpLeft: "browOuterUp_L",

  browOuterUpRight: "browOuterUp_R",

  // =========================
  // Eyes
  // =========================

  eyeLookUpLeft: "eyeLookUp_L",

  eyeLookUpRight: "eyeLookUp_R",

  eyeLookDownLeft: "eyeLookDown_L",

  eyeLookDownRight: "eyeLookDown_R",

  eyeLookInLeft: "eyeLookIn_L",

  eyeLookInRight: "eyeLookIn_R",

  eyeLookOutLeft: "eyeLookOut_L",

  eyeLookOutRight: "eyeLookOut_R",

  eyeBlinkLeft: "eyeBlink_L",

  eyeBlinkRight: "eyeBlink_R",

  eyeSquintLeft: "eyeSquint_L",

  eyeSquintRight: "eyeSquint_R",

  eyeWideLeft: "eyeWide_L",

  eyeWideRight: "eyeWide_R",

  // =========================
  // Cheeks
  // =========================

  cheekPuff: "cheekPuff",

  cheekSquintLeft: "cheekSquint_L",

  cheekSquintRight: "cheekSquint_R",

  // =========================
  // Nose
  // =========================

  noseSneerLeft: "noseSneer_L",

  noseSneerRight: "noseSneer_R",

  // =========================
  // Jaw
  // =========================

  jawOpen: "jawOpen",

  jawForward: "jawForward",

  jawLeft: "jawLeft",

  jawRight: "jawRight",

  // =========================
  // Mouth
  // =========================

  mouthClose: "mouthClose",

  mouthFunnel: "mouthFunnel",

  mouthPucker: "mouthPucker",

  mouthLeft: "mouthLeft",

  mouthRight: "mouthRight",

  mouthSmileLeft: "mouthSmile_L",

  mouthSmileRight: "mouthSmile_R",

  mouthFrownLeft: "mouthFrown_L",

  mouthFrownRight: "mouthFrown_R",

  mouthDimpleLeft: "mouthDimple_L",

  mouthDimpleRight: "mouthDimple_R",

  mouthStretchLeft: "mouthStretch_L",

  mouthStretchRight: "mouthStretch_R",

  mouthRollLower: "mouthRollLower",

  mouthRollUpper: "mouthRollUpper",

  mouthShrugLower: "mouthShrugLower",

  mouthShrugUpper: "mouthShrugUpper",

  mouthPressLeft: "mouthPress_L",

  mouthPressRight: "mouthPress_R",

  mouthLowerDownLeft: "mouthLowerDown_L",

  mouthLowerDownRight: "mouthLowerDown_R",

  mouthUpperUpLeft: "mouthUpperUp_L",

  mouthUpperUpRight: "mouthUpperUp_R",

  // =========================
  // Tongue
  // =========================

  tongueOut: "tongueOut",
};
