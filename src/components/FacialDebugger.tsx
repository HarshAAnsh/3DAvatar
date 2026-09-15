import { useState } from 'react'

import { useAvatarStore } from '../store/avatarStore'

const DEBUG_BLENDSHAPES = [
  'browInnerUp',
  'browDown_L',
  'browDown_R',

  'eyeBlink_L',
  'eyeBlink_R',

  'jawOpen',

  'mouthSmile_L',
  'mouthSmile_R',

  'mouthPucker',
  'mouthFunnel',

  'mouthClose',
]

export default function FacialDebugger() {
  const scene = useAvatarStore(
    (state) => state.scene
  )

  const engine = useAvatarStore(
    (state) => state.engine
  )

  const [values, setValues] =
    useState<Record<string, number>>({})

  const updateBlendshape = (
    name: string,
    value: number
  ) => {
    if (!engine) return

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))

    engine.setAvatarBlendshape(
      name,
      value
    )
  }

  const resetFace = () => {
    if (!engine) return

    engine.reset()

    setValues({})
  }

  return (
    <aside
      className="
        absolute
        z-20

        right-4
        top-20

        w-80
        max-w-[calc(100vw-2rem)]

        max-h-[calc(100vh-6rem)]
        overflow-y-auto

        rounded-2xl
        border
        border-white/10

        bg-black/80
        p-4

        text-white

        shadow-2xl
        backdrop-blur-xl

        max-[640px]:left-4
        max-[640px]:right-4
        max-[640px]:top-auto
        max-[640px]:bottom-4
        max-[640px]:w-auto
        max-[640px]:max-h-[45vh]
      "
    >
      {/* Header */}

      <div className="mb-4">
        <h2 className="text-sm font-semibold">
          Facial Debugger
        </h2>

        <p className="mt-1 text-xs text-zinc-500">
          ARKit-style blendshape controls
        </p>
      </div>

      {/* Avatar Status */}

      <div className="mb-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <div className="text-xs text-zinc-400">
          Avatar
        </div>

        <div
          className={`mt-1 text-sm ${
            scene
              ? 'text-green-400'
              : 'text-yellow-400'
          }`}
        >
          <span className="mr-1">
            ●
          </span>

          {scene
            ? 'Connected'
            : 'Loading...'}
        </div>
      </div>

      {/* Blendshape Controls */}

      {scene && engine && (
        <>
          <div className="space-y-4">
            {DEBUG_BLENDSHAPES.map(
              (name) => {
                const value =
                  values[name] ?? 0

                return (
                  <div key={name}>
                    {/* Label */}

                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-xs text-zinc-300">
                        {name}
                      </span>

                      <span className="shrink-0 font-mono text-xs text-zinc-500">
                        {value.toFixed(2)}
                      </span>
                    </div>

                    {/* Slider */}

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={value}
                      onChange={(event) =>
                        updateBlendshape(
                          name,
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>
                )
              }
            )}
          </div>

          {/* Reset */}

          <button
            type="button"
            onClick={resetFace}
            className="
              mt-5
              w-full
              rounded-lg
              border
              border-white/10
              bg-white/5
              px-3
              py-2
              text-xs
              text-zinc-300
              transition
              hover:bg-white/10
            "
          >
            Reset Face
          </button>
        </>
      )}
    </aside>
  )
}