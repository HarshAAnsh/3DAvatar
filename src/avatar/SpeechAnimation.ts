import * as THREE from 'three'

import {
  FacialAnimationEngine,
} from './FacialAnimationEngine'

export class SpeechAnimation {
  private engine: FacialAnimationEngine

  private speaking = false
  private time = 0

  constructor(
    engine: FacialAnimationEngine
  ) {
    this.engine = engine

    console.log(
      '[SpeechAnimation] Initialized'
    )
  }

  start() {
    this.speaking = true
    this.time = 0

    console.log(
      '[SpeechAnimation] START'
    )
  }

  stop() {
    this.speaking = false
    this.time = 0

    console.log(
      '[SpeechAnimation] STOP'
    )

    this.resetMouth()
  }

  update(delta: number) {
  if (!this.speaking) {
    return
  }

  this.time += delta

  const jaw =
    0.2 +
    Math.abs(
      Math.sin(
        this.time * 8
      )
    ) * 0.7

  const value =
    THREE.MathUtils.clamp(
      jaw,
      0,
      1
    )

  console.log(
    '[SpeechAnimation] APPLY MOUTH:',
    value.toFixed(2)
  )

  this.engine.setAvatarBlendshape(
    'jawOpen',
    value,
    'tts'
  )

  this.engine.setAvatarBlendshape(
    'mouthFunnel',
    value * 0.2,
    'tts'
  )

  this.engine.setAvatarBlendshape(
    'mouthPucker',
    value * 0.1,
    'tts'
  )
}
  private resetMouth() {
    this.engine.setAvatarBlendshape(
      'jawOpen',
      0,
      'tts'
    )

    this.engine.setAvatarBlendshape(
      'mouthFunnel',
      0,
      'tts'
    )

    this.engine.setAvatarBlendshape(
      'mouthPucker',
      0,
      'tts'
    )

    this.engine.setAvatarBlendshape(
      'mouthClose',
      0,
      'tts'
    )

    this.engine.setAvatarBlendshape(
      'mouthSmile_L',
      0,
      'tts'
    )

    this.engine.setAvatarBlendshape(
      'mouthSmile_R',
      0,
      'tts'
    )
  }
}