import * as THREE from 'three'

import { BlendshapeController } from './BlendshapeController'
import { ARKIT_TO_AVATAR } from './BlendshapeMapper'

export type AnimationSource =
  | 'debugger'
  | 'procedural'
  | 'mediapipe'
  | 'tts'

export class FacialAnimationEngine {
  private controller: BlendshapeController

  private currentValues: Record<string, number> = {}

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

  /**
   * Blendshapes that belong to speech/lip animation.
   *
   * When TTS is active, these should not be overridden
   * by MediaPipe.
   */
  private readonly ttsBlendshapes = new Set([
    'jawOpen',
    'mouthFunnel',
    'mouthPucker',
    'mouthClose',
    'mouthSmile_L',
    'mouthSmile_R',
    'mouthFrown_L',
    'mouthFrown_R',
    'mouthDimple_L',
    'mouthDimple_R',
    'mouthStretch_L',
    'mouthStretch_R',
    'mouthRollLower',
    'mouthRollUpper',
    'mouthShrugLower',
    'mouthShrugUpper',
    'mouthPress_L',
    'mouthPress_R',
    'mouthLowerDown_L',
    'mouthLowerDown_R',
    'mouthUpperUp_L',
    'mouthUpperUp_R',
  ])

  constructor(scene: THREE.Object3D) {
    this.controller =
      new BlendshapeController(scene)
  }

  setSmoothing(value: number) {
    this.smoothing =
      THREE.MathUtils.clamp(
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
        `[FacialAnimationEngine] No mapping for ${arkitName}`
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

  /**
   * Decide which animation source owns a specific
   * blendshape for the current frame.
   */
  private getTargetValue(
    name: string
  ): number | undefined {

    // ------------------------------------------------
    // 1. DEBUGGER HAS HIGHEST PRIORITY
    // ------------------------------------------------
    if (
      this.sourceValues.debugger[name] !== undefined
    ) {
      return this.sourceValues.debugger[name]
    }

    // ------------------------------------------------
    // 2. TTS OWNS MOUTH DURING SPEECH
    // ------------------------------------------------
    if (
      this.ttsBlendshapes.has(name) &&
      this.sourceValues.tts[name] !== undefined
    ) {
      return this.sourceValues.tts[name]
    }

    // ------------------------------------------------
    // 3. MEDIAPIPE CONTROLS NORMAL FACIAL TRACKING
    // ------------------------------------------------
    if (
      this.sourceValues.mediapipe[name] !== undefined
    ) {
      return this.sourceValues.mediapipe[name]
    }

    // ------------------------------------------------
    // 4. PROCEDURAL FALLBACK
    // ------------------------------------------------
    if (
      this.sourceValues.procedural[name] !== undefined
    ) {
      return this.sourceValues.procedural[name]
    }

    return undefined
  }

  update() {
    const targetNames = new Set<string>()

    // Collect all blendshape names from every source.
    for (
      const source of Object.keys(
        this.sourceValues
      ) as AnimationSource[]
    ) {
      Object.keys(
        this.sourceValues[source]
      ).forEach((name) => {
        targetNames.add(name)
      })
    }

    // Apply resolved values.
    for (const name of targetNames) {
      const target =
        this.getTargetValue(name)

      if (target === undefined) {
        continue
      }

      const current =
        this.currentValues[name] ?? 0

      const next =
        current +
        (target - current) *
          this.smoothing

      this.currentValues[name] = next

      this.controller.setBlendshape(
        name,
        next
      )
    }

    // Smooth unused blendshapes back to zero.
    for (
      const name of Object.keys(
        this.currentValues
      )
    ) {
      if (!targetNames.has(name)) {
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