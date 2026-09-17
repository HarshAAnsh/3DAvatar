export interface RuntimeCapabilities {
  webgl2: boolean;
  gpu: string;
  cameraApi: boolean;
  speechSynthesis: boolean;
}

export function detectRuntimeCapabilities(): RuntimeCapabilities {
  let webgl2 = false;
  let gpu = "Unknown";

  try {
    const canvas = document.createElement("canvas");

    const gl = canvas.getContext("webgl2");

    if (gl) {
      webgl2 = true;

      /*
       * Modern WebGL2 exposes RENDERER
       * through getParameter in browsers
       * that support it.
       */
      try {
        const renderer = gl.getParameter(gl.RENDERER);

        if (typeof renderer === "string" && renderer.trim()) {
          gpu = renderer;
        }
      } catch {
        gpu = "WebGL 2 renderer";
      }
    }
  } catch {
    webgl2 = false;
  }

  return {
    webgl2,

    gpu,

    cameraApi: Boolean(navigator.mediaDevices?.getUserMedia),

    speechSynthesis: "speechSynthesis" in window,
  };
}
