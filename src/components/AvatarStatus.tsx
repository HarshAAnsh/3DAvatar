import { useEffect, useState } from "react";
import { useAvatarStore } from "../store/avatarStore";

export default function AvatarStatus() {
  const headPose = useAvatarStore((state) => state.headPose);

  const speechAnimation = useAvatarStore((state) => state.speechAnimation);

  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let animationFrame = 0;

    const measure = () => {
      frames++;

      const now = performance.now();

      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }

      animationFrame = requestAnimationFrame(measure);
    };

    animationFrame = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const headTracking = headPose?.isCalibrated();

  return (
    <aside
      className="
        absolute
        right-5
        top-[18rem]
        z-30
        w-64
        rounded-2xl
        border
        border-white/10
        bg-black/80
        p-4
        text-white
        shadow-2xl
        backdrop-blur-xl
      "
    >
      <div className="mb-4">
        <p className="text-sm font-semibold">Avatar System</p>

        <p className="mt-1 text-xs text-zinc-500">Real-time pipeline</p>
      </div>

      <div className="space-y-2 text-xs">
        <StatusRow label="Avatar" status="READY" active />

        <StatusRow label="Face Tracking" status="ACTIVE" active />

        <StatusRow
          label="Head Tracking"
          status={headTracking ? "ACTIVE" : "CALIBRATE"}
          active={Boolean(headTracking)}
        />

        <StatusRow
          label="TTS"
          status={speechAnimation ? "READY" : "WAITING"}
          active={Boolean(speechAnimation)}
        />

        <StatusRow label="Lip Sync" status="READY" active />

        <StatusRow label="Procedural" status="ACTIVE" active />
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">FPS</span>

          <span className="font-mono text-zinc-200">{fps}</span>
        </div>
      </div>
    </aside>
  );
}

function StatusRow({
  label,
  status,
  active,
}: {
  label: string;
  status: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            active ? "bg-green-400" : "bg-zinc-600"
          }`}
        />

        <span className="text-zinc-300">{label}</span>
      </div>

      <span className="font-mono text-zinc-500">{status}</span>
    </div>
  );
}
