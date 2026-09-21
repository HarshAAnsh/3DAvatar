import type { FacialAnimationEngine } from "./FacialAnimationEngine";

export type VisemeType =
  "rest" | "A" | "E" | "I" | "O" | "U" | "M" | "F" | "L" | "S";

/*
 * Backward-compatible alias.
 */
export type Viseme = VisemeType;

interface BlendshapeTarget {
  [name: string]: number;
}

/*
 * IMPORTANT:
 * These are ARKit blendshape names.
 *
 * FacialAnimationEngine -> BlendshapeMapper
 * will translate them to the actual GLB morph names:
 *
 * mouthSmileLeft  -> mouthSmile_L
 * mouthSmileRight -> mouthSmile_R
 * etc.
 */
const VISEME_TARGETS: Record<VisemeType, BlendshapeTarget> = {
  rest: {
    jawOpen: 0,
    mouthClose: 0,
    mouthFunnel: 0,
    mouthPucker: 0,
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    mouthStretchLeft: 0,
    mouthStretchRight: 0,
    mouthPressLeft: 0,
    mouthPressRight: 0,
  },

  A: {
    jawOpen: 0.65,
    mouthSmileLeft: 0.15,
    mouthSmileRight: 0.15,
  },

  E: {
    jawOpen: 0.3,
    mouthSmileLeft: 0.45,
    mouthSmileRight: 0.45,
    mouthStretchLeft: 0.25,
    mouthStretchRight: 0.25,
  },

  I: {
    jawOpen: 0.18,
    mouthSmileLeft: 0.35,
    mouthSmileRight: 0.35,
    mouthStretchLeft: 0.3,
    mouthStretchRight: 0.3,
  },

  O: {
    jawOpen: 0.42,
    mouthFunnel: 0.65,
    mouthPucker: 0.2,
  },

  U: {
    jawOpen: 0.2,
    mouthPucker: 0.7,
    mouthFunnel: 0.4,
  },

  M: {
    jawOpen: 0,
    mouthClose: 0.85,
    mouthPressLeft: 0.35,
    mouthPressRight: 0.35,
  },

  F: {
    jawOpen: 0.12,
    mouthPressLeft: 0.25,
    mouthPressRight: 0.25,
  },

  L: {
    jawOpen: 0.28,
    mouthSmileLeft: 0.12,
    mouthSmileRight: 0.12,
  },

  S: {
    jawOpen: 0.08,
    mouthSmileLeft: 0.1,
    mouthSmileRight: 0.1,
    mouthStretchLeft: 0.2,
    mouthStretchRight: 0.2,
  },
};

export class VisemeEngine {
  private engine: FacialAnimationEngine;

  private currentValues: BlendshapeTarget = {};

  private targetValues: BlendshapeTarget = {};

  /*
   * Higher value = faster transition.
   */
  private smoothing = 14;

  constructor(engine: FacialAnimationEngine) {
    this.engine = engine;

    console.log("[VisemeEngine] Initialized");
  }

  // ==================================================
  // Set target viseme
  // ==================================================

  setViseme(viseme: VisemeType) {
    const target = VISEME_TARGETS[viseme] ?? VISEME_TARGETS.rest;

    this.targetValues = {
      ...target,
    };

    console.log("[VisemeEngine] Viseme:", viseme);
  }

  // ==================================================
  // Update smooth transition
  // ==================================================

  update(delta: number) {
    const alpha = 1 - Math.exp(-this.smoothing * delta);

    const names = new Set([
      ...Object.keys(this.currentValues),
      ...Object.keys(this.targetValues),
    ]);

    for (const name of names) {
      const current = this.currentValues[name] ?? 0;

      const target = this.targetValues[name] ?? 0;

      const next = current + (target - current) * alpha;

      this.currentValues[name] = next;

      /*
       * Send ARKit names here.
       * BlendshapeMapper converts them to
       * the actual avatar morph-target names.
       */
      this.engine.setARKitBlendshape(name, next, "tts");
    }
  }

  // ==================================================
  // Reset
  // ==================================================

  reset() {
    this.currentValues = {};
    this.targetValues = {};

    this.setViseme("rest");
  }
}
