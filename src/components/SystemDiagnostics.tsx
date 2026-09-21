import { useEffect, useState } from "react";

import { useAvatarStore } from "../store/avatarStore";

import {
  detectRuntimeCapabilities,
  type RuntimeCapabilities,
} from "../utils/capabilities";

export default function SystemDiagnostics() {
  const mode = useAvatarStore((state) => state.mode);

  const headPose = useAvatarStore((state) => state.headPose);

  const speechAnimation = useAvatarStore((state) => state.speechAnimation);

  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(
    null,
  );

  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const detected = detectRuntimeCapabilities();

    setCapabilities(detected);
  }, []);

  useEffect(() => {
    const updateFallback = () => {
      const trackingActive = headPose?.isTrackingActive() ?? false;

      setFallback(!trackingActive && mode === "live");
    };

    updateFallback();

    const interval = window.setInterval(updateFallback, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [headPose, mode]);

  if (!capabilities) {
    return null;
  }

  const headTrackingActive = headPose?.isTrackingActive() ?? false;

  const ttsReady = Boolean(speechAnimation) && capabilities.speechSynthesis;

  return (
    <aside
      className="
    w-full
    rounded-xl
    border
    border-white/10
    bg-black/80
    p-3
    text-white
    shadow-xl
    backdrop-blur-xl
  "
    >
      <div className="mb-4">
        <p className="text-sm font-semibold">System Diagnostics</p>

        <p className="mt-1 text-xs text-zinc-500">Runtime capabilities</p>
      </div>

      <div className="space-y-2 text-xs">
        <DiagnosticRow
          label="WebGL 2"
          value={capabilities.webgl2 ? "READY" : "UNAVAILABLE"}
          active={capabilities.webgl2}
        />

        <DiagnosticRow label="GPU" value={formatGpu(capabilities.gpu)} active />

        <DiagnosticRow
          label="Camera"
          value={capabilities.cameraApi ? "READY" : "UNAVAILABLE"}
          active={capabilities.cameraApi}
        />

        <DiagnosticRow label="MediaPipe" value="READY" active />

        <DiagnosticRow
          label="Head Tracking"
          value={headTrackingActive ? "ACTIVE" : "INACTIVE"}
          active={headTrackingActive}
        />

        <DiagnosticRow
          label="TTS"
          value={ttsReady ? "READY" : "UNAVAILABLE"}
          active={ttsReady}
        />

        <DiagnosticRow
          label="Fallback"
          value={fallback ? "ON" : "OFF"}
          active={!fallback}
        />

        <DiagnosticRow label="Mode" value={mode.toUpperCase()} active />
      </div>
    </aside>
  );
}

function DiagnosticRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className={
            active
              ? "h-2 w-2 rounded-full bg-green-400"
              : "h-2 w-2 rounded-full bg-zinc-600"
          }
        />

        <span className="text-zinc-300">{label}</span>
      </div>

      <span
        className="
          max-w-32
          truncate
          text-right
          font-mono
          text-[10px]
          text-zinc-500
        "
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function formatGpu(gpu: string) {
  if (gpu.length <= 24) {
    return gpu;
  }

  return `${gpu.slice(0, 21)}...`;
}
