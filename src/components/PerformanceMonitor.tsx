import { useEffect, useRef, useState } from 'react'

export default function PerformanceMonitor() {
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(
    performance.now()
  )

  const [fps, setFps] = useState(0)

  useEffect(() => {
    let animationFrame = 0

    const update = () => {
      frameCountRef.current++

      const now = performance.now()

      const elapsed =
        now - lastTimeRef.current

      if (elapsed >= 1000) {
        const currentFps =
          (frameCountRef.current /
            elapsed) *
          1000

        setFps(
          Math.round(currentFps)
        )

        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      animationFrame =
        requestAnimationFrame(update)
    }

    animationFrame =
      requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(
        animationFrame
      )
    }
  }, [])

  return (
    <div
      className="
        absolute
        bottom-20
        right-5
        z-30
        rounded-lg
        border
        border-white/10
        bg-black/70
        px-3
        py-2
        text-xs
        text-zinc-300
        backdrop-blur-xl
      "
    >
      FPS: {fps}
    </div>
  )
}