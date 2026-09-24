import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAvatarStore,
} from "../store/avatarStore";

import {
  useConversationStore,
} from "../store/conversationStore";

import {
  useWebRTC,
} from "../webrtc/useWebRTC";

type WebRTCRole =
  | "host"
  | "viewer"
  | null;

interface WebRTCPanelProps {
  canvas: HTMLCanvasElement | null;

  onRoleChange?: (
    role: WebRTCRole,
  ) => void;
}

export default function WebRTCPanel({
  canvas,
  onRoleChange,
}: WebRTCPanelProps) {
  /*
   * ============================================================
   * LOCAL UI
   * ============================================================
   */

  const [
    roomInput,
    setRoomInput,
  ] = useState("");

  /*
   * ============================================================
   * REMOTE VIDEO
   * ============================================================
   */

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  /*
   * ============================================================
   * WEBRTC
   * ============================================================
   */

  const {
    status,
    role,
    roomId,
    peerCount,
    remoteStream,
    lastMessage,
    error,

    startHost,
    joinRoom,
    leaveRoom,
    reconnect,

    sendJSON,
  } = useWebRTC(canvas);

  /*
   * ============================================================
   * AVATAR
   * ============================================================
   */

  const emotion =
    useAvatarStore(
      (state) =>
        state.emotion,
    );

  const mode =
    useAvatarStore(
      (state) =>
        state.mode,
    );

  /*
   * ============================================================
   * CONVERSATION
   * ============================================================
   */

  const conversationState =
    useConversationStore(
      (state) =>
        state.state,
    );

  /*
   * ============================================================
   * REPORT ROLE TO APP
   * ============================================================
   */

  useEffect(() => {
    onRoleChange?.(
      role,
    );
  }, [
    role,
    onRoleChange,
  ]);

  /*
   * ============================================================
   * REMOTE STREAM → VIDEO
   *
   * Also counts displayed remote frames for
   * PerformanceMonitor.
   * ============================================================
   */

  useEffect(() => {
    const video =
      videoRef.current;

    if (
      !video ||
      !remoteStream
    ) {
      return;
    }

    console.log(
      "[WebRTCPanel] Attaching remote stream to video",
    );

    video.srcObject =
      remoteStream;

    let cancelled =
      false;

    let videoFrameCallbackId:
      | number
      | null = null;

    /*
     * requestVideoFrameCallback is used only
     * when the browser provides it.
     */
    if (
      "requestVideoFrameCallback" in
      HTMLVideoElement.prototype
    ) {
      const monitorVideoFrames: VideoFrameRequestCallback =
        (
          _now,
          _metadata,
        ) => {
          if (
            cancelled
          ) {
            return;
          }

          /*
           * PerformanceMonitor listens
           * for this event.
           */
          window.dispatchEvent(
            new CustomEvent(
              "avatar:webrtc-frame",
            ),
          );

          videoFrameCallbackId =
            video.requestVideoFrameCallback(
              monitorVideoFrames,
            );
        };

      videoFrameCallbackId =
        video.requestVideoFrameCallback(
          monitorVideoFrames,
        );
    }

    /*
     * Start playback.
     */
    void video
      .play()
      .catch(
        (playError) => {
          console.warn(
            "[WebRTCPanel] Remote video autoplay failed:",
            playError,
          );
        },
      );

    return () => {
      cancelled =
        true;

      if (
        videoFrameCallbackId !==
        null
      ) {
        video.cancelVideoFrameCallback(
          videoFrameCallbackId,
        );

        videoFrameCallbackId =
          null;
      }

      if (
        video.srcObject ===
        remoteStream
      ) {
        video.srcObject =
          null;
      }
    };
  }, [
    remoteStream,
  ]);

  /*
   * ============================================================
   * SEND AVATAR STATE
   * ============================================================
   */

  useEffect(() => {
    if (
      status !==
      "connected"
    ) {
      return;
    }

    const sendState =
      () => {
        sendJSON({
          type: "avatar-state",

          emotion,

          mode,

          conversationState,

          timestamp:
            Date.now(),
        });
      };

    /*
     * Immediately send current state.
     */
    sendState();

    /*
     * Continue sending at 2 Hz.
     */
    const interval =
      window.setInterval(
        sendState,
        500,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    status,
    emotion,
    mode,
    conversationState,
    sendJSON,
  ]);

  /*
   * ============================================================
   * CREATE ROOM
   * ============================================================
   */

  const handleCreateRoom =
    async () => {
      console.log(
        "[WebRTCPanel] Create Room clicked",
      );

      /*
       * Tell App immediately that
       * this browser will be Host.
       */
      onRoleChange?.(
        "host",
      );

      try {
        await startHost();

        console.log(
          "[WebRTCPanel] Host started",
        );
      } catch (err) {
        onRoleChange?.(
          null,
        );

        console.error(
          "[WebRTCPanel] Create room failed:",
          err,
        );
      }
    };

  /*
   * ============================================================
   * JOIN ROOM
   * ============================================================
   */

  const handleJoinRoom =
    async () => {
      const trimmed =
        roomInput
          .trim()
          .toUpperCase();

      if (!trimmed) {
        return;
      }

      console.log(
        "[WebRTCPanel] Join Room clicked:",
        trimmed,
      );

      /*
       * Tell App immediately that
       * this browser will be Viewer.
       */
      onRoleChange?.(
        "viewer",
      );

      try {
        await joinRoom(
          trimmed,
        );

        console.log(
          "[WebRTCPanel] Viewer started",
        );
      } catch (err) {
        onRoleChange?.(
          null,
        );

        console.error(
          "[WebRTCPanel] Join room failed:",
          err,
        );
      }
    };

  /*
   * ============================================================
   * RECONNECT
   * ============================================================
   */

  const handleReconnect =
    async () => {
      console.log(
        "[WebRTCPanel] Reconnect requested",
      );

      try {
        await reconnect();

        console.log(
          "[WebRTCPanel] Reconnect started",
        );
      } catch (err) {
        console.error(
          "[WebRTCPanel] Reconnect failed:",
          err,
        );
      }
    };

  /*
   * ============================================================
   * LEAVE ROOM
   * ============================================================
   */

  const handleLeaveRoom =
    async () => {
      console.log(
        "[WebRTCPanel] Leaving room",
      );

      try {
        await leaveRoom();
      } finally {
        onRoleChange?.(
          null,
        );

        setRoomInput("");
      }
    };

  /*
   * ============================================================
   * STATUS LABEL
   * ============================================================
   */

  const statusLabel =
    status ===
    "connected"
      ? "CONNECTED"
      : status ===
          "waiting"
        ? "WAITING"
        : status ===
            "connecting"
          ? "CONNECTING"
          : status ===
              "disconnected"
            ? "DISCONNECTED"
            : status ===
                "failed"
              ? "FAILED"
              : status ===
                  "error"
                ? "ERROR"
                : status.toUpperCase();

  /*
   * ============================================================
   * ACTIVE ROOM
   *
   * `error` is treated as inactive so the user can
   * create/join a fresh room after an initial failure.
   * ============================================================
   */

  const isActive =
    status !==
      "idle" &&
    status !==
      "error";

  const showReconnect =
    status ===
      "disconnected" ||
    status ===
      "failed";

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <section
      className="
        w-full
        shrink-0
        overflow-hidden

        rounded-xl

        border
        border-white/10

        bg-zinc-950/90

        p-3

        shadow-2xl

        backdrop-blur-xl

        sm:p-4
      "
    >
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div
        className="
          mb-3

          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <h2
            className="
              text-sm
              font-semibold
            "
          >
            WebRTC Remote Preview
          </h2>

          <p
            className="
              mt-0.5

              text-xs

              text-white/50
            "
          >
            Canvas → WebRTC → Browser
          </p>
        </div>

        <div
          className={`
            shrink-0

            rounded-full

            border

            px-2
            py-1

            text-[9px]
            font-medium

            ${
              status ===
              "connected"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : status ===
                      "failed" ||
                    status ===
                      "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : status ===
                      "disconnected"
                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                    : "border-white/10 text-zinc-400"
            }
          `}
        >
          {statusLabel}
        </div>
      </div>

      {/* ======================================================
          REMOTE VIDEO
      ======================================================= */}

      <div
        className="
          overflow-hidden

          rounded-lg

          border
          border-white/5

          bg-black
        "
      >
        <video
          ref={
            videoRef
          }
          autoPlay
          muted
          playsInline
          className="
            block

            aspect-video
            w-full

            bg-black

            object-contain
          "
        />

        {!remoteStream && (
          <div
            className="
              flex

              min-h-[110px]

              items-center
              justify-center

              px-4

              text-center

              text-[10px]

              text-zinc-600
            "
          >
            {!role
              ? "Create or join a room"
              : status ===
                  "waiting"
                ? role ===
                  "host"
                  ? "Waiting for viewer..."
                  : "Waiting for host..."
                : status ===
                    "connecting"
                  ? "Connecting..."
                  : "Remote video unavailable"}
          </div>
        )}
      </div>

      {/* ======================================================
          CREATE / JOIN
      ======================================================= */}

      {!isActive && (
        <div
          className="
            mt-3

            space-y-2
          "
        >
          {/* Create Room */}

          <button
            type="button"
            onClick={() => {
              void handleCreateRoom();
            }}
            className="
              w-full

              rounded-lg

              bg-white

              px-3
              py-2.5

              text-sm
              font-medium

              text-black

              transition

              hover:bg-zinc-200

              active:scale-[0.99]
            "
          >
            Create Room
          </button>

          {/* Join Room */}

          <div
            className="
              flex

              gap-2
            "
          >
            <input
              type="text"
              value={
                roomInput
              }
              onChange={(
                event,
              ) => {
                setRoomInput(
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9]/g,
                      "",
                    )
                    .slice(
                      0,
                      6,
                    ),
                );
              }}
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void handleJoinRoom();
                }
              }}
              placeholder="ROOM ID"
              maxLength={6}
              className="
                min-w-0
                flex-1

                rounded-lg

                border
                border-white/10

                bg-zinc-900

                px-3
                py-2.5

                font-mono
                text-sm
                tracking-widest

                text-white

                outline-none

                placeholder:text-zinc-700

                focus:border-white/30
              "
            />

            <button
              type="button"
              onClick={() => {
                void handleJoinRoom();
              }}
              disabled={
                roomInput
                  .trim()
                  .length ===
                0
              }
              className="
                rounded-lg

                border
                border-white/10

                px-3
                py-2

                text-sm

                text-zinc-300

                transition

                hover:bg-white/5

                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              Join
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          ACTIVE ROOM
      ======================================================= */}

      {isActive && (
        <>
          <div
            className="
              mt-3

              rounded-lg

              border
              border-white/10

              bg-white/[0.02]

              p-3
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
              <div
                className="
                  min-w-0
                "
              >
                <div
                  className="
                    text-[9px]

                    uppercase

                    tracking-wider

                    text-zinc-500
                  "
                >
                  Room
                </div>

                <div
                  className="
                    mt-1

                    font-mono

                    text-sm
                    font-semibold

                    tracking-[0.25em]

                    text-white
                  "
                >
                  {roomId ??
                    "------"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    !roomId
                  ) {
                    return;
                  }

                  void navigator.clipboard?.writeText(
                    roomId,
                  );
                }}
                className="
                  shrink-0

                  rounded-lg

                  border
                  border-white/10

                  px-2.5
                  py-1.5

                  text-xs

                  text-zinc-300

                  transition

                  hover:bg-white/5
                "
              >
                Copy
              </button>
            </div>
          </div>

          {/* ==================================================
              RECONNECT
          =================================================== */}

          {showReconnect && (
            <button
              type="button"
              onClick={() => {
                void handleReconnect();
              }}
              className="
                mt-2

                w-full

                rounded-lg

                bg-white

                px-3
                py-2

                text-sm
                font-medium

                text-black

                transition

                hover:bg-zinc-200

                active:scale-[0.99]
              "
            >
              Reconnect
            </button>
          )}

          {/* ==================================================
              LEAVE ROOM
          =================================================== */}

          <button
            type="button"
            onClick={() => {
              void handleLeaveRoom();
            }}
            className="
              mt-2

              w-full

              rounded-lg

              border
              border-white/10

              px-3
              py-2

              text-sm

              text-zinc-300

              transition

              hover:bg-white/5
            "
          >
            Leave Room
          </button>
        </>
      )}

      {/* ======================================================
          STATUS
      ======================================================= */}

      <div
        className="
          mt-3

          space-y-1.5

          text-[10px]

          text-zinc-500
        "
      >
        <StatusRow
          label="WebRTC"
          value={
            statusLabel
          }
          active={
            status ===
            "connected"
          }
        />

        <StatusRow
          label="Role"
          value={
            role
              ? role.toUpperCase()
              : "—"
          }
          active={
            role !==
            null
          }
        />

        <StatusRow
          label="Peers"
          value={`${peerCount}/2`}
          active={
            peerCount >
            0
          }
        />

        <StatusRow
          label="DataChannel"
          value={
            lastMessage
              ? "RECEIVING"
              : "WAITING"
          }
          active={
            Boolean(
              lastMessage,
            )
          }
        />

        <StatusRow
          label="Emotion"
          value={
            emotion
          }
          active
        />

        <StatusRow
          label="Mode"
          value={
            mode
          }
          active
        />

        <StatusRow
          label="State"
          value={
            conversationState
          }
          active
        />
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div
          className="
            mt-3

            rounded-lg

            border
            border-red-500/20

            bg-red-500/5

            p-2.5

            text-[10px]

            leading-relaxed

            text-red-400
          "
        >
          {error}
        </div>
      )}
    </section>
  );
}

/*
 * ============================================================
 * STATUS ROW
 * ============================================================
 */

function StatusRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className="
        flex

        items-center
        justify-between

        gap-3
      "
    >
      <div
        className="
          flex
          min-w-0

          items-center

          gap-2
        "
      >
        <span
          className={`
            h-1.5
            w-1.5
            shrink-0
            rounded-full

            ${
              active
                ? "bg-green-400"
                : "bg-zinc-600"
            }
          `}
        />

        <span
          className="
            truncate
          "
        >
          {label}
        </span>
      </div>

      <span
        className="
          max-w-[55%]

          truncate

          text-right

          font-mono

          text-zinc-300
        "
        title={
          value
        }
      >
        {value}
      </span>
    </div>
  );
}