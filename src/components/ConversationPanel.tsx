import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAvatarStore } from "../store/avatarStore";
import { useConversationStore } from "../store/conversationStore";

import {
  SpeechRecognitionController,
} from "../avatar/SpeechRecognitionController";

import {
  TTSController,
} from "../avatar/TTSController";

import {
  getDemoResponse,
} from "../avatar/DemoResponses";

import {
  getAIResponse,
  type ChatMessage,
} from "../services/aiService";

export default function ConversationPanel() {
  // ==================================================
  // Avatar state
  // ==================================================

  const mode = useAvatarStore(
    (state) => state.mode
  );

  const speechAnimation = useAvatarStore(
    (state) => state.speechAnimation
  );

  // ==================================================
  // Conversation store
  // ==================================================

  const state = useConversationStore(
    (state) => state.state
  );

  const transcript = useConversationStore(
    (state) => state.transcript
  );

  const response = useConversationStore(
    (state) => state.response
  );

  const setState = useConversationStore(
    (state) => state.setState
  );

  const setTranscript = useConversationStore(
    (state) => state.setTranscript
  );

  const setResponse = useConversationStore(
    (state) => state.setResponse
  );

  // ==================================================
  // Local UI state
  // ==================================================

  const [text, setText] = useState("");

  const [voiceSupported, setVoiceSupported] =
    useState(true);

  const [showConversation, setShowConversation] =
    useState(false);

  // ==================================================
  // Controller refs
  // ==================================================

  const ttsRef =
    useRef<TTSController | null>(null);

  const recognitionRef =
    useRef<SpeechRecognitionController | null>(
      null
    );

  // ==================================================
  // Latest response ref
  // ==================================================

  const responseRef =
    useRef(response);

  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  // ==================================================
  // Latest mode ref
  //
  // Prevents speech recognition from using
  // an old "demo/live" value.
  // ==================================================

  const modeRef =
    useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ==================================================
  // Latest speech animation ref
  // ==================================================

  const speechAnimationRef =
    useRef(speechAnimation);

  useEffect(() => {
    speechAnimationRef.current =
      speechAnimation;
  }, [speechAnimation]);

  // ==================================================
  // Conversation history
  // ==================================================

  const historyRef =
    useRef<ChatMessage[]>([]);

  // ==================================================
  // Add a conversation turn
  //
  // The explicit ChatMessage[] type + "as const"
  // prevents role from becoming generic string.
  // ==================================================

  const addToHistory = useCallback(
    (
      userMessage: string,
      assistantMessage: string
    ) => {
      const updatedHistory: ChatMessage[] = [
        ...historyRef.current,

        {
          role: "user" as const,
          text: userMessage,
        },

        {
          role: "assistant" as const,
          text: assistantMessage,
        },
      ].slice(-10);

      historyRef.current =
        updatedHistory;
    },
    []
  );

  // ==================================================
  // Central message handler
  //
  // Both text and voice input use this function.
  // ==================================================

  const handleUserMessage =
    useCallback(
      async (userMessage: string) => {
        const trimmed =
          userMessage.trim();

        if (!trimmed) {
          return;
        }

        // Only allow conversation in Demo mode
        if (modeRef.current !== "demo") {
          console.warn(
            "[Conversation] Demo mode required"
          );

          return;
        }

        console.log(
          "[Conversation] User:",
          trimmed
        );

        setTranscript(trimmed);

        setShowConversation(true);

        setState("thinking");

        try {
          // ==========================================
          // Ask Gemini
          // ==========================================

          console.log(
            "[Conversation] Asking AI..."
          );

          const aiResponse =
            await getAIResponse(
              trimmed,
              historyRef.current
            );

          console.log(
            "[Conversation] AI:",
            aiResponse
          );

          // ==========================================
          // Store response
          // ==========================================

          setResponse(aiResponse);

          responseRef.current =
            aiResponse;

          // ==========================================
          // Update history
          // ==========================================

          addToHistory(
            trimmed,
            aiResponse
          );

          // ==========================================
          // Speak response
          // ==========================================

          ttsRef.current?.speak(
            aiResponse
          );
        } catch (error) {
          // ==========================================
          // Gemini failed
          //
          // Use local DemoResponses fallback
          // ==========================================

          console.error(
            "[Conversation] AI failed:",
            error
          );

          const fallbackResponse =
            getDemoResponse(trimmed);

          console.log(
            "[Conversation] Fallback:",
            fallbackResponse
          );

          // ==========================================
          // Store fallback response
          // ==========================================

          setResponse(
            fallbackResponse
          );

          responseRef.current =
            fallbackResponse;

          // ==========================================
          // Store fallback history
          // ==========================================

          addToHistory(
            trimmed,
            fallbackResponse
          );

          // ==========================================
          // Speak fallback
          // ==========================================

          ttsRef.current?.speak(
            fallbackResponse
          );
        }
      },
      [
        addToHistory,
        setResponse,
        setState,
        setTranscript,
      ]
    );

  // ==================================================
  // Initialize TTS and Speech Recognition
  // ==================================================

  useEffect(() => {
    // =================================================
    // TTS
    // =================================================

    const tts =
      new TTSController({
        onStart: () => {
          console.log(
            "[Conversation] TTS started"
          );

          setState("speaking");

          speechAnimationRef.current?.start(
            responseRef.current
          );
        },

        onEnd: () => {
          console.log(
            "[Conversation] TTS ended"
          );

          speechAnimationRef.current?.stop();

          setState("idle");
        },

        onError: (error) => {
          console.error(
            "[Conversation] TTS error:",
            error
          );

          speechAnimationRef.current?.stop();

          setState("idle");
        },
      });

    ttsRef.current = tts;

    // =================================================
    // Speech Recognition
    // =================================================

    const recognition =
      new SpeechRecognitionController({
        onStart: () => {
          console.log(
            "[Conversation] Listening"
          );

          setShowConversation(true);

          setState("listening");
        },

        onResult: (recognizedText) => {
          console.log(
            "[Conversation] Voice input:",
            recognizedText
          );

          void handleUserMessage(
            recognizedText
          );
        },

        onEnd: () => {
          console.log(
            "[Conversation] Recognition ended"
          );
        },

        onError: (error) => {
          console.error(
            "[Conversation] Recognition error:",
            error
          );

          setState("idle");
        },
      });

    recognitionRef.current =
      recognition;

    setVoiceSupported(
      recognition.isSupported()
    );

    // =================================================
    // Cleanup
    // =================================================

    return () => {
      recognition.stop();

      tts.stop();

      speechAnimationRef.current?.stop();

      recognitionRef.current =
        null;

      ttsRef.current =
        null;
    };
  }, [
    handleUserMessage,
    setState,
  ]);

  // ==================================================
  // Text submission
  // ==================================================

  const submitText = () => {
    const trimmed =
      text.trim();

    if (!trimmed) {
      return;
    }

    if (modeRef.current !== "demo") {
      return;
    }

    setText("");

    void handleUserMessage(
      trimmed
    );
  };

  // ==================================================
  // Start voice recognition
  // ==================================================

  const startListening = () => {
    if (modeRef.current !== "demo") {
      return;
    }

    if (!voiceSupported) {
      console.warn(
        "[Conversation] Voice recognition not supported"
      );

      return;
    }

    if (
      state === "listening" ||
      state === "thinking" ||
      state === "speaking"
    ) {
      return;
    }

    console.log(
      "[Conversation] Starting voice recognition"
    );

    try {
      recognitionRef.current?.start();
    } catch (error) {
      console.error(
        "[Conversation] Could not start recognition:",
        error
      );

      setState("idle");
    }
  };

  // ==================================================
  // Stop conversation
  // ==================================================

  const stopConversation = () => {
    console.log(
      "[Conversation] Stopping"
    );

    recognitionRef.current?.stop();

    ttsRef.current?.stop();

    speechAnimationRef.current?.stop();

    setState("idle");
  };

  // ==================================================
  // UI state
  // ==================================================

  const demoMode =
    mode === "demo";

  const isListening =
    state === "listening";

  const isThinking =
    state === "thinking";

  const isSpeaking =
    state === "speaking";

  // ==================================================
  // UI
  // ==================================================

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
      {/* =================================================
          Conversation preview
          ================================================= */}

      {showConversation &&
        (transcript || response) && (
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
            {/* User */}

            {transcript && (
              <div className="flex gap-2">
                <span
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    text-zinc-600
                  "
                >
                  You
                </span>

                <p
                  className="
                    min-w-0
                    flex-1
                    truncate
                    text-xs
                    text-zinc-300
                  "
                >
                  {transcript}
                </p>
              </div>
            )}

            {/* AI */}

            {response && (
              <div className="mt-1 flex gap-2">
                <span
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    text-zinc-600
                  "
                >
                  AI
                </span>

                <p
                  className="
                    min-w-0
                    flex-1
                    truncate
                    text-xs
                    text-zinc-300
                  "
                >
                  {response}
                </p>
              </div>
            )}
          </div>
        )}

      {/* =================================================
          Main control
          ================================================= */}

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
          {/* Chat toggle */}

          <button
            type="button"
            onClick={() =>
              setShowConversation(
                (value) => !value
              )
            }
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
              hover:bg-zinc-800
              sm:block
            "
          >
            {showConversation
              ? "Hide"
              : "Chat"}
          </button>

          {/* Text input */}

          <input
            value={text}
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                event.preventDefault();

                submitText();
              }
            }}
            disabled={!demoMode}
            placeholder={
              demoMode
                ? "Ask the avatar..."
                : "Switch to Demo mode"
            }
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

          {/* Voice */}

          <button
            type="button"
            onClick={
              startListening
            }
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
            title={
              voiceSupported
                ? "Voice input"
                : "Voice recognition is not supported"
            }
          >
            {isListening
              ? "●"
              : "🎤"}
          </button>

          {/* Send */}

          <button
            type="button"
            onClick={
              submitText
            }
            disabled={
              !demoMode ||
              !text.trim() ||
              isThinking ||
              isSpeaking
            }
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

          {/* Stop */}

          <button
            type="button"
            onClick={
              stopConversation
            }
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

        {/* =================================================
            Status
            ================================================= */}

        <div
          className="
            mt-1
            flex
            items-center
            justify-center
          "
        >
          <span
            className="
              text-[10px]
              text-zinc-600
            "
          >
            {isListening
              ? "Listening..."
              : isThinking
                ? "Thinking..."
                : isSpeaking
                  ? "Speaking..."
                  : !voiceSupported
                    ? "Text interaction • Voice unavailable"
                    : "Voice + text interaction"}
          </span>
        </div>
      </div>
    </aside>
  );
}