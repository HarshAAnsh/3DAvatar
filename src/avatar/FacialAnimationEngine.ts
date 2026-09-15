import * as THREE from 'three'

import {
  BlendshapeController,
} from './BlendshapeController'

import {
  ARKIT_TO_AVATAR,
} from './BlendshapeMapper'

export type AnimationSource =
  | 'debugger'
  | 'procedural'
  | 'mediapipe'
  | 'tts'

export class FacialAnimationEngine {
  private controller: BlendshapeController

  private currentValues: Record<
    string,
    number
  > = {}

  private sourceValues: Record<
    AnimationSource,
    Record<string, number>
  > = {
    debugger: {},
    procedural: {},
    mediapipe: {},
    tts: {},
  }

  private smoothing = 0.18

  constructor(scene: THREE.Object3D) {
    this.controller =
      new BlendshapeController(scene)
  }

  setSmoothing(value: number) {
    this.smoothing = THREE.MathUtils.clamp(
      value,
      0.01,
      1
    )
  }

  setARKitBlendshape(
    arkitName: string,
    value: number,
    source: AnimationSource = 'mediapipe'
  ) {
    const avatarName =
      ARKIT_TO_AVATAR[arkitName]

    if (!avatarName) {
      console.warn(
        `No avatar mapping for ${arkitName}`
      )

      return
    }

    this.setSourceBlendshape(
      source,
      avatarName,
      value
    )
  }

  setAvatarBlendshape(
    avatarName: string,
    value: number,
    source: AnimationSource = 'debugger'
  ) {
    this.setSourceBlendshape(
      source,
      avatarName,
      value
    )
  }

  private setSourceBlendshape(
    source: AnimationSource,
    name: string,
    value: number
  ) {
    this.sourceValues[source][name] =
      THREE.MathUtils.clamp(
        value,
        0,
        1
      )
  }

 update() {
  const combinedTargets: Record<
    string,
    number
  > = {}

  // --------------------------------------------------
  // Determine whether MediaPipe currently owns face
  // --------------------------------------------------

  const hasMediaPipeData =
    Object.keys(
      this.sourceValues.mediapipe
    ).length > 0

  // --------------------------------------------------
  // Priority:
  //
  // MediaPipe
  // Debugger
  // TTS
  // Procedural
  // --------------------------------------------------

  const sources: AnimationSource[] =
    hasMediaPipeData
      ? [
          'mediapipe',
          'debugger',
          'tts',
        ]
      : [
          'debugger',
          'tts',
          'procedural',
        ]

  // --------------------------------------------------
  // Apply source priority
  // --------------------------------------------------

  for (const source of sources) {
    const values =
      this.sourceValues[source]

    for (const name of Object.keys(values)) {
      // Don't overwrite a higher-priority value
      if (
        combinedTargets[name] ===
        undefined
      ) {
        combinedTargets[name] =
          values[name]
      }
    }
  }

  // --------------------------------------------------
  // Smooth blendshape changes
  // --------------------------------------------------

  for (const name of Object.keys(
    combinedTargets
  )) {
    const target =
      combinedTargets[name]

    const current =
      this.currentValues[name] ?? 0

    const next =
      current +
      (target - current) *
        this.smoothing

    this.currentValues[name] =
      next

    this.controller.setBlendshape(
      name,
      next
    )
  }

  // --------------------------------------------------
  // Return unused blendshapes to zero
  // --------------------------------------------------

  for (const name of Object.keys(
    this.currentValues
  )) {
    if (
      combinedTargets[name] ===
      undefined
    ) {
      const current =
        this.currentValues[name]

      const next =
        current +
        (0 - current) *
          this.smoothing

      this.currentValues[name] =
        next

      this.controller.setBlendshape(
        name,
        next
      )
    }
  }
}

  clearSource(
    source: AnimationSource
  ) {
    this.sourceValues[source] = {}
  }

  reset() {
    this.currentValues = {}

    this.sourceValues = {
      debugger: {},
      procedural: {},
      mediapipe: {},
      tts: {},
    }

    this.controller.reset()
  }

  getBlendshapeNames() {
    return this.controller
      .getBlendshapeNames()
  }
}