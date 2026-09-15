import * as THREE from 'three'

import { FacialAnimationEngine } from './FacialAnimationEngine'

export class SpeechAnimation {
  private engine: FacialAnimationEngine

  private speaking = false

  private time = 0

  constructor(
    engine: FacialAnimationEngine
  ) {
    this.engine = engine
  }

  start() {
    this.speaking = true
    this.time = 0

    console.log(
      '[SpeechAnimation] Started'
    )
  }

  stop() {
    this.speaking = false

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

    console.log(
      '[SpeechAnimation] Stopped'
    )
  }

  update(delta: number) {
    if (!this.speaking) {
      return
    }

    this.time += delta

    // Simulated speech rhythm.
    // Later this will be replaced with
    // real audio/viseme analysis.

    const jaw =
      0.15 +
      Math.abs(
        Math.sin(
          this.time * 9
        )
      ) * 0.45

    const funnel =
      Math.abs(
        Math.sin(
          this.time * 6.5
        )
      ) * 0.15

    const pucker =
      Math.abs(
        Math.sin(
          this.time * 4.2
        )
      ) * 0.08

    this.engine.setAvatarBlendshape(
      'jawOpen',
      THREE.MathUtils.clamp(
        jaw,
        0,
        1
      ),
      'tts'
    )

    this.engine.setAvatarBlendshape(
      'mouthFunnel',
      THREE.MathUtils.clamp(
        funnel,
        0,
        1
      ),
      'tts'
    )

    this.engine.setAvatarBlendshape(
      'mouthPucker',
      THREE.MathUtils.clamp(
        pucker,
        0,
        1
      ),
      'tts'
    )
  }
}