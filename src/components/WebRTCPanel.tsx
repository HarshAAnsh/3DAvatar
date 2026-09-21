import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAvatarStore } from "../store/avatarStore";

import { useConversationStore } from "../store/conversationStore";

import { usePeerWebRTC } from "../webrtc/usePeerWebRTC";

interface WebRTCPanelProps {
  canvas: HTMLCanvasElement | null;
}

function createRoomId() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let value = "";

  for (let index = 0; index < 6; index++) {
    value +=
      chars[
        Math.floor(
          Math.random() *
            chars.length,
        )
      ];
  }

  return value;
}

function statusText(
  status: string,
) {
  switch (status) {
    case "connected":
      return "CONNECTED";

    case "connecting":
      return "CONNECTING";

    case "waiting":
      return "WAITING";

    case "disconnected":
      return "DISCONNECTED";

    case "failed":
      return "FAILED";

    case "error":
      return "ERROR";

    default:
      return "IDLE";
  }
}

export default function WebRTCPanel({
  canvas,
}: WebRTCPanelProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const [roomInput, setRoomInput] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const {
    status,
    role,
    roomId,
    peerCount,
    remoteStream,
    lastMessage,
    error,
    connect,
    disconnect,
    sendJSON,
  } = usePeerWebRTC(canvas);

  const emotion = useAvatarStore(
    (state) => state.emotion,
  );

  const mode = useAvatarStore(
    (state) => state.mode,
  );

  const conversationState =
    useConversationStore(
      (state) => state.state,
    );

  const signalingUrl =
    useMemo(() => {
      return (
        import.meta.env
          .VITE_SIGNALING_URL ||
        "ws://localhost:8080"
      );
    }, []);

  /*
   * Attach remote stream.
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

    video.srcObject =
      remoteStream;

    void video.play().catch(
      (playError) => {
        console.warn(
          "[WebRTC] Remote video autoplay:",
          playError,
        );
      },
    );

    return () => {
      if (
        video.srcObject ===
        remoteStream
      ) {
        video.srcObject = null;
      }
    };
  }, [remoteStream]);

  /*
   * Host sends avatar state.
   */

  useEffect(() => {
    if (
      role !== "host" ||
      status !== "connected"
    ) {
      return;
    }

    const sendState = () => {
      sendJSON({
        type: "avatar-state",
        emotion,
        mode,
        conversationState,
        timestamp: Date.now(),
      });
    };

    sendState();

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
    role,
    status,
    emotion,
    mode,
    conversationState,
    sendJSON,
  ]);

  /*
   * Create Room
   */

  const handleCreateRoom =
    async () => {
      if (status !== "idle") {
        return;
      }

      const newRoom =
        createRoomId();

      setRoomInput(newRoom);

      try {
        await connect(
          signalingUrl,
          newRoom,
          true,
        );
      } catch (connectError) {
        console.error(
          "[WebRTC] Create room failed:",
          connectError,
        );
      }
    };

  /*
   * Join Room
   */

  const handleJoinRoom =
    async () => {
      const room =
        roomInput.trim().toUpperCase();

      if (
        !room ||
        status !== "idle"
      ) {
        return;
      }

      try {
        await connect(
          signalingUrl,
          room,
          false,
        );
      } catch (connectError) {
        console.error(
          "[WebRTC] Join room failed:",
          connectError,
        );
      }
    };

  /*
   * Copy room ID
   */

  const handleCopyRoom =
    async () => {
      if (!roomId) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          roomId,
        );

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 1500);
      } catch {
        console.warn(
          "[WebRTC] Clipboard unavailable",
        );
      }
    };

  const connected =
    status === "connected";

  const waiting =
    status === "waiting";

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
        shadow-xl
        backdrop-blur-xl

        sm:p-4
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="
              text-sm
              font-semibold
              text-white
            "
          >
            WebRTC Remote Preview
          </h2>

          <p
            className="
              mt-0.5
              text-[10px]
              text-white/40

              sm:text-xs
            "
          >
            Canvas → WebRTC → Browser
          </p>
        </div>

        <span
          className={`
            shrink-0
            rounded-full
            border
            px-2
            py-1
            text-[9px]
            font-medium
            ${
              connected
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : waiting
                  ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                  : error
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-white/10 bg-white/5 text-zinc-400"
            }
          `}
        >
          {statusText(status)}
        </span>
      </div>

      {/* =====================================================
          REMOTE VIDEO
      ====================================================== */}

      <div
        className="
          mt-3
          overflow-hidden
          rounded-lg
          border
          border-white/5
          bg-black
        "
      >
        <video
          ref={videoRef}
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
              aspect-video
              items-center
              justify-center
              text-center
              text-[10px]
              text-zinc-600
            "
          >
            {status === "idle"
              ? "Create or join a room"
              : role === "host"
                ? "Waiting for viewer..."
                : "Waiting for avatar stream..."}
          </div>
        )}
      </div>

      {/* =====================================================
          ROOM CONTROLS
      ====================================================== */}

      {status === "idle" ? (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void handleCreateRoom();
              }}
              className="
                flex-1
                rounded-lg
                bg-white
                px-3
                py-2
                text-xs
                font-medium
                text-black
                transition
                hover:bg-zinc-200
              "
            >
              Create Room
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={roomInput}
              onChange={(event) =>
                setRoomInput(
                  event.target.value
                    .toUpperCase(),
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void handleJoinRoom();
                }
              }}
              maxLength={6}
              placeholder="ROOM ID"
              className="
                min-w-0
                flex-1
                rounded-lg
                border
                border-white/10
                bg-white/5
                px-3
                py-2
                text-xs
                uppercase
                tracking-widest
                text-white
                outline-none
                placeholder:text-zinc-600
                focus:border-white/20
              "
            />

            <button
              type="button"
              onClick={() => {
                void handleJoinRoom();
              }}
              disabled={
                !roomInput.trim()
              }
              className="
                shrink-0
                rounded-lg
                border
                border-white/10
                bg-white/5
                px-3
                py-2
                text-xs
                font-medium
                text-zinc-200
                transition
                hover:bg-white/10
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              Join
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {/* Room */}

          <div
            className="
              rounded-lg
              border
              border-white/10
              bg-white/[0.03]
              px-3
              py-2
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

            <div className="mt-1 flex items-center justify-between gap-2">
              <span
                className="
                  font-mono
                  text-sm
                  font-semibold
                  tracking-[0.25em]
                  text-white
                "
              >
                {roomId || roomInput}
              </span>

              <button
                type="button"
                onClick={() => {
                  void handleCopyRoom();
                }}
                className="
                  rounded-md
                  border
                  border-white/10
                  bg-white/5
                  px-2
                  py-1
                  text-[9px]
                  text-zinc-300
                  hover:bg-white/10
                "
              >
                {copied
                  ? "Copied"
                  : "Copy"}
              </button>
            </div>
          </div>

          {/* Role / peers */}

          <div className="grid grid-cols-2 gap-2">
            <div
              className="
                rounded-lg
                border
                border-white/10
                bg-white/[0.03]
                px-3
                py-2
              "
            >
              <div className="text-[9px] text-zinc-500">
                Role
              </div>

              <div className="mt-0.5 text-xs font-medium text-white">
                {role === "host"
                  ? "HOST"
                  : role === "viewer"
                    ? "VIEWER"
                    : "—"}
              </div>
            </div>

            <div
              className="
                rounded-lg
                border
                border-white/10
                bg-white/[0.03]
                px-3
                py-2
              "
            >
              <div className="text-[9px] text-zinc-500">
                Peers
              </div>

              <div className="mt-0.5 text-xs font-medium text-white">
                {peerCount}/2
              </div>
            </div>
          </div>

          {/* Disconnect */}

          <button
            type="button"
            onClick={() => {
              void disconnect();
            }}
            className="
              w-full
              rounded-lg
              border
              border-white/10
              bg-white/5
              px-3
              py-2
              text-xs
              text-zinc-300
              transition
              hover:bg-white/10
            "
          >
            Leave Room
          </button>
        </div>
      )}

      {/* =====================================================
          STATUS
      ====================================================== */}

      <div className="mt-3 space-y-1 text-[10px] text-zinc-500">
        <div className="flex justify-between gap-3">
          <span>WebRTC</span>

          <span className="text-zinc-300">
            {statusText(status)}
          </span>
        </div>

        <div className="flex justify-between gap-3">
          <span>Role</span>

          <span className="text-zinc-300">
            {role ?? "—"}
          </span>
        </div>

        <div className="flex justify-between gap-3">
          <span>DataChannel</span>

          <span
            className={
              lastMessage
                ? "text-green-400"
                : "text-zinc-500"
            }
          >
            {lastMessage
              ? "RECEIVING"
              : "WAITING"}
          </span>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            mt-3
            rounded-lg
            border
            border-red-500/20
            bg-red-500/5
            px-3
            py-2
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