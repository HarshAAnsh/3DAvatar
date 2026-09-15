import { useEffect, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";

import { useGLTF } from "@react-three/drei";

import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { useAvatarStore } from "../store/avatarStore";

import { FacialAnimationEngine } from "./FacialAnimationEngine";

import { ProceduralBehavior } from "./ProceduralBehavior";

import { HeadMotion } from "./HeadMotion";

import { HeadPoseController } from "./HeadPoseController";

import { SpeechAnimation } from "./SpeechAnimation";

export default function Avatar() {
  const { gl } = useThree();

  // --------------------------------------------------
  // Zustand
  // --------------------------------------------------

  const scene = useAvatarStore((state) => state.scene);

  const setScene = useAvatarStore((state) => state.setScene);

  const setEngine = useAvatarStore((state) => state.setEngine);

  const setHeadPose = useAvatarStore((state) => state.setHeadPose);

  // --------------------------------------------------
  // Animation references
  // --------------------------------------------------

  const engineRef = useRef<FacialAnimationEngine | null>(null);

  const behaviorRef = useRef<ProceduralBehavior | null>(null);

  const headMotionRef = useRef<HeadMotion | null>(null);

  const headPoseRef = useRef<HeadPoseController | null>(null);

  const speechAnimationRef = useRef<SpeechAnimation | null>(null);

  // --------------------------------------------------
  // Load GLB
  // --------------------------------------------------

  const { scene: loadedScene } = useGLTF(
    "/avatars/facecap.glb",
    true,
    true,
    (loader) => {
      const ktx2Loader = new KTX2Loader()
        .setTranscoderPath("/basis/")
        .detectSupport(gl);

      loader.setKTX2Loader(ktx2Loader as any);
    },
  );

  // --------------------------------------------------
  // Initialize avatar systems
  // --------------------------------------------------

  useEffect(() => {
    if (!loadedScene) {
      return;
    }

    console.log("[Avatar] GLB loaded");

    // -----------------------------------------------
    // Facial animation engine
    // -----------------------------------------------

    setScene(loadedScene);

    const engine = new FacialAnimationEngine(loadedScene);

    // -----------------------------------------------
    // Speech animation
    // -----------------------------------------------

    const speechAnimation = new SpeechAnimation(engine);

    speechAnimationRef.current = speechAnimation;

    // -----------------------------------------------
    // Procedural behavior
    // -----------------------------------------------

    const behavior = new ProceduralBehavior(engine);

    // -----------------------------------------------
    // Find head transform
    // -----------------------------------------------

    const headGroup = loadedScene.getObjectByName("grp_transform");

    if (!headGroup) {
      console.error("[Avatar] grp_transform not found");
    } else {
      console.log("[Avatar] Head transform found:", headGroup.name);
    }

    // -----------------------------------------------
    // Head pose controller
    // -----------------------------------------------

    const headPose = headGroup ? new HeadPoseController(headGroup) : null;

    // -----------------------------------------------
    // Procedural head motion
    // -----------------------------------------------

    const headMotion = headGroup ? new HeadMotion(headGroup) : null;

    // -----------------------------------------------
    // Store references
    // -----------------------------------------------

    engineRef.current = engine;

    behaviorRef.current = behavior;

    headMotionRef.current = headMotion;

    headPoseRef.current = headPose;

    setEngine(engine);

    // -----------------------------------------------
    // Register head pose
    // -----------------------------------------------

    if (headPose) {
      setHeadPose(headPose);

      console.log("[Avatar] Head pose controller initialized");
    }

    console.log("[Avatar] Facial engine initialized");

    console.log("[Avatar] Procedural behavior initialized");

    // -----------------------------------------------
    // Cleanup
    // -----------------------------------------------

    return () => {
      console.log("[Avatar] Cleaning up animation engine");

      headPoseRef.current?.reset();

      headMotionRef.current?.reset();

      speechAnimationRef.current = null;

      behaviorRef.current = null;

      engineRef.current = null;

      headMotionRef.current = null;

      headPoseRef.current = null;

      engine.reset();
    };
  }, [loadedScene, setScene, setEngine, setHeadPose]);

  // --------------------------------------------------
  // Animation loop
  // --------------------------------------------------

  useFrame((state, delta) => {
    const behavior = behaviorRef.current;

    const engine = engineRef.current;

    const headMotion = headMotionRef.current;

    const headPose = headPoseRef.current;

    const speechAnimation = speechAnimationRef.current;

    // ---------------------------------------------
    // Nothing initialized yet
    // ---------------------------------------------

    if (!engine) {
      return;
    }

    // ---------------------------------------------
    // Procedural facial behavior
    // ---------------------------------------------

    if (behavior) {
      behavior.update(delta, state.clock.elapsedTime);
    }

    // ---------------------------------------------
    // Real MediaPipe head pose
    // ---------------------------------------------

    if (headPose) {
      headPose.update(delta);
    } else if (headMotion) {
      // Fallback only if HeadPoseController
      // isn't available.

      headMotion.update(delta, state.clock.elapsedTime);
    }

    // ---------------------------------------------
    // Speech / mouth animation
    // ---------------------------------------------

    if (speechAnimation) {
      speechAnimation.update(delta);
    }

    // ---------------------------------------------
    // Apply final blendshapes
    // ---------------------------------------------

    engine.update();
  });

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  if (!scene) {
    return null;
  }

  return <primitive object={scene} scale={0.78} position={[0, 0.25, 0]} />;
}
