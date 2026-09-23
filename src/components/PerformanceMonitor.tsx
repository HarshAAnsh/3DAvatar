import {
  useEffect,
  useRef,
  useState,
} from "react";

type ThreePerformanceMetrics = {
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
  canvasWidth: number;
  canvasHeight: number;
};

type PerformanceMetrics = {
  fps: number;
  frameTime: number;

  mediaPipeFps: number;
  webRtcFps: number;

  canvasWidth: number;
  canvasHeight: number;

  gpu: string;

  /*
   * Three.js renderer metrics
   */
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
};

const EMPTY_METRICS: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,

  mediaPipeFps: 0,
  webRtcFps: 0,

  canvasWidth: 0,
  canvasHeight: 0,

  gpu: "Unknown",

  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  geometries: 0,
  textures: 0,
  pixelRatio: 0,
};

/*
 * ============================================================
 * GPU
 * ============================================================
 */

function getGpuInfo(): string {
  try {
    const canvas =
      document.createElement(
        "canvas",
      );

    const gl =
      (canvas.getContext(
        "webgl2",
      ) ||
        canvas.getContext(
          "webgl",
        ) ||
        canvas.getContext(
          "experimental-webgl",
        )) as
        | WebGLRenderingContext
        | null;

    if (!gl) {
      return "WebGL unavailable";
    }

    const debugInfo =
      gl.getExtension(
        "WEBGL_debug_renderer_info",
      );

    if (debugInfo) {
      const renderer =
        gl.getParameter(
          debugInfo.UNMASKED_RENDERER_WEBGL,
        );

      if (
        typeof renderer ===
          "string" &&
        renderer.trim()
      ) {
        return renderer;
      }
    }

    const renderer =
      gl.getParameter(
        gl.RENDERER,
      );

    return typeof renderer ===
      "string"
      ? renderer
      : "WebGL";
  } catch {
    return "Unknown";
  }
}

/*
 * ============================================================
 * FORMATTERS
 * ============================================================
 */

function formatNumber(
  value: number,
): string {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "--";
  }

  return String(
    Math.round(value),
  );
}

function formatResolution(
  width: number,
  height: number,
): string {
  if (
    width <= 0 ||
    height <= 0
  ) {
    return "--";
  }

  return `${width}×${height}`;
}

function formatGpu(
  gpu: string,
): string {
  if (
    !gpu ||
    gpu === "Unknown"
  ) {
    return "Unknown";
  }

  if (
    gpu.length <= 28
  ) {
    return gpu;
  }

  return `${gpu.slice(
    0,
    25,
  )}...`;
}

/*
 * ============================================================
 * PERFORMANCE MONITOR
 * ============================================================
 */

