import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PeerWebRTCController,
  type PeerConnectionState,
  type PeerRole,
} from "./PeerWebRTCController";

export type {
  PeerConnectionState,
  PeerRole,
};

const DEFAULT_SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL ||
  "ws://localhost:8080";

function createRoomId(): string {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (let i = 0; i < 6; i++) {
    const index = Math.floor(
      Math.random() *
        characters.length
    );

    result += characters[index];
  }

  return result;
}

export function useWebRTC(
  canvas: HTMLCanvasElement | null
) {
  /*
   * ============================================================
   * CONTROLLER
   * ============================================================
   */

  const controllerRef =
    useRef<PeerWebRTCController | null>(
      null
    );

  /*
   * ============================================================
   * REACTIVE STATE
   * ============================================================
   */

  const [status, setStatus] =
    useState<PeerConnectionState>(
      "idle"
    );

  const [role, setRole] =
    useState<PeerRole>(null);

  const [roomId, setRoomId] =
    useState<string | null>(null);

  const [peerCount, setPeerCount] =
    useState(0);

  const [remoteStream, setRemoteStream] =
    useState<MediaStream | null>(
      null
    );

  const [lastMessage, setLastMessage] =
    useState<unknown>(null);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ============================================================
   * CONTROLLER INITIALIZATION
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const controller =
      new PeerWebRTCController({
        /*
         * ------------------------------------------------------
         * STATUS
         * ------------------------------------------------------
         */

        onStatusChange: (
          nextStatus
        ) => {
          if (!mounted) {
            return;
          }

          setStatus(nextStatus);
        },

        /*
         * ------------------------------------------------------
         * REMOTE STREAM
         * ------------------------------------------------------
         */

        onRemoteStream: (
          stream
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "[WebRTC Hook] Remote stream received"
          );

          setRemoteStream(stream);
        },

        /*
         * ------------------------------------------------------
         * DATA CHANNEL
         * ------------------------------------------------------
         */

        onDataMessage: (
          data
        ) => {
          if (!mounted) {
            return;
          }

          setLastMessage(data);
        },

        /*
         * ------------------------------------------------------
         * ROOM JOINED
         * ------------------------------------------------------
         */

        onRoomJoined: (
          joinedRoomId,
          count,
          joinedRole
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "[WebRTC Hook] Room joined:",
            joinedRoomId,
            "peers:",
            count,
            "role:",
            joinedRole
          );

          setRoomId(
            joinedRoomId
          );

          setPeerCount(count);

          setRole(
            joinedRole
          );

          setError(null);
        },

        /*
         * ------------------------------------------------------
         * SECOND PEER ARRIVED
         * ------------------------------------------------------
         */

        onPeerReady: () => {
          if (!mounted) {
            return;
          }

          console.log(
            "[WebRTC Hook] Peer ready"
          );

          /*
           * A room can have:
           * Host + Viewer = 2 peers
           */
          setPeerCount(2);
        },

        /*
         * ------------------------------------------------------
         * PEER LEFT
         * ------------------------------------------------------
         */

        onPeerLeft: () => {
          if (!mounted) {
            return;
          }

          console.log(
            "[WebRTC Hook] Peer left"
          );

          setPeerCount(1);
        },

        /*
         * ------------------------------------------------------
         * ERROR
         * ------------------------------------------------------
         */

        onError: (
          message
        ) => {
          if (!mounted) {
            return;
          }

          console.error(
            "[WebRTC Hook]",
            message
          );

          setError(message);
        },
      });

    controllerRef.current =
      controller;

    return () => {
      mounted = false;

      void controller.disconnect();

      controllerRef.current =
        null;
    };
  }, []);

  /*
   * ============================================================
   * START HOST
   * ============================================================
   */

  const startHost =
    useCallback(
      async (
        requestedRoomId?: string
      ) => {
        const controller =
          controllerRef.current;

        if (!controller) {
          throw new Error(
            "WebRTC controller is not ready."
          );
        }

        if (!canvas) {
          throw new Error(
            "Avatar canvas is not ready."
          );
        }

        const finalRoomId =
          requestedRoomId?.trim().toUpperCase() ||
          createRoomId();

        /*
         * Immediately expose Host role to React.
         */
        setRole("host");

        setRoomId(
          finalRoomId
        );

        setError(null);

        setLastMessage(null);

        setPeerCount(0);

        console.log(
          "[WebRTC Hook] Starting HOST:",
          finalRoomId
        );

        try {
          await controller.connect(
            DEFAULT_SIGNALING_URL,
            finalRoomId,
            true,
            canvas
          );

          /*
           * Controller will also report role
           * through onRoomJoined.
           */
          setRole("host");
          setRoomId(
            finalRoomId
          );
        } catch (err) {
          setRole(null);

          setRoomId(null);

          setPeerCount(0);

          const message =
            err instanceof Error
              ? err.message
              : "Unable to start WebRTC host.";

          setError(message);

          throw err;
        }
      },
      [canvas]
    );

  /*
   * ============================================================
   * JOIN AS VIEWER
   * ============================================================
   */

  const joinRoom =
    useCallback(
      async (
        requestedRoomId: string
      ) => {
        const controller =
          controllerRef.current;

        if (!controller) {
          throw new Error(
            "WebRTC controller is not ready."
          );
        }

        const finalRoomId =
          requestedRoomId
            .trim()
            .toUpperCase();

        if (!finalRoomId) {
          throw new Error(
            "Room ID is required."
          );
        }

        /*
         * Immediately expose Viewer role to React.
         */
        setRole("viewer");

        setRoomId(
          finalRoomId
        );

        setError(null);

        setLastMessage(null);

        setPeerCount(0);

        console.log(
          "[WebRTC Hook] Starting VIEWER:",
          finalRoomId
        );

        try {
          await controller.connect(
            DEFAULT_SIGNALING_URL,
            finalRoomId,
            false,
            null
          );

          setRole("viewer");

          setRoomId(
            finalRoomId
          );
        } catch (err) {
          setRole(null);

          setRoomId(null);

          setPeerCount(0);

          const message =
            err instanceof Error
              ? err.message
              : "Unable to join WebRTC room.";

          setError(message);

          throw err;
        }
      },
      []
    );

  /*
   * ============================================================
   * LEAVE
   * ============================================================
   */

  const leaveRoom =
    useCallback(
      async () => {
        const controller =
          controllerRef.current;

        if (!controller) {
          return;
        }

        console.log(
          "[WebRTC Hook] Leaving room"
        );

        await controller.disconnect();

        setStatus("idle");

        setRole(null);

        setRoomId(null);

        setPeerCount(0);

        setRemoteStream(null);

        setLastMessage(null);

        setError(null);
      },
      []
    );

  /*
   * ============================================================
   * SEND JSON
   * ============================================================
   */

  const sendJSON =
    useCallback(
      (data: unknown) => {
        controllerRef.current?.sendJSON(
          data
        );
      },
      []
    );

  /*
   * ============================================================
   * BACKWARD-COMPATIBLE START
   *
   * This lets components that previously used
   * start() continue to work.
   * ============================================================
   */

  const start =
    useCallback(
      async () => {
        if (role === "viewer") {
          if (!roomId) {
            throw new Error(
              "Room ID is required."
            );
          }

          await joinRoom(
            roomId
          );

          return;
        }

        await startHost(
          roomId ?? undefined
        );
      },
      [
        role,
        roomId,
        joinRoom,
        startHost,
      ]
    );

  /*
   * ============================================================
   * BACKWARD-COMPATIBLE STOP
   * ============================================================
   */

  const stop =
    useCallback(
      async () => {
        await leaveRoom();
      },
      [leaveRoom]
    );

  /*
   * ============================================================
   * RETURN
   * ============================================================
   */

  return {
    status,

    role,

    roomId,

    peerCount,

    remoteStream,

    lastMessage,

    error,

    start,

    stop,

    sendJSON,

    startHost,

    joinRoom,

    leaveRoom,

    createRoomId,
  };
}