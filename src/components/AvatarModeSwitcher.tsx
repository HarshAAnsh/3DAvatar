import { useAvatarStore } from "../store/avatarStore";

export default function AvatarModeSwitcher() {
  const mode = useAvatarStore((state) => state.mode);

  const setMode = useAvatarStore((state) => state.setMode);

  const handleModeChange = (nextMode: "live" | "demo") => {
    setMode(nextMode);
  };

  return (
    <div
      className="
        absolute
        left-1/2
        top-5
        z-30
        -translate-x-1/2
        rounded-xl
        border
        border-white/10
        bg-black/80
        p-1
        shadow-xl
        backdrop-blur-xl
      "
    >
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleModeChange("live")}
          className={`
            rounded-lg
            px-4
            py-2
            text-xs
            font-medium
            transition
            ${
              mode === "live"
                ? "bg-white text-black"
                : "text-zinc-400 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          Live
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("demo")}
          className={`
            rounded-lg
            px-4
            py-2
            text-xs
            font-medium
            transition
            ${
              mode === "demo"
                ? "bg-white text-black"
                : "text-zinc-400 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          Demo
        </button>
      </div>
    </div>
  );
}
