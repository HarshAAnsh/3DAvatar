import { useEffect, useRef, useState } from "react";

import { useAvatarStore } from "../store/avatarStore";

import { useConversationStore } from "../store/conversationStore";

import { SpeechRecognitionController } from "../avatar/SpeechRecognitionController";

import { TTSController } from "../avatar/TTSController";

import { getDemoResponse } from "../avatar/DemoResponses";

export default function ConversationPanel() {
  const mode = useAvatarStore((state) => state.mode);

  const speechAnimation = useAvatarStore((state) => state.speechAnimation);

  const state = useConversationStore((state) => state.state);

  const transcript = useConversationStore((state) => state.transcript);

  const response = useConversationStore((state) => state.response);

  const setState = useConversationStore((state) => state.setState);

  const setTranscript = useConversationStore((state) => state.setTranscript);

  const setResponse = useConversationStore((state) => state.setResponse);

  const [text, setText] = useState("");

  const [voiceSupported, setVoiceSupported] = useState(true);

  const [showConversation, setShowConversation] = useState(false);

  const ttsRef = useRef<TTSController | null>(null);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);

  const responseRef = useRef(response);

  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  useEffect(() => {
    const tts = new TTSController({
      onStart: () => {
        console.log("[Conversation] TTS started");

        setState("speaking");

        speechAnimation?.start(responseRef.current);
      },

      onEnd: () => {
        console.log("[Conversation] TTS ended");

        speechAnimation?.stop();

        setState("idle");
      },

      onError: () => {
        speechAnimation?.stop();
        setState("idle");
      },
    });

    ttsRef.current = tts;

    const recognition = new SpeechRecognitionController({
      onStart: () => {
        console.log("[Conversation] Listening");

        setShowConversation(true);
        setState("listening");
      },

      onResult: (recognizedText) => {
        console.log("[Conversation] User:", recognizedText);

        setTranscript(recognizedText);

        setState("thinking");

        const demoResponse = getDemoResponse(recognizedText);

        console.log("[Conversation] Response:", demoResponse);

        setResponse(demoResponse);

        setShowConversation(true);

        ttsRef.current?.speak(demoResponse);
      },

      onEnd: () => {
        console.log("[Conversation] Recognition ended");
      },

      onError: (error) => {
        console.error("[Conversation] Recognition error:", error);

        setState("idle");
      },
    });

    recognitionRef.current = recognition;

    setVoiceSupported(recognition.isSupported());

    return () => {
      recognition.stop();
      tts.stop();
      speechAnimation?.stop();

      recognitionRef.current = null;
      ttsRef.current = null;
    };
  }, [speechAnimation, setState, setTranscript, setResponse]);

  const submitText = () => {
    const trimmed = text.trim();

    if (!trimmed) return;

    if (mode !== "demo") return;

    console.log("[Conversation] Text:", trimmed);

    setTranscript(trimmed);
    setText("");
    setShowConversation(true);

    setState("thinking");

    const demoResponse = getDemoResponse(trimmed);

    setResponse(demoResponse);

    ttsRef.current?.speak(demoResponse);
  };

  const startListening = () => {
    if (mode !== "demo") return;

    if (!voiceSupported) {
      console.warn("[Conversation] Voice recognition not supported");

      return;
    }

    if (state === "listening" || state === "thinking" || state === "speaking") {
      return;
    }

    recognitionRef.current?.start();
  };

  const stopConversation = () => {
    recognitionRef.current?.stop();
    ttsRef.current?.stop();

    speechAnimation?.stop();

    setState("idle");
  };

  const demoMode = mode === "demo";

  const isListening = state === "listening";

  const isThinking = state === "thinking";

  const isSpeaking = state === "speaking";

  return (
    <aside
      className="
        absolute
        bottom-4
        left-1/2
        z-30
        w-[calc(100%-2rem)]
        max-w-lg
        -translate-x-1/2
      "
    >
      {/* Expanded conversation */}
      {showConversation && (transcript || response) && (
        <div
          className="
              mb-2
              rounded-xl
              border
              border-white/10
              bg-black/75
              px-3
              py-2
              shadow-xl
              backdrop-blur-xl
            "
        >
          {transcript && (
            <div className="flex gap-2">
              <span className="text-[10px] font-medium uppercase text-zinc-600">
                You
              </span>

              <p className="min-w-0 flex-1 truncate text-xs text-zinc-300">
                {transcript}
              </p>
            </div>
          )}

          {response && (
            <div className="mt-1 flex gap-2">
              <span className="text-[10px] font-medium uppercase text-zinc-600">
                AI
              </span>

              <p className="min-w-0 flex-1 truncate text-xs text-zinc-300">
                {response}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main compact control */}
      <div
        className="
          rounded-xl
          border
          border-white/10
          bg-black/85
          p-2
          shadow-2xl
          backdrop-blur-xl
        "
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConversation((value) => !value)}
            className="
              hidden
              rounded-lg
              border
              border-white/10
              bg-zinc-900
              px-3
              py-2
              text-xs
              text-zinc-400
              sm:block
            "
          >
            {showConversation ? "Hide" : "Chat"}
          </button>

          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitText();
              }
            }}
            disabled={!demoMode}
            placeholder={demoMode ? "Ask the avatar..." : "Switch to Demo mode"}
            className="
              min-w-0
              flex-1
              rounded-lg
              border
              border-white/10
              bg-zinc-900
              px-3
              py-2
              text-xs
              text-white
              outline-none
              placeholder:text-zinc-600
              focus:border-white/20
              disabled:opacity-40
            "
          />

          <button
            type="button"
            onClick={startListening}
            disabled={
              !demoMode ||
              !voiceSupported ||
              isListening ||
              isThinking ||
              isSpeaking
            }
            className="
              rounded-lg
              border
              border-white/10
              bg-zinc-900
              px-3
              py-2
              text-xs
              text-zinc-200
              hover:bg-zinc-800
              disabled:opacity-30
            "
            title="Voice input"
          >
            {isListening ? "●" : "🎤"}
          </button>

          <button
            type="button"
            onClick={submitText}
            disabled={!demoMode || !text.trim() || isThinking || isSpeaking}
            className="
              rounded-lg
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-black
              hover:bg-zinc-200
              disabled:opacity-30
            "
          >
            Send
          </button>

          <button
            type="button"
            onClick={stopConversation}
            className="
              rounded-lg
              border
              border-white/10
              bg-zinc-900
              px-3
              py-2
              text-xs
              text-zinc-400
              hover:bg-zinc-800
            "
          >
            Stop
          </button>
        </div>

        {/* Small state indicator */}
        <div className="mt-1 flex items-center justify-center">
          <span className="text-[10px] text-zinc-600">
            {isListening
              ? "Listening..."
              : isThinking
                ? "Thinking..."
                : isSpeaking
                  ? "Speaking..."
                  : "Voice + text interaction"}
          </span>
        </div>
      </div>
    </aside>
  );
}
