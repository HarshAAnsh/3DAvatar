import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

type InitMessage = {
  type: "init";
  modelAssetPath: string;
  wasmPath: string;
};

type DetectMessage = {
  type: "detect";
  frame: ImageBitmap;
  timestamp: number;
};

type WorkerMessage =
  | InitMessage
  | DetectMessage;

type BlendshapeCategory = {
  categoryName: string;
  score: number;
};

type WorkerResult = {
  type: "result";
  timestamp: number;
  faceDetected: boolean;
  blendshapes: BlendshapeCategory[];
  headMatrix: number[] | null;
};

type WorkerReady = {
  type: "ready";
};

type WorkerError = {
  type: "error";
  message: string;
};

let faceLandmarker:
  | FaceLandmarker
  | null = null;

let initialized = false;

self.onmessage = async (
  event: MessageEvent<WorkerMessage>,
) => {
  const message =
    event.data;

  try {
    /*
     * ==========================================================
     * INITIALIZE
     * ==========================================================
     */

    if (
      message.type === "init"
    ) {
      const vision =
        await FilesetResolver.forVisionTasks(
          message.wasmPath,
          true,
        );

      faceLandmarker =
        await FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                message.modelAssetPath,
            },

            runningMode:
              "VIDEO",

            numFaces: 1,

            outputFaceBlendshapes:
              true,

            outputFacialTransformationMatrixes:
              true,
          },
        );

      initialized = true;

      const readyMessage:
        WorkerReady = {
        type: "ready",
      };

      self.postMessage(
        readyMessage,
      );

      return;
    }

    /*
     * ==========================================================
     * DETECT
     * ==========================================================
     */

    if (
      message.type === "detect"
    ) {
      const frame =
        message.frame;

      /*
       * Worker not ready.
       */
      if (
        !initialized ||
        !faceLandmarker
      ) {
        frame.close();

        return;
      }

      try {
        const result =
          faceLandmarker.detectForVideo(
            frame,
            message.timestamp,
          );

        /*
         * -----------------------------------------------
         * FACE DETECTED
         * -----------------------------------------------
         */

        const faceDetected =
          result.faceLandmarks
            .length > 0;

        /*
         * -----------------------------------------------
         * BLENDSHAPES
         * -----------------------------------------------
         */

        const blendshapes:
          BlendshapeCategory[] =
          faceDetected &&
          result.faceBlendshapes
            .length > 0
            ? result.faceBlendshapes[0]
                .categories.map(
                  (category) => ({
                    categoryName:
                      category.categoryName,
                    score:
                      category.score,
                  }),
                )
            : [];

        /*
         * -----------------------------------------------
         * HEAD MATRIX
         * -----------------------------------------------
         */

        let headMatrix:
          number[] | null =
          null;

        if (
          faceDetected &&
          result
            .facialTransformationMatrixes
            .length > 0
        ) {
          headMatrix =
            Array.from(
              result
                .facialTransformationMatrixes[0]
                .data,
            );
        }

        /*
         * -----------------------------------------------
         * SEND RESULT
         * -----------------------------------------------
         */

        const response:
          WorkerResult = {
          type: "result",

          timestamp:
            message.timestamp,

          faceDetected,

          blendshapes,

          headMatrix,
        };

        self.postMessage(
          response,
        );
      } finally {
        /*
         * Important:
         * release transferred ImageBitmap.
         */
        frame.close();
      }

      return;
    }
  } catch (error) {
    /*
     * -----------------------------------------------
     * WORKER ERROR
     * -----------------------------------------------
     */

    const messageText =
      error instanceof Error
        ? error.message
        : String(error);

    const errorMessage:
      WorkerError = {
      type: "error",
      message:
        messageText,
    };

    self.postMessage(
      errorMessage,
    );
  }
};