import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";

import Avatar from "../avatar/Avatar";
import BlendshapeInspector from "../avatar/BlendshapeInspector";

export default function AvatarCanvas() {
  return (
    <Canvas
      camera={{
        position: [0, 0.15, 5],
        fov: 32,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
      dpr={[1, 1.5]}
    >
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
