import { create } from "zustand";
import * as THREE from "three";

import { FacialAnimationEngine } from "../avatar/FacialAnimationEngine";
import { HeadPoseController } from "../avatar/HeadPoseController";
import { SpeechAnimation } from "../avatar/SpeechAnimation";
import type { AvatarMode } from "../avatar/AvatarMode";

interface AvatarStore {
  scene: THREE.Object3D | null;
  engine: FacialAnimationEngine | null;
  headPose: HeadPoseController | null;
  speechAnimation: SpeechAnimation | null;

  mode: AvatarMode;

  setScene: (scene: THREE.Object3D) => void;
  setEngine: (engine: FacialAnimationEngine) => void;
  setHeadPose: (headPose: HeadPoseController) => void;
  setSpeechAnimation: (speechAnimation: SpeechAnimation | null) => void;

  setMode: (mode: AvatarMode) => void;
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  scene: null,
  engine: null,
  headPose: null,
  speechAnimation: null,

  mode: "live",

  setScene: (scene) => set({ scene }),

  setEngine: (engine) => set({ engine }),

  setHeadPose: (headPose) => set({ headPose }),

  setSpeechAnimation: (speechAnimation) => set({ speechAnimation }),

  setMode: (mode) => set({ mode }),
}));
