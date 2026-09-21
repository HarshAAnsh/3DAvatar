import { useCallback, useEffect, useRef, useState } from "react";

import { WebRTCController, type WebRTCStatus } from "./WebRTCController";

export function useWebRTC(canvas: HTMLCanvasElement | null) {
  const controllerRef = useRef<WebRTCController | null>(null);

  const [status, setStatus] = useState<WebRTCStatus>("idle");

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [lastMessage, setLastMessage] = useState<unknown>(null);

  useEffect(() => {
    controllerRef.current = new WebRTCController({
      onStatusChange: setStatus,

      onDataMessage: (data) => {
        setLastMessage(data);
      },
    });

    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (!canvas) {
      throw new Error("Avatar canvas is not ready");
    }

    if (!controllerRef.current) {
      throw new Error("WebRTC controller is not initialized");
    }

    const stream = await controllerRef.current.start(canvas);

    setRemoteStream(stream);
  }, [canvas]);

  const stop = useCallback(async () => {
    await controllerRef.current?.stop();

    setRemoteStream(null);
    setLastMessage(null);
  }, []);

  const sendJSON = useCallback((data: unknown) => {
    controllerRef.current?.sendJSON(data);
  }, []);

  return {
    status,
    remoteStream,
    lastMessage,
    start,
    stop,
    sendJSON,
  };
}
