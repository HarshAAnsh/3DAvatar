import * as THREE from "three";

import { FacialAnimationEngine } from "./FacialAnimationEngine";

export type Viseme =
  | "rest"
  | "A"
  | "E"
  | "I"
  | "O"
  | "U"
  | "M"
  | "F"
  | "L"
  | "S";

export class VisemeEngine {
  private engine: FacialAnimationEngine;

  private targetViseme: Viseme = "rest";

  private transitionSpeed = 12;

  private currentValues: Record<string, number> = {};

  constructor(engine: FacialAnimationEngine) {
    this.engine = engine;

    console.log("[VisemeEngine] Initialized");
  }

  setViseme(viseme: Viseme) {
    if (this.targetViseme === viseme) {
      return;
    }

    this.targetViseme = viseme;

    console.log("[VisemeEngine] Viseme:", viseme);
  }

  update(delta: number) {
    const targetValues = this.getVisemeValues(this.targetViseme);

    const names = new Set([
      ...Object.keys(this.currentValues),
      ...Object.keys(targetValues),
    ]);

    for (const name of names) {
      const current = this.currentValues[name] ?? 0;

      const target = targetValues[name] ?? 0;

      const next = THREE.MathUtils.lerp(
        current,
        target,
        THREE.MathUtils.clamp(delta * this.transitionSpeed, 0, 1),
      );

      this.currentValues[name] = next;

      this.engine.setAvatarBlendshape(name, next, "tts");
    }
  }

  reset() {
    this.targetViseme = "rest";

    this.currentValues = {};

    this.engine.clearSource("tts");
  }

  private getVisemeValues(viseme: Viseme): Record<string, number> {
    switch (viseme) {
      case "A":
        return {
          jawOpen: 0.65,
          mouthSmile_L: 0.15,
          mouthSmile_R: 0.15,
        };

      case "E":
        return {
          jawOpen: 0.3,
          mouthSmile_L: 0.45,
          mouthSmile_R: 0.45,
          mouthStretch_L: 0.25,
          mouthStretch_R: 0.25,
        };

      case "I":
        return {
          jawOpen: 0.18,
          mouthSmile_L: 0.35,
          mouthSmile_R: 0.35,
          mouthStretch_L: 0.3,
          mouthStretch_R: 0.3,
        };

      case "O":
        return {
          jawOpen: 0.42,
          mouthFunnel: 0.65,
          mouthPucker: 0.2,
        };

      case "U":
        return {
          jawOpen: 0.2,
          mouthPucker: 0.7,
          mouthFunnel: 0.4,
        };

      case "M":
        return {
          jawOpen: 0,
          mouthClose: 0.85,
          mouthPress_L: 0.35,
          mouthPress_R: 0.35,
        };

      case "F":
        return {
          jawOpen: 0.12,
          mouthPress_L: 0.25,
          mouthPress_R: 0.25,
        };

      case "L":
        return {
          jawOpen: 0.28,
          mouthSmile_L: 0.12,
          mouthSmile_R: 0.12,
        };

      case "S":
        return {
          jawOpen: 0.08,
          mouthSmile_L: 0.1,
          mouthSmile_R: 0.1,
          mouthStretch_L: 0.2,
          mouthStretch_R: 0.2,
        };

      case "rest":
      default:
        return {
          jawOpen: 0,
          mouthClose: 0,
          mouthFunnel: 0,
          mouthPucker: 0,
          mouthSmile_L: 0,
          mouthSmile_R: 0,
          mouthStretch_L: 0,
          mouthStretch_R: 0,
          mouthPress_L: 0,
          mouthPress_R: 0,
        };
    }
  }
}
