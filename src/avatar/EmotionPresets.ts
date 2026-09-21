export type EmotionType =
  | "neutral"
  | "happy"
  | "excited"
  | "sad"
  | "concerned"
  | "curious"
  | "thinking"
  | "apologetic";

export interface EmotionTarget {
  [name: string]: number;
}

export const EMOTION_PRESETS: Record<EmotionType, EmotionTarget> = {
  neutral: {
    browInnerUp: 0,

    browDownLeft: 0,
    browDownRight: 0,

    eyeWideLeft: 0,
    eyeWideRight: 0,

    cheekSquintLeft: 0,
    cheekSquintRight: 0,

    mouthSmileLeft: 0,
    mouthSmileRight: 0,

    mouthFrownLeft: 0,
    mouthFrownRight: 0,

    mouthPressLeft: 0,
    mouthPressRight: 0,
  },

  happy: {
    browInnerUp: 0.08,

    cheekSquintLeft: 0.2,
    cheekSquintRight: 0.2,

    mouthSmileLeft: 0.55,
    mouthSmileRight: 0.55,
  },

  excited: {
    browInnerUp: 0.22,

    eyeWideLeft: 0.18,
    eyeWideRight: 0.18,

    cheekSquintLeft: 0.25,
    cheekSquintRight: 0.25,

    mouthSmileLeft: 0.7,
    mouthSmileRight: 0.7,
  },

  sad: {
    browInnerUp: 0.22,

    browDownLeft: 0.1,
    browDownRight: 0.1,

    mouthFrownLeft: 0.42,
    mouthFrownRight: 0.42,

    mouthPressLeft: 0.12,
    mouthPressRight: 0.12,
  },

  concerned: {
    browInnerUp: 0.2,

    browDownLeft: 0.14,
    browDownRight: 0.14,

    mouthFrownLeft: 0.25,
    mouthFrownRight: 0.25,

    mouthPressLeft: 0.08,
    mouthPressRight: 0.08,
  },

  curious: {
    browInnerUp: 0.25,

    eyeWideLeft: 0.1,
    eyeWideRight: 0.1,

    mouthSmileLeft: 0.08,
    mouthSmileRight: 0.08,
  },

  thinking: {
    browInnerUp: 0.16,

    browDownLeft: 0.08,
    browDownRight: 0.08,

    mouthPressLeft: 0.12,
    mouthPressRight: 0.12,
  },

  apologetic: {
    browInnerUp: 0.18,

    browDownLeft: 0.06,
    browDownRight: 0.06,

    mouthFrownLeft: 0.25,
    mouthFrownRight: 0.25,

    mouthPressLeft: 0.15,
    mouthPressRight: 0.15,
  },
};
