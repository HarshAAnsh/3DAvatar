export interface RuntimeCapabilities {
  webgl2: boolean
  gpu: string
  cameraApi: boolean
  speechSynthesis: boolean
}

export function detectRuntimeCapabilities(): RuntimeCapabilities {
  let webgl2 = false
  let gpu = 'Unknown'

  try {
    const canvas =
      document.createElement('canvas')

    const gl =
      canvas.getContext('webgl2')

    webgl2 = Boolean(gl)

    if (gl) {
      const debugInfo =
        gl.getExtension(
          'WEBGL_debug_renderer_info'
        )

      if (debugInfo) {
        gpu =
          gl.getParameter(
            debugInfo.UNMASKED_RENDERER_WEBGL
          ) || 'Unknown'
      }

      gl.getExtension(
        'WEBGL_lose_context'
      )?.loseContext()
    }
  } catch {
    webgl2 = false
  }

  return {
    webgl2,

    gpu,

    cameraApi:
      Boolean(
        navigator.mediaDevices?.getUserMedia
      ),

    speechSynthesis:
      'speechSynthesis' in window,
  }
}