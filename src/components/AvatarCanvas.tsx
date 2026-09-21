import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";

import Avatar from "../avatar/Avatar";
import BlendshapeInspector from "../avatar/BlendshapeInspector";

interface AvatarCanvasProps {
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

function CanvasBridge({
  onCanvasReady,
}: {
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    console.log("[AvatarCanvas] WebGL canvas ready");

    onCanvasReady?.(canvas);

    return () => {
      console.log("[AvatarCanvas] WebGL canvas released");

      onCanvasReady?.(null);
    };
  }, [gl, onCanvasReady]);

  return null;
}

export default function AvatarCanvas({ onCanvasReady }: AvatarCanvasProps) {
  return (
    <Canvas
      className="h-full w-full"
      camera={{
        position: [0, 0.15, 5],
        fov: 32,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
      dpr={[1, 1.5]}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
    >
      {/* Phase 10: expose WebGL canvas to WebRTC */}
      <CanvasBridge onCanvasReady={onCanvasReady} />

      <color attach="background" args={["#050505"]} />

      <ambientLight intensity={1} />

      <directionalLight position={[2, 3, 4]} intensity={2} />

      <Environment preset="studio" />

      <Avatar />

      <BlendshapeInspector />

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        target={[0, 0.1, 0]}
      />
    </Canvas>
  );
}