export default function PerformanceMonitor() {
  const [
    metrics,
    setMetrics,
  ] =
    useState<PerformanceMetrics>(
      EMPTY_METRICS,
    );

  /*
   * ==========================================================
   * MAIN THREAD / RAF
   * ==========================================================
   */

  const mainFrameCountRef =
    useRef(0);

  const mainLastTimeRef =
    useRef(
      performance.now(),
    );

  /*
   * ==========================================================
   * MEDIAPIPE
   * ==========================================================
   */

  const mediaPipeFrameCountRef =
    useRef(0);

  /*
   * ==========================================================
   * WEBRTC
   * ==========================================================
   */

  const webRtcFrameCountRef =
    useRef(0);

  /*
   * ==========================================================
   * RAF
   * ==========================================================
   */

  const animationFrameRef =
    useRef<number | null>(
      null,
    );

  /*
   * ==========================================================
   * THREE.JS METRICS
   * ==========================================================
   */

  const threeMetricsRef =
    useRef<ThreePerformanceMetrics>(
      {
        drawCalls: 0,
        triangles: 0,
        points: 0,
        lines: 0,
        geometries: 0,
        textures: 0,
        pixelRatio: 0,
        canvasWidth: 0,
        canvasHeight: 0,
      },
    );

  /*
   * ==========================================================
   * EFFECT
   * ==========================================================
   */

  useEffect(() => {
    let mounted = true;

    /*
     * --------------------------------------------------------
     * MEDIAPIPE EVENT
     * --------------------------------------------------------
     */

    const mediaPipeListener =
      () => {
        mediaPipeFrameCountRef.current +=
          1;
      };

    /*
     * --------------------------------------------------------
     * WEBRTC VIDEO EVENT
     * --------------------------------------------------------
     */

    const webRtcListener =
      () => {
        webRtcFrameCountRef.current +=
          1;
      };

    /*
     * --------------------------------------------------------
     * THREE.JS EVENT
     * --------------------------------------------------------
     */

    const threeMetricsListener =
      (event: Event) => {
        const customEvent =
          event as CustomEvent<
            ThreePerformanceMetrics
          >;

        const detail =
          customEvent.detail;

        if (!detail) {
          return;
        }

        threeMetricsRef.current =
          detail;

        /*
         * Update these values immediately
         * rather than waiting for the 1-second
         * FPS reporting window.
         */

        if (mounted) {
          setMetrics(
            (previous) => ({
              ...previous,

              drawCalls:
                detail.drawCalls,

              triangles:
                detail.triangles,

              points:
                detail.points,

              lines:
                detail.lines,

              geometries:
                detail.geometries,

              textures:
                detail.textures,

              pixelRatio:
                detail.pixelRatio,

              canvasWidth:
                detail.canvasWidth,

              canvasHeight:
                detail.canvasHeight,
            }),
          );
        }
      };

    /*
     * --------------------------------------------------------
     * REGISTER EVENTS
     * --------------------------------------------------------
     */

    window.addEventListener(
      "avatar:mediapipe-frame",
      mediaPipeListener,
    );

    window.addEventListener(
      "avatar:webrtc-frame",
      webRtcListener,
    );

    window.addEventListener(
      "avatar:three-metrics",
      threeMetricsListener,
    );

    /*
     * --------------------------------------------------------
     * GPU
     * --------------------------------------------------------
     */

    const gpu =
      getGpuInfo();

    /*
     * --------------------------------------------------------
     * CANVAS
     * --------------------------------------------------------
     */

    const updateCanvasMetrics =
      () => {
        const canvas =
          document.querySelector(
            "canvas",
          ) as
            | HTMLCanvasElement
            | null;

        if (!canvas) {
          return;
        }

        /*
         * Use actual drawing buffer size.
         */
        const width =
          canvas.width;

        const height =
          canvas.height;

        setMetrics(
          (previous) => ({
            ...previous,

            canvasWidth:
              width,

            canvasHeight:
              height,

            gpu:
              previous.gpu ===
              "Unknown"
                ? gpu
                : previous.gpu,
          }),
        );
      };

    updateCanvasMetrics();

    /*
     * --------------------------------------------------------
     * RESIZE OBSERVER
     * --------------------------------------------------------
     */

    let canvasObserver:
      | ResizeObserver
      | null = null;

    const canvas =
      document.querySelector(
        "canvas",
      );

    if (
      canvas &&
      typeof ResizeObserver !==
        "undefined"
    ) {
      canvasObserver =
        new ResizeObserver(
          () => {
            updateCanvasMetrics();
          },
        );

      canvasObserver.observe(
        canvas,
      );
    }

    /*
     * --------------------------------------------------------
     * PERIODIC CANVAS CHECK
     *
     * Also catches changes to canvas.width / height
     * that don't necessarily trigger ResizeObserver.
     * --------------------------------------------------------
     */

    const canvasInterval =
      window.setInterval(
        updateCanvasMetrics,
        1000,
      );

    /*
     * --------------------------------------------------------
     * MAIN FPS LOOP
     * --------------------------------------------------------
     */

    const measure =
      (time: number) => {
        if (!mounted) {
          return;
        }

        mainFrameCountRef.current +=
          1;

        const elapsed =
          time -
          mainLastTimeRef.current;

        if (
          elapsed >=
          1000
        ) {
          /*
           * Main browser FPS
           */
          const currentFps =
            (mainFrameCountRef.current *
              1000) /
            elapsed;

          /*
           * Average frame time
           */
          const currentFrameTime =
            currentFps >
            0
              ? 1000 /
                currentFps
              : 0;

          /*
           * MediaPipe observed FPS
           */
          const currentMediaPipeFps =
            (mediaPipeFrameCountRef.current *
              1000) /
            elapsed;

          /*
           * WebRTC observed FPS
           */
          const currentWebRtcFps =
            (webRtcFrameCountRef.current *
              1000) /
            elapsed;

          /*
           * Capture latest Three.js metrics.
           */
          const three =
            threeMetricsRef.current;

          setMetrics(
            (previous) => ({
              ...previous,

              fps:
                currentFps,

              frameTime:
                currentFrameTime,

              mediaPipeFps:
                currentMediaPipeFps,

              webRtcFps:
                currentWebRtcFps,

              drawCalls:
                three.drawCalls,

              triangles:
                three.triangles,

              points:
                three.points,

              lines:
                three.lines,

              geometries:
                three.geometries,

              textures:
                three.textures,

              pixelRatio:
                three.pixelRatio,

              canvasWidth:
                three.canvasWidth ||
                previous.canvasWidth,

              canvasHeight:
                three.canvasHeight ||
                previous.canvasHeight,

              gpu:
                previous.gpu ===
                "Unknown"
                  ? gpu
                  : previous.gpu,
            }),
          );

          /*
           * Reset counters.
           */
          mainFrameCountRef.current =
            0;

          mediaPipeFrameCountRef.current =
            0;

          webRtcFrameCountRef.current =
            0;

          mainLastTimeRef.current =
            time;
        }

        animationFrameRef.current =
          requestAnimationFrame(
            measure,
          );
      };

    animationFrameRef.current =
      requestAnimationFrame(
        measure,
      );

    /*
     * --------------------------------------------------------
     * CLEANUP
     * --------------------------------------------------------
     */

    return () => {
      mounted = false;

      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        );

        animationFrameRef.current =
          null;
      }

      if (
        canvasObserver
      ) {
        canvasObserver.disconnect();
      }

      window.clearInterval(
        canvasInterval,
      );

      window.removeEventListener(
        "avatar:mediapipe-frame",
        mediaPipeListener,
      );

      window.removeEventListener(
        "avatar:webrtc-frame",
        webRtcListener,
      );

      window.removeEventListener(
        "avatar:three-metrics",
        threeMetricsListener,
      );
    };
  }, []);

  /*
   * ==========================================================
   * PERFORMANCE STATE
   * ==========================================================
   */

  const performanceState =
    metrics.fps >=
    50
      ? "GOOD"
      : metrics.fps >=
          30
        ? "FAIR"
        : metrics.fps > 0
          ? "LOW"
          : "WAIT";

  const performanceClass =
    performanceState ===
    "GOOD"
      ? "text-green-400"
      : performanceState ===
          "FAIR"
        ? "text-yellow-400"
        : performanceState ===
            "LOW"
          ? "text-red-400"
          : "text-zinc-500";

  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <aside
      className="
        w-full
        shrink-0

        rounded-xl

        border
        border-white/10

        bg-black/80

        p-3

        text-white

        shadow-xl

        backdrop-blur-xl
      "
    >
      {/* ====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          mb-3

          flex
          items-center
          justify-between
        "
      >
        <div>
          <p
            className="
              text-xs
              font-semibold
            "
          >
            Performance
          </p>

          <p
            className="
              mt-0.5
              text-[10px]
              text-zinc-600
            "
          >
            Real-time runtime metrics
          </p>
        </div>

        <span
          className={`
            text-[10px]
            font-mono
            font-medium

            ${performanceClass}
          `}
        >
          {performanceState}
        </span>
      </div>

      {/* ====================================================
          MAIN METRICS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-2
        "
      >
        <Metric
          label="Main FPS"
          value={
            metrics.fps >
            0
              ? formatNumber(
                  metrics.fps,
                )
              : "--"
          }
        />

        <Metric
          label="Frame"
          value={
            metrics.frameTime >
            0
              ? `${metrics.frameTime.toFixed(
                  1,
                )} ms`
              : "--"
          }
        />

        <Metric
          label="MediaPipe"
          value={
            metrics.mediaPipeFps >
            0
              ? `${formatNumber(
                  metrics.mediaPipeFps,
                )} FPS`
              : "--"
          }
        />

        <Metric
          label="WebRTC"
          value={
            metrics.webRtcFps >
            0
              ? `${formatNumber(
                  metrics.webRtcFps,
                )} FPS`
              : "--"
          }
        />

        <Metric
          label="Canvas"
          value={formatResolution(
            metrics.canvasWidth,
            metrics.canvasHeight,
          )}
        />

        <Metric
          label="Pixel Ratio"
          value={
            metrics.pixelRatio >
            0
              ? metrics.pixelRatio.toFixed(
                  2,
                )
              : "--"
          }
        />
      </div>

      {/* ====================================================
          THREE.JS RENDERER
      ===================================================== */}

      <div
        className="
          mt-3

          border-t
          border-white/10

          pt-3
        "
      >
        <p
          className="
            mb-2

            text-[10px]
            font-semibold
            uppercase
            tracking-wide

            text-zinc-500
          "
        >
          Three.js Renderer
        </p>

        <div
          className="
            grid
            grid-cols-2
            gap-2
          "
        >
          <Metric
            label="Draw Calls"
            value={formatNumber(
              metrics.drawCalls,
            )}
          />

          <Metric
            label="Triangles"
            value={formatNumber(
              metrics.triangles,
            )}
          />

          <Metric
            label="Geometries"
            value={formatNumber(
              metrics.geometries,
            )}
          />

          <Metric
            label="Textures"
            value={formatNumber(
              metrics.textures,
            )}
          />

          <Metric
            label="Points"
            value={formatNumber(
              metrics.points,
            )}
          />

          <Metric
            label="Lines"
            value={formatNumber(
              metrics.lines,
            )}
          />
        </div>
      </div>

      {/* ====================================================
          GPU
      ===================================================== */}

      <div
        className="
          mt-3

          border-t
          border-white/10

          pt-3
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <span
            className="
              text-[10px]
              text-zinc-500
            "
          >
            GPU
          </span>

          <span
            className="
              max-w-[65%]
              truncate

              text-right

              font-mono
              text-[10px]
              text-zinc-300
            "
            title={metrics.gpu}
          >
            {formatGpu(
              metrics.gpu,
            )}
          </span>
        </div>
      </div>

      {/* ====================================================
          INTERPRETATION
      ===================================================== */}

      <div
        className="
          mt-3

          border-t
          border-white/10

          pt-2
        "
      >
        <p
          className="
            text-[9px]
            leading-relaxed
            text-zinc-600
          "
        >
          Main FPS measures browser
          animation-loop responsiveness.
          MediaPipe and WebRTC show observed
          processing/frame rates. Three.js
          values come from renderer statistics.
        </p>
      </div>
    </aside>
  );
}

/*
 * ============================================================
 * METRIC COMPONENT
 * ============================================================
 */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-0

        rounded-lg

        border
        border-white/5

        bg-white/[0.02]

        px-2.5
        py-2
      "
    >
      <div
        className="
          truncate

          text-[9px]
          uppercase
          tracking-wide

          text-zinc-600
        "
      >
        {label}
      </div>

      <div
        className="
          mt-1

          truncate

          font-mono
          text-[11px]

          text-zinc-200
        "
        title={value}
      >
        {value}
      </div>
    </div>
  );
}