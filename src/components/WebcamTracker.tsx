import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useHeadPoseStore,
} from "../store/headPoseStore";

import {
  useAvatarStore,
} from "../store/avatarStore";

import {
  MediaPipeWorkerClient,
  type MediaPipeWorkerResult,
} from "../avatar/MediaPipeWorkerClient";

type WebcamTrackerProps = {
  enabled?: boolean;
};

export default function WebcamTracker({
  enabled = false,
}: WebcamTrackerProps) {
  /*
   * ============================================================
   * VIDEO
   * ============================================================
   */

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  /*
   * ============================================================
   * WORKER CLIENT
   * ============================================================
   */

  const workerClientRef =
    useRef<MediaPipeWorkerClient | null>(
      null,
    );

  /*
   * ============================================================
   * DETECTION LOOP
   * ============================================================
   */

  const animationFrameRef =
    useRef<number | null>(
      null,
    );

  const lastVideoTimeRef =
    useRef(-1);

  const lastDetectionTimeRef =
    useRef(0);

  /*
   * ~8 inference requests/sec.
   */
  const detectionInterval =
    125;

  /*
   * ============================================================
   * STATE REFS
   * ============================================================
   */

  const previousFaceDetectedRef =
    useRef(false);

  const headMatrixLoggedRef =
    useRef(false);

  /*
   * ============================================================
   * AVATAR STORE
   * ============================================================
   */

  const engine =
    useAvatarStore(
      (state) => state.engine,
    );

  const headPose =
    useAvatarStore(
      (state) => state.headPose,
    );

  const mode =
    useAvatarStore(
      (state) => state.mode,
    );

  /*
   * ============================================================
   * LATEST STATE REFS
   * ============================================================
   */

  const modeRef =
    useRef(mode);

  const engineRef =
    useRef(engine);

  const headPoseRef =
    useRef(headPose);

  useEffect(() => {
    modeRef.current =
      mode;
  }, [mode]);

  useEffect(() => {
    engineRef.current =
      engine;
  }, [engine]);

  useEffect(() => {
    headPoseRef.current =
      headPose;
  }, [headPose]);

  /*
   * ============================================================
   * HEAD TRACKING
   * ============================================================
   */

  const setHeadTracking =
    useHeadPoseStore
      .getState()
      .setTracking;

  /*
   * ============================================================
   * UI STATE
   * ============================================================
   */

  const [
    cameraActive,
    setCameraActive,
  ] =
    useState(false);

  const [
    faceDetected,
    setFaceDetected,
  ] =
    useState(false);

  const [
    trackingReady,
    setTrackingReady,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  /*
   * ============================================================
   * APPLY WORKER RESULT
   * ============================================================
   */

  const applyWorkerResult =
    (
      result: MediaPipeWorkerResult,
    ) => {
      const {
        faceDetected:
          hasFace,
        blendshapes,
        headMatrix,
      } = result;

      const currentEngine =
        engineRef.current;

      const currentHeadPose =
        headPoseRef.current;

      /*
       * --------------------------------------------------------
       * PERFORMANCE TELEMETRY
       * --------------------------------------------------------
       */

      window.dispatchEvent(
        new CustomEvent(
          "avatar:mediapipe-frame",
        ),
      );

      /*
       * --------------------------------------------------------
       * HEAD TRACKING
       * --------------------------------------------------------
       */

      if (
        currentHeadPose
      ) {
        currentHeadPose.setTrackingActive(
          modeRef.current ===
            "live" &&
          hasFace,
        );
      }

      /*
       * --------------------------------------------------------
       * FACE PRESENCE
       * --------------------------------------------------------
       */

      if (
        hasFace !==
        previousFaceDetectedRef.current
      ) {
        previousFaceDetectedRef.current =
          hasFace;

        setFaceDetected(
          hasFace,
        );

        setHeadTracking(
          modeRef.current ===
            "live" &&
          hasFace,
        );
      }

      /*
       * --------------------------------------------------------
       * HEAD POSE
       * --------------------------------------------------------
       */

      if (
        modeRef.current ===
          "live" &&
        hasFace &&
        headMatrix
      ) {
        currentHeadPose?.setMatrix(
          headMatrix,
        );

        if (
          !headMatrixLoggedRef.current
        ) {
          headMatrixLoggedRef.current =
            true;

          console.log(
            "[MediaPipe Worker] Head pose matrix connected",
          );
        }
      }

      /*
       * --------------------------------------------------------
       * ARKIT 52 BLENDSHAPES
       * --------------------------------------------------------
       */

      if (
        modeRef.current ===
          "live" &&
        hasFace &&
        currentEngine
      ) {
        for (
          const category of
            blendshapes
        ) {
          currentEngine.setARKitBlendshape(
            category.categoryName,
            category.score,
            "mediapipe",
          );
        }
      }

      /*
       * --------------------------------------------------------
       * NO FACE
       * --------------------------------------------------------
       */

      if (
        modeRef.current ===
          "live" &&
        !hasFace
      ) {
        currentEngine?.clearSource(
          "mediapipe",
        );
      }

      /*
       * --------------------------------------------------------
       * NON-LIVE SAFETY
       * --------------------------------------------------------
       */

      if (
        modeRef.current !==
        "live"
      ) {
        currentEngine?.clearSource(
          "mediapipe",
        );

        currentHeadPose?.setTrackingActive(
          false,
        );
      }
    };

  /*
   * ============================================================
   * CAMERA + WORKER LIFECYCLE
   * ============================================================
   */

  useEffect(() => {
    /*
     * ========================================================
     * DISABLED
     * ========================================================
     */

    if (!enabled) {
      console.log(
        "[Webcam] Disabled - skipping camera and MediaPipe",
      );

      /*
       * Stop RAF.
       */

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

      /*
       * Destroy worker.
       */

      workerClientRef.current?.destroy();

      workerClientRef.current =
        null;

      /*
       * Stop camera.
       */

      if (
        videoRef.current
      ) {
        videoRef.current.pause();

        const source =
          videoRef.current
            .srcObject;

        if (
          source instanceof
          MediaStream
        ) {
          source
            .getTracks()
            .forEach(
              (track) =>
                track.stop(),
            );
        }

        videoRef.current.srcObject =
          null;
      }

      /*
       * Clear state.
       */

      engineRef.current?.clearSource(
        "mediapipe",
      );

      setHeadTracking(
        false,
      );

      headPoseRef.current?.setTrackingActive(
        false,
      );

      previousFaceDetectedRef.current =
        false;

      headMatrixLoggedRef.current =
        false;

      lastVideoTimeRef.current =
        -1;

      lastDetectionTimeRef.current =
        0;

      setCameraActive(
        false,
      );

      setTrackingReady(
        false,
      );

      setFaceDetected(
        false,
      );

      setError(
        null,
      );

      return;
    }

    /*
     * ========================================================
     * ENABLED
     * ========================================================
     */

    let stream:
      | MediaStream
      | null = null;

    let cancelled = false;

    /*
     * ========================================================
     * CREATE WORKER CLIENT
     * ========================================================
     */

    const workerClient =
      new MediaPipeWorkerClient();

    workerClientRef.current =
      workerClient;

    /*
     * Worker result callback.
     */

    workerClient.onResult(
      (
        result,
      ) => {
        if (
          cancelled
        ) {
          return;
        }

        applyWorkerResult(
          result,
        );
      },
    );

    /*
     * Worker error callback.
     */

    workerClient.onError(
      (
        workerError,
      ) => {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "[MediaPipe Worker]",
          workerError,
        );

        setError(
          workerError,
        );

        setTrackingReady(
          false,
        );
      },
    );

    /*
     * ========================================================
     * START DETECTION LOOP
     * ========================================================
     */

    const startDetection =
      () => {
        const detectFrame =
          async () => {
            if (
              cancelled
            ) {
              return;
            }

            const video =
              videoRef.current;

            const client =
              workerClientRef.current;

            if (
              !video ||
              !client
            ) {
              animationFrameRef.current =
                requestAnimationFrame(
                  () => {
                    void detectFrame();
                  },
                );

              return;
            }

            /*
             * Camera must have usable data.
             */

            if (
              video.readyState <
              HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
              animationFrameRef.current =
                requestAnimationFrame(
                  () => {
                    void detectFrame();
                  },
                );

              return;
            }

            const now =
              performance.now();

            /*
             * Only request a new inference when:
             *
             * 1. Video advanced
             * 2. 125ms elapsed
             */

            const newVideoFrame =
              video.currentTime !==
              lastVideoTimeRef.current;

            const enoughTimeElapsed =
              now -
                lastDetectionTimeRef.current >=
              detectionInterval;

            if (
              newVideoFrame &&
              enoughTimeElapsed &&
              client.isReady()
            ) {
              /*
               * Update timing before sending.
               */

              lastVideoTimeRef.current =
                video.currentTime;

              lastDetectionTimeRef.current =
                now;

              /*
               * detect() returns immediately after
               * transferring the ImageBitmap to the worker.
               *
               * This keeps the main thread free while
               * Face Landmarker works in the worker.
               */

              void client.detect(
                video,
                now,
              );
            }

            /*
             * Continue RAF without waiting for
             * MediaPipe inference to finish.
             */

            animationFrameRef.current =
              requestAnimationFrame(
                () => {
                  void detectFrame();
                },
              );
          };

        animationFrameRef.current =
          requestAnimationFrame(
            () => {
              void detectFrame();
            },
          );
      };

    /*
     * ========================================================
     * INITIALIZE CAMERA + WORKER
     * ========================================================
     */

    const initialize =
      async () => {
        try {
          setError(
            null,
          );

          setCameraActive(
            false,
          );

          setTrackingReady(
            false,
          );

          setFaceDetected(
            false,
          );

          /*
           * Start worker initialization.
           */

          workerClient.initialize(
            "/models/face_landmarker.task",
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
          );

          /*
           * Camera API.
           */

          if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices
              .getUserMedia
          ) {
            throw new Error(
              "Camera API is not available in this browser.",
            );
          }

          console.log(
            "[Webcam] Requesting camera...",
          );

          /*
           * Lower-resolution camera.
           */

          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: {
                  width: {
                    ideal: 320,
                  },

                  height: {
                    ideal: 240,
                  },

                  facingMode:
                    "user",
                },

                audio: false,
              },
            );

          if (
            cancelled
          ) {
            stream
              .getTracks()
              .forEach(
                (
                  track,
                ) =>
                  track.stop(),
              );

            stream =
              null;

            return;
          }

          const video =
            videoRef.current;

          if (!video) {
            stream
              .getTracks()
              .forEach(
                (
                  track,
                ) =>
                  track.stop(),
              );

            stream =
              null;

            return;
          }

          /*
           * Attach stream.
           */

          video.srcObject =
            stream;

          await video.play();

          if (
            cancelled
          ) {
            stream
              .getTracks()
              .forEach(
                (
                  track,
                ) =>
                  track.stop(),
              );

            stream =
              null;

            return;
          }

          setCameraActive(
            true,
          );

          console.log(
            "[Webcam] Camera started",
          );

          /*
           * Start worker inference loop.
           */
          startDetection();
        } catch (
          err
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "[Webcam/MediaPipe Worker] Error:",
            err,
          );

          const message =
            err instanceof Error
              ? err.message
              : "Unable to start camera or MediaPipe worker.";

          setError(
            message,
          );

          setCameraActive(
            false,
          );

          setTrackingReady(
            false,
          );

          setFaceDetected(
            false,
          );

          setHeadTracking(
            false,
          );

          headPoseRef.current?.setTrackingActive(
            false,
          );

          engineRef.current?.clearSource(
            "mediapipe",
          );
        }
      };

    /*
     * Initialize.
     */
    void initialize();

    /*
     * ========================================================
     * CLEANUP
     * ========================================================
     */

    return () => {
      console.log(
        "[Webcam] Cleaning up",
      );

      cancelled =
        true;

      /*
       * Stop RAF.
       */

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

      /*
       * Stop camera.
       */

      stream
        ?.getTracks()
        .forEach(
          (
            track,
          ) =>
            track.stop(),
        );

      stream =
        null;

      /*
       * Detach camera.
       */

      if (
        videoRef.current
      ) {
        videoRef.current.pause();

        videoRef.current.srcObject =
          null;
      }

      /*
       * Destroy worker.
       */

      workerClient.destroy();

      workerClientRef.current =
        null;

      /*
       * Clear facial source.
       */

      engineRef.current?.clearSource(
        "mediapipe",
      );

      setHeadTracking(
        false,
      );

      headPoseRef.current?.setTrackingActive(
        false,
      );

      /*
       * Reset state.
       */

      previousFaceDetectedRef.current =
        false;

      headMatrixLoggedRef.current =
        false;

      lastVideoTimeRef.current =
        -1;

      lastDetectionTimeRef.current =
        0;

      setCameraActive(
        false,
      );

      setTrackingReady(
        false,
      );

      setFaceDetected(
        false,
      );
    };
  }, [
    enabled,
  ]);

  /*
   * ============================================================
   * DISABLED
   * ============================================================
   */

  if (!enabled) {
    return null;
  }

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div
      className="
        w-full
        max-w-sm
        shrink-0
        overflow-hidden

        rounded-xl

        border
        border-white/10

        bg-black/80

        shadow-2xl

        backdrop-blur-xl
      "
    >
      <div
        className="
          relative
          aspect-[4/3]
          w-full
        "
      >
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

        {!cameraActive &&
          !error && (
            <div
              className="
                absolute
                inset-0

                flex
                items-center
                justify-center

                bg-black/40

                text-xs
                text-zinc-400
              "
            >
              {trackingReady
                ? "Starting face tracking..."
                : "Starting MediaPipe worker..."}
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

              bg-black/70

              p-4

              text-center

              text-xs
              leading-relaxed
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

              backdrop-blur-sm
            "
          >
            <span
              className={
                faceDetected
                  ? "text-green-400"
                  : "text-yellow-400"
              }
            >
              ●
            </span>

            <span className="text-white">
              {faceDetected
                ? "FACE TRACKED"
                : trackingReady
                  ? "NO FACE"
                  : "STARTING"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}