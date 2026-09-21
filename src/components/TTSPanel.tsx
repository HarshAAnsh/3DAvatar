import { useEffect, useRef, useState } from "react";

import { useAvatarStore } from "../store/avatarStore";
import { TTSController } from "../avatar/TTSController";

export default function TTSPanel() {
  const speechAnimation = useAvatarStore((state) => state.speechAnimation);

  const mode = useAvatarStore((state) => state.mode);

  const [text, setText] = useState("Hello! I am a real-time AI avatar.");

  const [speaking, setSpeaking] = useState(false);

  const ttsRef = useRef<TTSController | null>(null);

  const textRef = useRef(text);

  const modeRef = useRef(mode);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    modeRef.current = mode;

    /*
     * If user switches from Demo
     * to Live while speaking,
     * stop the demo speech animation.
     */
    if (mode === "live" && speaking) {
      ttsRef.current?.stop();
      speechAnimation?.stop();
      setSpeaking(false);
    }
  }, [mode, speechAnimation, speaking]);

  useEffect(() => {
    const tts = new TTSController({
      onStart: () => {
        console.log("[TTSPanel] Speech started");

        if (modeRef.current === "demo") {
          speechAnimation?.start(textRef.current.trim());
        }

        setSpeaking(true);
      },

      onBoundary: (event) => {
        if (modeRef.current !== "demo") {
          return;
        }

        const boundaryIndex =
          typeof event === "number"
            ? event
            : ((event as { charIndex?: number })?.charIndex ?? 0);

        speechAnimation?.handleBoundary(boundaryIndex);
      },

      onEnd: () => {
        console.log("[TTSPanel] Speech ended");

        speechAnimation?.stop();

        setSpeaking(false);
      },

      onError: () => {
        speechAnimation?.stop();

        setSpeaking(false);
      },
    });

    ttsRef.current = tts;

    return () => {
      tts.stop();
      speechAnimation?.stop();
      ttsRef.current = null;
    };
  }, [speechAnimation]);

  const speak = () => {
    const trimmedText = text.trim();

    if (!trimmedText) return;

    if (mode !== "demo") {
      console.log("[TTSPanel] Switch to Demo mode to use TTS");

      return;
    }

    ttsRef.current?.speak(trimmedText);
  };

  const stop = () => {
    ttsRef.current?.stop();
    speechAnimation?.stop();
    setSpeaking(false);
  };

  const demoMode = mode === "demo";

  return (
    <aside
      className="
        absolute
        bottom-16
        left-1/2
        z-30
        w-[calc(100%-2rem)]
        max-w-xl
        -translate-x-1/2
        rounded-2xl
        border
        border-white/10
        bg-black/80
        p-3
        text-white
        shadow-2xl
        backdrop-blur-xl
        sm:bottom-5
        sm:p-4
      "
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Text to Speech</p>

          <p className="mt-1 text-xs text-zinc-500">
            {demoMode
              ? "Demo mode • Viseme lip-sync enabled"
              : "Switch to Demo mode to use TTS"}
          </p>
        </div>

        <div
          className={`
            rounded-full
            border
            px-2
            py-1
            text-[10px]
            font-medium
            uppercase
            tracking-wide
            ${
              speaking
                ? "border-white/20 bg-white text-black"
                : "border-white/10 bg-zinc-900 text-zinc-500"
            }
          `}
        >
          {speaking ? "Speaking" : "Idle"}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type something for the avatar to say..."
          disabled={!demoMode}
          className="
            min-h-[56px]
            w-full
            flex-1
            resize-none
            rounded-lg
            border
            border-white/10
            bg-zinc-900
            px-3
            py-2
            text-sm
            text-white
            outline-none
            placeholder:text-zinc-600
            focus:border-white/20
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        />

        <div
          className="
            flex
            h-10
            w-full
            gap-2
            sm:h-auto
            sm:w-20
            sm:flex-col
          "
        >
          <button
            type="button"
            onClick={speak}
            disabled={!demoMode || !text.trim() || speaking}
            className="
              flex-1
              rounded-lg
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-black
              transition
              hover:bg-zinc-200
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            Speak
          </button>

          <button
            type="button"
            onClick={stop}
            disabled={!speaking}
            className="
              flex-1
              rounded-lg
              border
              border-white/10
              bg-zinc-900
              px-3
              py-2
              text-xs
              font-medium
              text-zinc-300
              transition
              hover:bg-zinc-800
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            Stop
          </button>
        </div>
      </div>
    </aside>
  );
}
