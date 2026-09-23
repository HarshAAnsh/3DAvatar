export type MediaPipeBlendshape = {
  categoryName: string;
  score: number;
};

export type MediaPipeWorkerResult = {
  timestamp: number;
  faceDetected: boolean;
  blendshapes: MediaPipeBlendshape[];
  headMatrix: number[] | null;
};

type WorkerReadyMessage = {
  type: "ready";
};

type WorkerResultMessage = {
  type: "result";
  timestamp: number;
  faceDetected: boolean;
  blendshapes: MediaPipeBlendshape[];
  headMatrix: number[] | null;
};

type WorkerErrorMessage = {
  type: "error";
  message: string;
};

type WorkerMessage =
  | WorkerReadyMessage
  | WorkerResultMessage
  | WorkerErrorMessage;

export class MediaPipeWorkerClient {
  private worker: Worker;

  private ready = false;

  /*
   * Prevent a queue of ImageBitmaps from building up.
   *
   * Only one inference is allowed to be in flight.
   */
  private inferenceInProgress =
    false;

  private destroyed = false;

  private onResultCallback:
    | ((
        result: MediaPipeWorkerResult,
      ) => void)
    | null = null;

  private onErrorCallback:
    | ((
        message: string,
      ) => void)
    | null = null;

  constructor() {
    this.worker =
      new Worker(
        new URL(
          "../workers/faceLandmarker.worker.ts",
          import.meta.url,
        ),
        {
          type: "module",
        },
      );

    this.worker.onmessage =
      (
        event: MessageEvent<WorkerMessage>,
      ) => {
        const message =
          event.data;

        /*
         * -----------------------------------------------
         * READY
         * -----------------------------------------------
         */

        if (
          message.type ===
          "ready"
        ) {
          this.ready =
            true;

          console.log(
            "[MediaPipe Worker] Ready",
          );

          return;
        }

        /*
         * -----------------------------------------------
         * RESULT
         * -----------------------------------------------
         */

        if (
          message.type ===
          "result"
        ) {
          this.inferenceInProgress =
            false;

          this.onResultCallback?.({
            timestamp:
              message.timestamp,

            faceDetected:
              message.faceDetected,

            blendshapes:
              message.blendshapes,

            headMatrix:
              message.headMatrix,
          });

          return;
        }

        /*
         * -----------------------------------------------
         * ERROR
         * -----------------------------------------------
         */

        if (
          message.type ===
          "error"
        ) {
          this.inferenceInProgress =
            false;

          this.onErrorCallback?.(
            message.message,
          );
        }
      };

    this.worker.onerror =
      (event) => {
        this.inferenceInProgress =
          false;

        this.onErrorCallback?.(
          event.message ||
            "MediaPipe worker error",
        );
      };
  }

  /*
   * ==========================================================
   * INITIALIZE WORKER
   * ==========================================================
   */

  initialize(
    modelAssetPath =
      "/models/face_landmarker.task",
    wasmPath =
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  ): void {
    if (
      this.destroyed
    ) {
      return;
    }

    console.log(
      "[MediaPipe Worker] Initializing...",
    );

    this.worker.postMessage({
      type: "init",

      modelAssetPath,

      wasmPath,
    });
  }

  /*
   * ==========================================================
   * DETECT
   *
   * Returns false when a frame was skipped because another
   * inference is already running.
   * ==========================================================
   */

  async detect(
    video: HTMLVideoElement,
    timestamp: number,
  ): Promise<boolean> {
    if (
      this.destroyed ||
      !this.ready ||
      this.inferenceInProgress
    ) {
      return false;
    }

    /*
     * ImageBitmap allows us to transfer the frame to
     * the worker without copying the underlying image data.
     */

    let frame:
      | ImageBitmap
      | null = null;

    try {
      frame =
        await createImageBitmap(
          video,
        );

      if (
        this.destroyed ||
        !this.ready ||
        this.inferenceInProgress
      ) {
        frame.close();

        return false;
      }

      this.inferenceInProgress =
        true;

      this.worker.postMessage(
        {
          type: "detect",

          frame,

          timestamp,
        },
        [frame],
      );

      /*
       * Ownership of `frame` was transferred to
       * the worker, so don't close it here.
       */
      frame = null;

      return true;
    } catch (error) {
      if (frame) {
        frame.close();
      }

      this.inferenceInProgress =
        false;

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.onErrorCallback?.(
        message,
      );

      return false;
    }
  }

  /*
   * ==========================================================
   * CALLBACKS
   * ==========================================================
   */

  onResult(
    callback: (
      result: MediaPipeWorkerResult,
    ) => void,
  ): void {
    this.onResultCallback =
      callback;
  }

  onError(
    callback: (
      message: string,
    ) => void,
  ): void {
    this.onErrorCallback =
      callback;
  }

  /*
   * ==========================================================
   * STATE
   * ==========================================================
   */

  isReady(): boolean {
    return this.ready;
  }

  isBusy(): boolean {
    return this.inferenceInProgress;
  }

  /*
   * ==========================================================
   * DESTROY
   * ==========================================================
   */

  destroy(): void {
    if (
      this.destroyed
    ) {
      return;
    }

    console.log(
      "[MediaPipe Worker] Destroying",
    );

    this.destroyed =
      true;

    this.ready =
      false;

    this.inferenceInProgress =
      false;

    this.worker.terminate();

    this.onResultCallback =
      null;

    this.onErrorCallback =
      null;
  }
}