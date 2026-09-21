import { create } from "zustand";
import type * as THREE from "three";

import type { FacialAnimationEngine } from "../avatar/FacialAnimationEngine";
import type { HeadPoseController } from "../avatar/HeadPoseController";
import type { SpeechAnimation } from "../avatar/SpeechAnimation";

export type AvatarMode = "live" | "demo";

export type AvatarEmotion =
  | "neutral"
  | "happy"
  | "excited"
  | "sad"
  | "concerned"
  | "curious"
  | "thinking"
  | "apologetic";

interface AvatarStore {
  /*
   * 3D scene
   */
  scene: THREE.Object3D | null;

  /*
   * Facial animation engine
   */
  engine: FacialAnimationEngine | null;

  /*
   * Head tracking controller
   */
  headPose: HeadPoseController | null;

  /*
   * Speech / lip-sync animation
   */
  speechAnimation: SpeechAnimation | null;

  /*
   * Application mode
   */
  mode: AvatarMode;

  /*
   * Current conversational emotion
   */
  emotion: AvatarEmotion;

  /*
   * Scene setters
   */
  setScene: (scene: THREE.Object3D | null) => void;

  setEngine: (engine: FacialAnimationEngine | null) => void;

  setHeadPose: (headPose: HeadPoseController | null) => void;

  setSpeechAnimation: (speechAnimation: SpeechAnimation | null) => void;

  /*
   * Mode
   */
  setMode: (mode: AvatarMode) => void;

  /*
   * Emotion
   */
  setEmotion: (emotion: AvatarEmotion) => void;

  /*
   * Reset runtime state
   */
  reset: () => void;
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  scene: null,

  engine: null,

  headPose: null,

  speechAnimation: null,

  mode: "demo",

  emotion: "neutral",

  setScene: (scene) => {
    set({ scene });
  },

  setEngine: (engine) => {
    set({ engine });
  },

  setHeadPose: (headPose) => {
    set({ headPose });
  },

  setSpeechAnimation: (speechAnimation) => {
    set({ speechAnimation });
  },

  setMode: (mode) => {
    set({ mode });
  },

  setEmotion: (emotion) => {
    set({ emotion });
  },

  reset: () => {
    set({
      scene: null,
      engine: null,
      headPose: null,
      speechAnimation: null,
      mode: "demo",
      emotion: "neutral",
    });
  },
}));
