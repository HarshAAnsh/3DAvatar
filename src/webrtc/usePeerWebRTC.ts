import { useCallback, useEffect, useRef, useState } from "react";

import {
  PeerWebRTCController,
  type PeerConnectionState,
  type PeerRole,
} from "./PeerWebRTCController";

export function usePeerWebRTC(canvas: HTMLCanvasElement | null) {
  const controllerRef = useRef<PeerWebRTCController | null>(null);

  const [status, setStatus] = useState<PeerConnectionState>("idle");

  const [role, setRole] = useState<PeerRole>(null);

  const [roomId, setRoomId] = useState("");

  const [peerCount, setPeerCount] = useState(0);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [lastMessage, setLastMessage] = useState<unknown>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new PeerWebRTCController({
      onStatusChange: setStatus,

      onRemoteStream: (stream) => {
        setRemoteStream(stream);
      },

      onDataMessage: (data) => {
        setLastMessage(data);
      },

      onRoomJoined: (joinedRoom, count, joinedRole) => {
        setRoomId(joinedRoom);
        setPeerCount(count);
        setRole(joinedRole);
        setError(null);
      },

      onPeerReady: () => {
        setPeerCount(2);
      },

      onPeerLeft: () => {
        setPeerCount(1);
        setRemoteStream(null);
        setLastMessage(null);
      },

      onError: (message) => {
        setError(message);
      },
    });

    controllerRef.current = controller;

    return () => {
      void controller.disconnect();
      controllerRef.current = null;
    };
  }, []);

  const connect = useCallback(
    async (
      signalingUrl: string,
      nextRoomId: string,
      publishCanvas: boolean,
    ) => {
      if (!controllerRef.current) {
        throw new Error("WebRTC controller is not ready.");
      }

      setError(null);

      await controllerRef.current.connect(
        signalingUrl,
        nextRoomId,
        publishCanvas,
        canvas,
      );
      setRoomId(nextRoomId.trim().toUpperCase());
    },
    [canvas],
  );

  const disconnect = useCallback(async () => {
    await controllerRef.current?.disconnect();

    setStatus("idle");
    setRole(null);
    setRoomId("");
    setPeerCount(0);
    setRemoteStream(null);
    setLastMessage(null);
  }, []);

  const sendJSON = useCallback((data: unknown) => {
    controllerRef.current?.sendJSON(data);
  }, []);

  return {
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
  };
}
