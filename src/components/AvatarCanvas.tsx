import {
  useEffect,
  useRef,
} from "react";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  Environment,
  OrbitControls,
} from "@react-three/drei";

import Avatar from "../avatar/Avatar";
import BlendshapeInspector from "../avatar/BlendshapeInspector";

interface AvatarCanvasProps {
  onCanvasReady?: (
    canvas: HTMLCanvasElement | null
  ) => void;
}

interface ThreePerformanceMetrics {
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
  canvasWidth: number;
  canvasHeight: number;
}

/*
 * ============================================================
 * CANVAS BRIDGE
 *
 * Exposes:
 * 1. HTML canvas → WebRTC
 * 2. Three.js renderer metrics → PerformanceMonitor
 * ============================================================
 */

function CanvasBridge({
  onCanvasReady,
}: {
  onCanvasReady?: (
    canvas: HTMLCanvasElement | null
  ) => void;
}) {
  const {
    gl,
  } = useThree();

  const lastMetricsTimeRef =
    useRef(0);

  /*
   * ----------------------------------------------------------
   * Expose canvas to parent / WebRTC
   * ----------------------------------------------------------
   */

  useEffect(() => {
    const canvas =
      gl.domElement;

    console.log(
      "[AvatarCanvas] WebGL canvas ready"
    );

    onCanvasReady?.(
      canvas
    );

    return () => {
      console.log(
        "[AvatarCanvas] WebGL canvas released"
      );

      onCanvasReady?.(
        null
      );
    };
  }, [
    gl,
    onCanvasReady,
  ]);

  /*
   * ----------------------------------------------------------
   * Three.js runtime telemetry
   *
   * We collect this at most twice per second so the
   * instrumentation itself doesn't create significant
   * overhead.
   * ----------------------------------------------------------
   */

  useFrame(() => {
    const now =
      performance.now();

    if (
      now -
        lastMetricsTimeRef.current <
      500
    ) {
      return;
    }

    lastMetricsTimeRef.current =
      now;

    const info =
      gl.info;

    const metrics: ThreePerformanceMetrics =
      {
        /*
         * Render statistics
         */
        drawCalls:
          info.render.calls,

        triangles:
          info.render.triangles,

        points:
          info.render.points,

        lines:
          info.render.lines,

        /*
         * GPU memory usage tracked by Three.js
         */
        geometries:
          info.memory.geometries,

        textures:
          info.memory.textures,

        /*
         * Actual renderer pixel ratio
         */
        pixelRatio:
          gl.getPixelRatio(),

        /*
         * Actual drawing-buffer dimensions
         *
         * canvas.clientWidth/clientHeight are CSS
         * dimensions, while width/height represent
         * the actual WebGL drawing buffer.
         */
        canvasWidth:
          gl.domElement.width,

        canvasHeight:
          gl.domElement.height,
      };

    /*
     * Send to PerformanceMonitor.
     */
    window.dispatchEvent(
      new CustomEvent(
        "avatar:three-metrics",
        {
          detail: metrics,
        }
      )
    );
  });

  return null;
}

/*
 * ============================================================
 * MAIN AVATAR CANVAS
 * ============================================================
 */

export default function AvatarCanvas({
  onCanvasReady,
}: AvatarCanvasProps) {
  return (
    <Canvas
      className="
        h-full
        w-full
      "
      camera={{
        position: [
          0,
          0.15,
          5,
        ],
        fov: 32,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
      dpr={[
        1,
        1.5,
      ]}
      resize={{
        scroll: false,
        debounce: {
          scroll: 50,
          resize: 0,
        },
      }}
    >
      {/* =====================================================
          CANVAS BRIDGE
      ====================================================== */}

      <CanvasBridge
        onCanvasReady={
          onCanvasReady
        }
      />

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <color
        attach="background"
        args={[
          "#050505",
        ]}
      />

      {/* =====================================================
          LIGHTING
      ====================================================== */}

      <ambientLight
        intensity={1}
      />

      <directionalLight
        position={[
          2,
          3,
          4,
        ]}
        intensity={2}
      />

      <Environment
        preset="studio"
      />

      {/* =====================================================
          AVATAR
      ====================================================== */}

      <Avatar />

      {/* =====================================================
          DEBUG / INSPECTION
      ====================================================== */}

      <BlendshapeInspector />

      {/* =====================================================
          CAMERA CONTROL
      ====================================================== */}

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        target={[
          0,
          0.1,
          0,
        ]}
      />
    </Canvas>
  );
}