import { useState } from "react";

import { useAvatarStore } from "../store/avatarStore";

const DEBUG_BLENDSHAPES = [
  "browInnerUp",
  "browDown_L",
  "browDown_R",
  "eyeBlink_L",
  "eyeBlink_R",
  "jawOpen",
  "mouthSmile_L",
  "mouthSmile_R",
  "mouthPucker",
  "mouthFunnel",
  "mouthClose",
];

export default function FacialDebugger() {
  const scene = useAvatarStore((state) => state.scene);
  const engine = useAvatarStore((state) => state.engine);

  const [values, setValues] = useState<Record<string, number>>({});

  const updateBlendshape = (name: string, value: number) => {
    if (!engine) return;

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    engine.setAvatarBlendshape(name, value);
  };

  const resetFace = () => {
    if (!engine) return;

    engine.reset();
    setValues({});
  };

  return (
    <aside
      className="
    w-full
    overflow-hidden
    rounded-xl
    border
    border-white/10
    bg-black/90
    shadow-2xl
    backdrop-blur-xl
  "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        className="
          border-b
          border-white/10
          px-3
          py-2.5

          sm:px-3.5
          sm:py-3
        "
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2
              className="
                truncate
                text-xs
                font-semibold
                text-white

                sm:text-sm
              "
            >
              Facial Debugger
            </h2>

            <p
              className="
                mt-0.5
                truncate
                text-[9px]
                text-zinc-500

                sm:text-[10px]
              "
            >
              ARKit blendshape controls
            </p>
          </div>

          <span
            className="
              shrink-0
              rounded-full
              border
              border-white/10
              bg-white/5
              px-2
              py-0.5
              text-[9px]
              text-zinc-400
            "
          >
            11
          </span>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
    max-h-[45vh]
    overflow-y-auto
    px-3
    py-2.5

    sm:max-h-[50vh]
    sm:px-3.5
    sm:py-3
  "
        style={{
          scrollbarWidth: "thin",
        }}
      >
        {/* ===================================================
            AVATAR STATUS
        ==================================================== */}

        <div
          className="
            mb-3
            rounded-lg
            border
            border-white/10
            bg-white/[0.03]
            px-2.5
            py-2
          "
        >
          <div
            className="
              text-[9px]
              uppercase
              tracking-wider
              text-zinc-500
            "
          >
            Avatar
          </div>

          <div
            className={`
              mt-0.5
              flex
              items-center
              gap-1.5
              text-xs
              font-medium
              ${scene ? "text-green-400" : "text-yellow-400"}
            `}
          >
            <span className="text-[8px]">●</span>

            {scene ? "Connected" : "Loading..."}
          </div>
        </div>

        {/* ===================================================
            BLENDSHAPES
        ==================================================== */}

        {scene && engine ? (
          <>
            <div className="space-y-2.5">
              {DEBUG_BLENDSHAPES.map((name) => {
                const value = values[name] ?? 0;

                return (
                  <div key={name}>
                    {/* Label */}

                    <div
                      className="
                          mb-0.5
                          flex
                          items-center
                          justify-between
                          gap-2
                        "
                    >
                      <span
                        className="
                            min-w-0
                            truncate
                            text-[10px]
                            text-zinc-300
                          "
                        title={name}
                      >
                        {name}
                      </span>

                      <span
                        className="
                            shrink-0
                            font-mono
                            text-[9px]
                            text-zinc-500
                          "
                      >
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
                        updateBlendshape(name, Number(event.target.value))
                      }
                      className="
                          h-1
                          w-full
                          cursor-pointer
                          accent-white
                        "
                      aria-label={name}
                    />
                  </div>
                );
              })}
            </div>

            {/* =================================================
                RESET
            ================================================== */}

            <button
              type="button"
              onClick={resetFace}
              className="
                mt-3
                w-full
                rounded-lg

                border
                border-white/10

                bg-white/5

                px-2.5
                py-1.5

                text-[10px]
                text-zinc-300

                transition

                hover:bg-white/10
                active:scale-[0.98]
              "
            >
              Reset Face
            </button>
          </>
        ) : (
          <div
            className="
              py-5
              text-center
              text-[10px]
              text-zinc-500
            "
          >
            Waiting for avatar...
          </div>
        )}
      </div>
    </aside>
  );
}
