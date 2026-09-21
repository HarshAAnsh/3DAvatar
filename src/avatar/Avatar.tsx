import { useEffect, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";

import { useGLTF } from "@react-three/drei";

import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { useAvatarStore } from "../store/avatarStore";

import { FacialAnimationEngine } from "./FacialAnimationEngine";
import { EmotionEngine } from "./EmotionEngine";
import { ProceduralBehavior } from "./ProceduralBehavior";
import { HeadMotion } from "./HeadMotion";
import { HeadPoseController } from "./HeadPoseController";
import { SpeechAnimation } from "./SpeechAnimation";

export default function Avatar() {
  const { gl } = useThree();

  // ============================================================
  // ZUSTAND
  // ============================================================

  const scene = useAvatarStore((state) => state.scene);

  const emotion = useAvatarStore((state) => state.emotion);

  const setScene = useAvatarStore((state) => state.setScene);

  const setEngine = useAvatarStore((state) => state.setEngine);

  const setHeadPose = useAvatarStore((state) => state.setHeadPose);

  const setSpeechAnimation = useAvatarStore(
    (state) => state.setSpeechAnimation,
  );

  // ============================================================
  // REFS
  // ============================================================

  const engineRef = useRef<FacialAnimationEngine | null>(null);

  const emotionEngineRef = useRef<EmotionEngine | null>(null);

  const behaviorRef = useRef<ProceduralBehavior | null>(null);

  const headMotionRef = useRef<HeadMotion | null>(null);

  const headPoseRef = useRef<HeadPoseController | null>(null);

  const speechAnimationRef = useRef<SpeechAnimation | null>(null);

  // ============================================================
  // LOAD GLB
  // ============================================================

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

  // ============================================================
  // INITIALIZE AVATAR
  //
  // IMPORTANT:
  // Do NOT put `emotion` in this dependency array.
  // Otherwise changing emotion destroys and recreates
  // SpeechAnimation, which interrupts TTS.
  // ============================================================

  useEffect(() => {
    if (!loadedScene) {
      return;
    }

    console.log("[Avatar] GLB loaded");

    // ----------------------------------------------------------
    // Scene
    // ----------------------------------------------------------

    setScene(loadedScene);

    // ----------------------------------------------------------
    // Facial engine
    // ----------------------------------------------------------

    const engine = new FacialAnimationEngine(loadedScene);

    // ----------------------------------------------------------
    // Emotion engine
    // ----------------------------------------------------------

    const emotionEngine = new EmotionEngine(engine);

    emotionEngineRef.current = emotionEngine;

    console.log("[Avatar] Emotion engine initialized");

    // ----------------------------------------------------------
    // Speech animation
    // ----------------------------------------------------------

    const speechAnimation = new SpeechAnimation(engine);

    speechAnimationRef.current = speechAnimation;

    setSpeechAnimation(speechAnimation);

    // ----------------------------------------------------------
    // Procedural facial behavior
    // ----------------------------------------------------------

    const behavior = new ProceduralBehavior(engine);

    // ----------------------------------------------------------
    // Head transform
    // ----------------------------------------------------------

    const headGroup = loadedScene.getObjectByName("grp_transform");

    if (!headGroup) {
      console.error("[Avatar] grp_transform not found");
    } else {
      console.log("[Avatar] Head transform found:", headGroup.name);
    }

    // ----------------------------------------------------------
    // Head pose
    // ----------------------------------------------------------

    const headPose = headGroup ? new HeadPoseController(headGroup) : null;

    // ----------------------------------------------------------
    // Head motion fallback
    // ----------------------------------------------------------

    const headMotion = headGroup ? new HeadMotion(headGroup) : null;

    // ----------------------------------------------------------
    // Save refs
    // ----------------------------------------------------------

    engineRef.current = engine;

    behaviorRef.current = behavior;

    headMotionRef.current = headMotion;

    headPoseRef.current = headPose;

    // ----------------------------------------------------------
    // Register systems
    // ----------------------------------------------------------

    setEngine(engine);

    if (headPose) {
      setHeadPose(headPose);

      console.log("[Avatar] Head pose controller initialized");
    }

    console.log("[Avatar] Facial engine initialized");

    console.log("[Avatar] Procedural behavior initialized");

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      console.log("[Avatar] Cleaning up animation engine");

      headPoseRef.current?.reset();

      headMotionRef.current?.reset();

      speechAnimationRef.current?.stop();

      emotionEngineRef.current?.reset();

      setSpeechAnimation(null);

      speechAnimationRef.current = null;

      emotionEngineRef.current = null;

      behaviorRef.current = null;

      headMotionRef.current = null;

      headPoseRef.current = null;

      engineRef.current = null;

      engine.reset();
    };
  }, [loadedScene, setScene, setEngine, setHeadPose, setSpeechAnimation]);

  // ============================================================
  // EMOTION SYNCHRONIZATION
  //
  // This runs when emotion changes.
  // It does NOT recreate the avatar.
  // ============================================================

  useEffect(() => {
    const emotionEngine = emotionEngineRef.current;

    if (!emotionEngine) {
      return;
    }

    emotionEngine.setEmotion(emotion);
  }, [emotion]);

  // ============================================================
  // ANIMATION LOOP
  // ============================================================

  useFrame((state, delta) => {
    const engine = engineRef.current;

    const emotionEngine = emotionEngineRef.current;

    const behavior = behaviorRef.current;

    const headMotion = headMotionRef.current;

    const headPose = headPoseRef.current;

    const speechAnimation = speechAnimationRef.current;

    if (!engine) {
      return;
    }

    // --------------------------------------------------------
    // Emotion
    // --------------------------------------------------------

    emotionEngine?.update(delta);

    // --------------------------------------------------------
    // Procedural facial behavior
    // --------------------------------------------------------

    behavior?.update(delta, state.clock.elapsedTime);

    // --------------------------------------------------------
    // Head tracking / fallback motion
    // --------------------------------------------------------

    if (headPose && headPose.isTrackingActive()) {
      headPose.update(delta);
    } else {
      headMotion?.update(delta, state.clock.elapsedTime);
    }

    // --------------------------------------------------------
    // Speech / lip sync
    // --------------------------------------------------------

    speechAnimation?.update(delta);

    // --------------------------------------------------------
    // Final blendshape application
    // --------------------------------------------------------

    engine.update();
  });

  // ============================================================
  // RENDER
  // ============================================================

  if (!scene) {
    return null;
  }

  return <primitive object={scene} scale={0.86} position={[0, 0.05, 0]} />;
}
