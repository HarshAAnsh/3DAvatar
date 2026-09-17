import { useEffect, useRef, useState } from "react";

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

import { useHeadPoseStore } from "../store/headPoseStore";
import { useAvatarStore } from "../store/avatarStore";

export default function WebcamTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const lastVideoTimeRef = useRef(-1);

  const lastDetectionTimeRef = useRef(0);

  const detectionInterval = 50;

  const headMatrixLoggedRef = useRef(false);

  const previousFaceDetectedRef = useRef(false);

  const engine = useAvatarStore((state) => state.engine);

  const headPose = useAvatarStore((state) => state.headPose);

  const mode = useAvatarStore((state) => state.mode);

  /*
   * Keep the latest values inside refs so the
   * MediaPipe detection loop does not need to
   * restart when Live/Demo changes.
   */
  const modeRef = useRef(mode);

  const headPoseRef = useRef(headPose);

  const engineRef = useRef(engine);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    headPoseRef.current = headPose;
  }, [headPose]);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  /*
   * Get the setter directly from Zustand.
   *
   * This avoids the implicit-any issue around
   * the selector callback in an untyped store.
   */
  const setHeadTracking = useHeadPoseStore.getState().setTracking;

  const [cameraActive, setCameraActive] = useState(false);

  const [faceDetected, setFaceDetected] = useState(false);

  const [trackingReady, setTrackingReady] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const initialize = async () => {
      try {
        console.log("[MediaPipe] Initializing vision tasks...");

        /*
         * Load MediaPipe WASM
         */
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );

        if (cancelled) return;

        /*
         * Create Face Landmarker
         */
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
          },

          runningMode: "VIDEO",

          numFaces: 1,

          outputFaceBlendshapes: true,

          outputFacialTransformationMatrixes: true,
        });

        if (cancelled) {
          faceLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;

        setTrackingReady(true);

        console.log("[MediaPipe] Face Landmarker ready");

        /*
         * Camera
         */
        console.log("[Webcam] Requesting camera...");

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 640,
            },
            height: {
              ideal: 480,
            },
            facingMode: "user",
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());

          return;
        }

        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        if (cancelled) return;

        setCameraActive(true);

        console.log("[Webcam] Camera started");

        startDetection();
      } catch (err) {
        if (cancelled) return;

        console.error("[Webcam/MediaPipe] Error:", err);

        setError("Unable to start camera or MediaPipe.");
      }
    };

    /*
     * Detection loop
     */
    const startDetection = () => {
      const detectFrame = () => {
        if (cancelled) {
          return;
        }

        const video = videoRef.current;

        const landmarker = faceLandmarkerRef.current;

        if (!video || !landmarker) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);

          return;
        }

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          const now = performance.now();

          if (
            video.currentTime !== lastVideoTimeRef.current &&
            now - lastDetectionTimeRef.current >= detectionInterval
          ) {
            lastVideoTimeRef.current = video.currentTime;

            lastDetectionTimeRef.current = now;

            const result = landmarker.detectForVideo(video, now);

            const hasFace = result.faceLandmarks.length > 0;
            const currentHeadPose = headPoseRef.current;

            if (currentHeadPose) {
              currentHeadPose.setTrackingActive(
                modeRef.current === "live" && hasFace,
              );
            }
            /*
             * Face tracking state
             */
            if (hasFace !== previousFaceDetectedRef.current) {
              previousFaceDetectedRef.current = hasFace;

              setFaceDetected(hasFace);

              setHeadTracking(hasFace);
            }

            /*
             * HEAD POSE
             *
             * Only apply head pose in
             * Live mode.
             */
            if (
              modeRef.current === "live" &&
              hasFace &&
              result.facialTransformationMatrixes.length > 0
            ) {
              const matrix = result.facialTransformationMatrixes[0];

              const currentHeadPose = headPoseRef.current;

              if (currentHeadPose) {
                currentHeadPose.setMatrix(matrix.data);
              }

              if (!headMatrixLoggedRef.current) {
                headMatrixLoggedRef.current = true;

                console.log("[MediaPipe] Head pose matrix connected");
              }
            }

            const currentEngine = engineRef.current;

            /*
             * FACE BLENDSHAPES
             *
             * Only apply MediaPipe
             * facial data in Live mode.
             */
            if (
              modeRef.current === "live" &&
              hasFace &&
              result.faceBlendshapes.length > 0 &&
              currentEngine
            ) {
              const categories = result.faceBlendshapes[0].categories;

              for (const category of categories) {
                currentEngine.setARKitBlendshape(
                  category.categoryName,
                  category.score,
                  "mediapipe",
                );
              }
            }

            /*
             * When the user leaves Live mode,
             * remove old MediaPipe values.
             *
             * This is important because otherwise
             * previous facial values could remain
             * active while in Demo mode.
             */
            if (modeRef.current !== "live" && currentEngine) {
              currentEngine.clearSource("mediapipe");
            }

            /*
             * When no face is detected in Live mode,
             * clear MediaPipe facial values.
             */
            if (modeRef.current === "live" && !hasFace && currentEngine) {
              currentEngine.clearSource("mediapipe");
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    initialize();

    /*
     * Cleanup
     */
    return () => {
      console.log("[Webcam] Cleaning up");

      cancelled = true;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = null;
      }

      stream?.getTracks().forEach((track) => track.stop());

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      faceLandmarkerRef.current?.close();

      faceLandmarkerRef.current = null;

      previousFaceDetectedRef.current = false;

      headMatrixLoggedRef.current = false;

      setCameraActive(false);
      setTrackingReady(false);
      setFaceDetected(false);

      setHeadTracking(false);

      headPoseRef.current?.setTrackingActive(false);
    };
  }, []);

  return (
    <div
      className="
        absolute
        bottom-6
        left-5
        z-30
        w-64
        overflow-hidden
        rounded-xl
        border
        border-white/10
        bg-black/80
        shadow-2xl
        backdrop-blur-xl
      "
    >
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          muted
          playsInline
          className="
            h-full
            w-full
            object-cover
            -scale-x-100
          "
        />

        {!cameraActive && !error && (
          <div
            className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                text-xs
                text-zinc-400
              "
          >
            Starting camera...
          </div>
        )}

        {error && (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              p-3
              text-center
              text-xs
              text-red-400
            "
          >
            {error}
          </div>
        )}

        {cameraActive && (
          <div
            className="
              absolute
              left-2
              top-2
              flex
              items-center
              gap-1.5
              rounded-full
              bg-black/70
              px-2
              py-1
              text-[10px]
            "
          >
            <span
              className={faceDetected ? "text-green-400" : "text-yellow-400"}
            >
              ●
            </span>

            <span className="text-white">
              {faceDetected
                ? "FACE TRACKED"
                : trackingReady
                  ? "NO FACE"
                  : "LOADING"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
