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

type SavedConnection = {
  role: "host" | "viewer";
  roomId: string;
};

/*
 * ============================================================
 * ROOM ID
 * ============================================================
 */

function createRoomId(): string {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (let i = 0; i < 6; i++) {
    const index =
      Math.floor(
        Math.random() *
          characters.length,
      );

    result +=
      characters[index];
  }

  return result;
}

/*
 * ============================================================
 * WEBRTC HOOK
 * ============================================================
 */

export function useWebRTC(
  canvas: HTMLCanvasElement | null,
) {
  /*
   * ==========================================================
   * CONTROLLER
   * ==========================================================
   */

  const controllerRef =
    useRef<PeerWebRTCController | null>(
      null,
    );

  /*
   * ==========================================================
   * LAST SUCCESSFUL / ATTEMPTED CONNECTION
   *
   * Used by Reconnect.
   * ==========================================================
   */

  const lastConnectionRef =
    useRef<SavedConnection | null>(
      null,
    );

  /*
   * ==========================================================
   * REACTIVE STATE
   * ==========================================================
   */

  const [
    status,
    setStatus,
  ] =
    useState<PeerConnectionState>(
      "idle",
    );

  const [
    role,
    setRole,
  ] =
    useState<PeerRole>(
      null,
    );

  const [
    roomId,
    setRoomId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    peerCount,
    setPeerCount,
  ] =
    useState(0);

  const [
    remoteStream,
    setRemoteStream,
  ] =
    useState<MediaStream | null>(
      null,
    );

  const [
    lastMessage,
    setLastMessage,
  ] =
    useState<unknown>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  /*
   * ==========================================================
   * CONTROLLER INITIALIZATION
   * ==========================================================
   */

  useEffect(() => {
    let mounted = true;

    const controller =
      new PeerWebRTCController({
        /*
         * ------------------------------------------------------
         * CONNECTION STATUS
         * ------------------------------------------------------
         */

        onStatusChange: (
          nextStatus,
        ) => {
          if (!mounted) {
            return;
          }

          setStatus(
            nextStatus,
          );

          /*
           * If the WebRTC connection is lost,
           * remove the old remote media from React.
           */
          if (
            nextStatus ===
              "disconnected" ||
            nextStatus ===
              "failed" ||
            nextStatus ===
              "closed"
          ) {
            setRemoteStream(
              null,
            );

            setLastMessage(
              null,
            );
          }
        },

        /*
         * ------------------------------------------------------
         * REMOTE STREAM
         * ------------------------------------------------------
         */

        onRemoteStream: (
          stream,
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "[WebRTC Hook] Remote stream received",
          );

          setRemoteStream(
            stream,
          );
        },

        /*
         * ------------------------------------------------------
         * DATA CHANNEL
         * ------------------------------------------------------
         */

        onDataMessage: (
          data,
        ) => {
          if (!mounted) {
            return;
          }

          setLastMessage(
            data,
          );
        },

        /*
         * ------------------------------------------------------
         * ROOM JOINED
         * ------------------------------------------------------
         */

        onRoomJoined: (
          joinedRoomId,
          count,
          joinedRole,
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
            joinedRole,
          );

          setRoomId(
            joinedRoomId,
          );

          setPeerCount(
            count,
          );

          setRole(
            joinedRole,
          );

          setError(
            null,
          );
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
            "[WebRTC Hook] Peer ready",
          );

          /*
           * Host + Viewer
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
            "[WebRTC Hook] Peer left",
          );

          /*
           * Keep the current browser in the room.
           *
           * There is still one peer:
           * the current browser itself.
           */
          setPeerCount(1);

          /*
           * Remove the previous remote stream.
           */
          setRemoteStream(
            null,
          );

          /*
           * Stop showing stale DataChannel state.
           */
          setLastMessage(
            null,
          );

          setError(
            null,
          );
        },

        /*
         * ------------------------------------------------------
         * ERROR
         * ------------------------------------------------------
         */

        onError: (
          message,
        ) => {
          if (!mounted) {
            return;
          }

          console.error(
            "[WebRTC Hook]",
            message,
          );

          setError(
            message,
          );
        },
      });

    controllerRef.current =
      controller;

    /*
     * --------------------------------------------------------
     * CLEANUP
     * --------------------------------------------------------
     */

    return () => {
      mounted = false;

      void controller.disconnect();

      controllerRef.current =
        null;
    };
  }, []);

  /*
   * ==========================================================
   * START HOST
   * ==========================================================
   */

  const startHost =
    useCallback(
      async (
        requestedRoomId?: string,
      ) => {
        const controller =
          controllerRef.current;

        if (!controller) {
          throw new Error(
            "WebRTC controller is not ready.",
          );
        }

        if (!canvas) {
          throw new Error(
            "Avatar canvas is not ready.",
          );
        }

        const finalRoomId =
          requestedRoomId
            ?.trim()
            .toUpperCase() ||
          createRoomId();

        /*
         * Save connection information
         * for reconnect.
         */
        lastConnectionRef.current =
          {
            role: "host",
            roomId:
              finalRoomId,
          };

        /*
         * Immediately expose Host
         * role to React.
         */
        setRole(
          "host",
        );

        setRoomId(
          finalRoomId,
        );

        setError(
          null,
        );

        setLastMessage(
          null,
        );

        setRemoteStream(
          null,
        );

        setPeerCount(
          0,
        );

        console.log(
          "[WebRTC Hook] Starting HOST:",
          finalRoomId,
        );

        try {
          await controller.connect(
            DEFAULT_SIGNALING_URL,
            finalRoomId,
            true,
            canvas,
          );

          setRole(
            "host",
          );

          setRoomId(
            finalRoomId,
          );
        } catch (err) {
          lastConnectionRef.current =
            null;

          setRole(
            null,
          );

          setRoomId(
            null,
          );

          setPeerCount(
            0,
          );

          setRemoteStream(
            null,
          );

          const message =
            err instanceof Error
              ? err.message
              : "Unable to start WebRTC host.";

          setError(
            message,
          );

          throw err;
        }
      },
      [canvas],
    );

  /*
   * ==========================================================
   * JOIN AS VIEWER
   * ==========================================================
   */

  const joinRoom =
    useCallback(
      async (
        requestedRoomId: string,
      ) => {
        const controller =
          controllerRef.current;

        if (!controller) {
          throw new Error(
            "WebRTC controller is not ready.",
          );
        }

        const finalRoomId =
          requestedRoomId
            .trim()
            .toUpperCase();

        if (!finalRoomId) {
          throw new Error(
            "Room ID is required.",
          );
        }

        /*
         * Save connection information
         * for reconnect.
         */
        lastConnectionRef.current =
          {
            role: "viewer",
            roomId:
              finalRoomId,
          };

        /*
         * Immediately expose Viewer
         * role to React.
         */
        setRole(
          "viewer",
        );

        setRoomId(
          finalRoomId,
        );

        setError(
          null,
        );

        setLastMessage(
          null,
        );

        setRemoteStream(
          null,
        );

        setPeerCount(
          0,
        );

        console.log(
          "[WebRTC Hook] Starting VIEWER:",
          finalRoomId,
        );

        try {
          await controller.connect(
            DEFAULT_SIGNALING_URL,
            finalRoomId,
            false,
            null,
          );

          setRole(
            "viewer",
          );

          setRoomId(
            finalRoomId,
          );
        } catch (err) {
          lastConnectionRef.current =
            null;

          setRole(
            null,
          );

          setRoomId(
            null,
          );

          setPeerCount(
            0,
          );

          setRemoteStream(
            null,
          );

          const message =
            err instanceof Error
              ? err.message
              : "Unable to join WebRTC room.";

          setError(
            message,
          );

          throw err;
        }
      },
      [],
    );

  /*
   * ==========================================================
   * RECONNECT
   * ==========================================================
   */

  const reconnect =
    useCallback(
      async () => {
        const previous =
          lastConnectionRef.current;

        const controller =
          controllerRef.current;

        if (!controller) {
          throw new Error(
            "WebRTC controller is not ready.",
          );
        }

        if (!previous) {
          throw new Error(
            "No previous WebRTC connection is available.",
          );
        }

        console.log(
          "[WebRTC Hook] Reconnecting:",
          previous.role,
          previous.roomId,
        );

        /*
         * Fully close the old peer/socket.
         */
        await controller.disconnect();

        /*
         * Reset transient connection state.
         *
         * Preserve role and room through
         * the saved connection object.
         */
        setStatus(
          "idle",
        );

        setPeerCount(
          0,
        );

        setRemoteStream(
          null,
        );

        setLastMessage(
          null,
        );

        setError(
          null,
        );

        /*
         * Reconnect using exactly the
         * same role and room.
         */
        if (
          previous.role ===
          "host"
        ) {
          await startHost(
            previous.roomId,
          );
        } else {
          await joinRoom(
            previous.roomId,
          );
        }
      },
      [
        startHost,
        joinRoom,
      ],
    );

  /*
   * ==========================================================
   * LEAVE ROOM
   * ==========================================================
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
          "[WebRTC Hook] Leaving room",
        );

        /*
         * User explicitly left the room,
         * so don't preserve this connection
         * for automatic reconnect.
         */
        lastConnectionRef.current =
          null;

        await controller.disconnect();

        setStatus(
          "idle",
        );

        setRole(
          null,
        );

        setRoomId(
          null,
        );

        setPeerCount(
          0,
        );

        setRemoteStream(
          null,
        );

        setLastMessage(
          null,
        );

        setError(
          null,
        );
      },
      [],
    );

  /*
   * ==========================================================
   * SEND JSON
   * ==========================================================
   */

  const sendJSON =
    useCallback(
      (data: unknown) => {
        controllerRef.current?.sendJSON(
          data,
        );
      },
      [],
    );

  /*
   * ==========================================================
   * BACKWARD-COMPATIBLE START
   * ==========================================================
   */

  const start =
    useCallback(
      async () => {
        if (
          role ===
          "viewer"
        ) {
          if (!roomId) {
            throw new Error(
              "Room ID is required.",
            );
          }

          await joinRoom(
            roomId,
          );

          return;
        }

        await startHost(
          roomId ??
            undefined,
        );
      },
      [
        role,
        roomId,
        joinRoom,
        startHost,
      ],
    );

  /*
   * ==========================================================
   * BACKWARD-COMPATIBLE STOP
   * ==========================================================
   */

  const stop =
    useCallback(
      async () => {
        await leaveRoom();
      },
      [leaveRoom],
    );

  /*
   * ==========================================================
   * RETURN
   * ==========================================================
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
    reconnect,

    createRoomId,
  };
}