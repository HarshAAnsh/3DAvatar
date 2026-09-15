import { useEffect, useRef, useState } from "react";

import { useAvatarStore } from "../store/avatarStore";

import { TTSController } from "../avatar/TTSController";

import { SpeechAnimation } from "../avatar/SpeechAnimation";

export default function TTSPanel() {
  const engine = useAvatarStore((state) => state.engine);

  const [text, setText] = useState("Hello! I am a real-time AI avatar.");

  const [speaking, setSpeaking] = useState(false);

  const ttsRef = useRef<TTSController | null>(null);

  const speechRef = useRef<SpeechAnimation | null>(null);

  useEffect(() => {
    if (!engine) return;

    const speech = new SpeechAnimation(engine);

    speechRef.current = speech;

    const tts = new TTSController({
      onStart: () => {
        speech.start();
        setSpeaking(true);
      },

      onEnd: () => {
        speech.stop();
        setSpeaking(false);
      },
    });

    ttsRef.current = tts;

    return () => {
      tts.stop();
      speech.stop();
      ttsRef.current = null;
      speechRef.current = null;
    };
  }, [engine]);

  const speak = () => {
    if (!text.trim()) return;

    ttsRef.current?.speak(text.trim());
  };

  const stop = () => {
    ttsRef.current?.stop();
    speechRef.current?.stop();
    setSpeaking(false);
  };

  return (
    <aside
      className="
    absolute
    bottom-16
    left-1/2
    z-30
    w-[min(740px,calc(100vw-2rem))]
    max-h-[230px]
    -translate-x-1/2
    rounded-2xl
    border
    border-white/10
    bg-black/80
    p-4
    shadow-2xl
    backdrop-blur-xl
  "
    >
      <div className="mb-3">
        <p className="text-sm font-semibold text-white">Avatar Speech</p>

        <p className="mt-1 text-xs text-zinc-400">
          Browser-based text-to-speech
        </p>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        className="
          w-full
          resize-none
          rounded-lg
          border
          border-white/10
          bg-zinc-900
          p-3
          text-sm
          text-white
          outline-none
          placeholder:text-zinc-600
        "
        placeholder="Type something for the avatar to say..."
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={speak}
          disabled={speaking || !engine}
          className="
            flex-1
            rounded-lg
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-black
            hover:bg-zinc-200
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Speak
        </button>

        <button
          onClick={stop}
          className="
            rounded-lg
            border
            border-white/10
            bg-zinc-900
            px-4
            py-2
            text-sm
            text-white
            hover:bg-zinc-800
          "
        >
          Stop
        </button>
      </div>

      {speaking && (
        <div className="mt-3 text-center text-xs text-green-400">
          ● AVATAR SPEAKING
        </div>
      )}
    </aside>
  );
}
