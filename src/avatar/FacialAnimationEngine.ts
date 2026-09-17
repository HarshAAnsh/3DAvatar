import * as THREE from "three";

import { BlendshapeController } from "./BlendshapeController";
import { ARKIT_TO_AVATAR } from "./BlendshapeMapper";

export type AnimationSource = "debugger" | "procedural" | "mediapipe" | "tts";

export class FacialAnimationEngine {
  private controller: BlendshapeController;

  private currentValues: Record<string, number> = {};

  private sourceValues: Record<AnimationSource, Record<string, number>> = {
    debugger: {},
    procedural: {},
    mediapipe: {},
    tts: {},
  };

  private smoothing = 0.18;

  private ttsActive = false;

  private readonly mouthBlendshapes = new Set([
    "jawOpen",
    "jawForward",
    "jawLeft",
    "jawRight",

    "mouthClose",
    "mouthFunnel",
    "mouthPucker",
    "mouthLeft",
    "mouthRight",

    "mouthSmile_L",
    "mouthSmile_R",

    "mouthFrown_L",
    "mouthFrown_R",

    "mouthDimple_L",
    "mouthDimple_R",

    "mouthStretch_L",
    "mouthStretch_R",

    "mouthRollLower",
    "mouthRollUpper",

    "mouthShrugLower",
    "mouthShrugUpper",

    "mouthPress_L",
    "mouthPress_R",

    "mouthLowerDown_L",
    "mouthLowerDown_R",

    "mouthUpperUp_L",
    "mouthUpperUp_R",

    "tongueOut",
  ]);

  constructor(scene: THREE.Object3D) {
    this.controller = new BlendshapeController(scene);

    console.log("[FacialAnimationEngine] Initialized");
  }

  setSmoothing(value: number) {
    this.smoothing = THREE.MathUtils.clamp(value, 0.01, 1);
  }

  setTTSActive(active: boolean) {
    this.ttsActive = active;

    console.log("[FacialAnimationEngine] TTS active:", active);
  }

  setARKitBlendshape(
    arkitName: string,
    value: number,
    source: AnimationSource = "mediapipe",
  ) {
    if (arkitName === "_neutral") {
      return;
    }

    const avatarName = ARKIT_TO_AVATAR[arkitName];

    if (!avatarName) {
      console.warn(`[FacialAnimationEngine] No mapping for ${arkitName}`);
      return;
    }

    this.setSourceBlendshape(source, avatarName, value);
  }
  setAvatarBlendshape(
    avatarName: string,
    value: number,
    source: AnimationSource = "debugger",
  ) {
    this.setSourceBlendshape(source, avatarName, value);
  }

  private setSourceBlendshape(
    source: AnimationSource,
    name: string,
    value: number,
  ) {
    this.sourceValues[source][name] = THREE.MathUtils.clamp(value, 0, 1);
  }

  update() {
    const combinedTargets: Record<string, number> = {};

    /*
     * TTS owns mouth blendshapes while speaking.
     *
     * MediaPipe still owns everything else.
     */

    const allSources: AnimationSource[] = [
      "debugger",
      "procedural",
      "mediapipe",
      "tts",
    ];

    for (const source of allSources) {
      const values = this.sourceValues[source];

      for (const name of Object.keys(values)) {
        const isMouth = this.mouthBlendshapes.has(name);

        /*
         * If TTS is active:
         *
         * TTS owns mouth.
         *
         * Ignore MediaPipe mouth values.
         */
        if (this.ttsActive && isMouth && source === "mediapipe") {
          continue;
        }

        /*
         * If TTS is NOT active:
         *
         * Ignore TTS mouth values.
         */
        if (!this.ttsActive && isMouth && source === "tts") {
          continue;
        }

        /*
         * First valid source wins.
         */
        if (combinedTargets[name] === undefined) {
          combinedTargets[name] = values[name];
        }
      }
    }

    /*
     * Smooth all final values.
     */
    for (const name of Object.keys(combinedTargets)) {
      const target = combinedTargets[name];

      const current = this.currentValues[name] ?? 0;

      const next = current + (target - current) * this.smoothing;

      this.currentValues[name] = next;

      this.controller.setBlendshape(name, next);
    }

    /*
     * Return unused blendshapes
     * smoothly to neutral.
     */
    for (const name of Object.keys(this.currentValues)) {
      if (combinedTargets[name] === undefined) {
        const current = this.currentValues[name];

        const next = current + (0 - current) * this.smoothing;

        this.currentValues[name] = next;

        this.controller.setBlendshape(name, next);
      }
    }
  }

  clearSource(source: AnimationSource) {
    this.sourceValues[source] = {};
  }

  reset() {
    this.currentValues = {};

    this.sourceValues = {
      debugger: {},
      procedural: {},
      mediapipe: {},
      tts: {},
    };

    this.ttsActive = false;

    this.controller.reset();
  }

  getBlendshapeNames() {
    return this.controller.getBlendshapeNames();
  }
}
