import { useEffect, useRef, useState } from "react";

export default function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);

  const frameCountRef = useRef(0);

  const lastTimeRef = useRef(performance.now());

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const measure = (time: number) => {
      frameCountRef.current++;

      const elapsed = time - lastTimeRef.current;

      if (elapsed >= 1000) {
        const currentFps = (frameCountRef.current * 1000) / elapsed;

        const currentFrameTime = currentFps > 0 ? 1000 / currentFps : 0;

        setFps(Math.round(currentFps));

        setFrameTime(currentFrameTime);

        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }

      animationFrameRef.current = requestAnimationFrame(measure);
    };

    animationFrameRef.current = requestAnimationFrame(measure);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const performanceState = fps >= 50 ? "GOOD" : fps >= 30 ? "FAIR" : "LOW";

  return (
    <aside
      className="
    w-full
    rounded-xl
    border
    border-white/10
    bg-black/75
    px-3
    py-2
    text-[10px]
    text-zinc-400
    shadow-xl
    backdrop-blur-xl
  "
    >
      <div className="flex items-center gap-2 font-mono">
        <span>FPS {fps || "--"}</span>

        <span className="text-zinc-600">•</span>

        <span>{frameTime > 0 ? `${frameTime.toFixed(1)} ms` : "--"}</span>

        <span className="text-zinc-600">•</span>

        <span>{performanceState}</span>
      </div>
    </aside>
  );
}
