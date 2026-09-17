import { useEffect, useRef, useState } from 'react'

export default function PerformanceMonitor() {
  const [fps, setFps] = useState(0)
  const [frameTime, setFrameTime] = useState(0)

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameRef =
    useRef<number | null>(null)

  useEffect(() => {
    const measure = (time: number) => {
      frameCountRef.current++

      const elapsed =
        time - lastTimeRef.current

      if (elapsed >= 1000) {
        const currentFps =
          (frameCountRef.current * 1000) /
          elapsed

        const currentFrameTime =
          currentFps > 0
            ? 1000 / currentFps
            : 0

        setFps(
          Math.round(currentFps)
        )

        setFrameTime(
          currentFrameTime
        )

        frameCountRef.current = 0
        lastTimeRef.current = time
      }

      animationFrameRef.current =
        requestAnimationFrame(measure)
    }

    animationFrameRef.current =
      requestAnimationFrame(measure)

    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        )
      }
    }
  }, [])

  const performanceState =
    fps >= 50
      ? 'GOOD'
      : fps >= 30
        ? 'FAIR'
        : 'LOW'

  return (
    <aside
      className="
        absolute
        bottom-6
        right-5
        z-30
        w-48
        rounded-xl
        border
        border-white/10
        bg-black/75
        p-3
        text-white
        shadow-xl
        backdrop-blur-xl
      "
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold">
            Performance
          </p>

          <p className="mt-0.5 text-[10px] text-zinc-500">
            Runtime telemetry
          </p>
        </div>

        <span
          className="
            rounded-full
            border
            border-white/10
            bg-zinc-900
            px-2
            py-1
            text-[9px]
            font-medium
            uppercase
            tracking-wide
            text-zinc-400
          "
        >
          {performanceState}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <MetricRow
          label="FPS"
          value={fps > 0 ? `${fps}` : '--'}
        />

        <MetricRow
          label="Frame"
          value={
            frameTime > 0
              ? `${frameTime.toFixed(1)} ms`
              : '--'
          }
        />

        <MetricRow
          label="Tracking"
          value="~20 FPS"
        />
      </div>
    </aside>
  )
}

function MetricRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">
        {label}
      </span>

      <span className="font-mono text-zinc-200">
        {value}
      </span>
    </div>
  )
}