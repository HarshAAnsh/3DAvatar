import { useConversationStore } from "../store/conversationStore";

export default function ConversationStatus() {
  const state = useConversationStore((state) => state.state);

  const labels = {
    idle: "Ready",
    listening: "Listening",
    thinking: "Thinking",
    speaking: "Speaking",
  };

  const label = labels[state];

  return (
    <div
      className="
    w-fit
    rounded-full
    border
    border-white/10
    bg-black/75
    px-3
    py-1.5
    text-xs
    text-white
    shadow-xl
    backdrop-blur-xl
  "
    >
      <div className="flex items-center gap-2">
        <span
          className={`
            h-2
            w-2
            rounded-full
            ${
              state === "speaking"
                ? "animate-pulse bg-green-400"
                : state === "listening"
                  ? "animate-pulse bg-blue-400"
                  : state === "thinking"
                    ? "animate-pulse bg-yellow-400"
                    : "bg-zinc-500"
            }
          `}
        />

        <span>{label}</span>
      </div>
    </div>
  );
}
