import { useState } from 'react'

import { useAvatarStore } from '../store/avatarStore'

export default function TrackingControls() {
  const headPose =
    useAvatarStore(
      (state) => state.headPose
    )

  const [smoothing, setSmoothing] =
    useState(0.15)

  const calibrate = () => {
    if (!headPose) return

    headPose.calibrate()
  }

  const handleSmoothingChange = (
    value: number
  ) => {
    setSmoothing(value)

    headPose?.setSmoothing(value)
  }

  return (
    <aside
      className="
        absolute
        left-5
        top-20
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
        <p className="text-sm font-semibold">
          Head Tracking
        </p>

        <p className="mt-1 text-xs text-zinc-400">
          Calibrate your neutral position
        </p>
      </div>

      <button
        onClick={calibrate}
        disabled={!headPose}
        className="
          w-full
          rounded-lg
          bg-white
          px-3
          py-2
          text-sm
          font-medium
          text-black
          transition
          hover:bg-zinc-200
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        Calibrate Head
      </button>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            Smoothing
          </span>

          <span className="text-xs text-zinc-300">
            {smoothing.toFixed(2)}
          </span>
        </div>

        <input
          type="range"
          min="0.05"
          max="0.5"
          step="0.01"
          value={smoothing}
          onChange={(event) =>
            handleSmoothingChange(
              Number(event.target.value)
            )
          }
          className="w-full"
        />
      </div>
    </aside>
  )
}