import { create } from 'zustand'
import * as THREE from 'three'

import { FacialAnimationEngine } from '../avatar/FacialAnimationEngine'
import { HeadPoseController } from '../avatar/HeadPoseController'
import { SpeechAnimation } from '../avatar/SpeechAnimation'

interface AvatarStore {
  scene: THREE.Object3D | null

  engine: FacialAnimationEngine | null

  headPose: HeadPoseController | null

  speechAnimation: SpeechAnimation | null

  setScene: (scene: THREE.Object3D) => void

  setEngine: (
    engine: FacialAnimationEngine
  ) => void

  setHeadPose: (
    headPose: HeadPoseController
  ) => void

  setSpeechAnimation: (
    speechAnimation: SpeechAnimation | null
  ) => void
}

export const useAvatarStore =
  create<AvatarStore>((set) => ({
    scene: null,

    engine: null,

    headPose: null,

    speechAnimation: null,

    setScene: (scene) =>
      set({
        scene,
      }),

    setEngine: (engine) =>
      set({
        engine,
      }),

    setHeadPose: (headPose) =>
      set({
        headPose,
      }),

    setSpeechAnimation: (
      speechAnimation
    ) =>
      set({
        speechAnimation,
      }),
  }))