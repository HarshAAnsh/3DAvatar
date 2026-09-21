import { useCallback, useEffect, useRef, useState } from "react";

import { useAvatarStore } from "../store/avatarStore";

import { useConversationStore } from "../store/conversationStore";

import { SpeechRecognitionController } from "../avatar/SpeechRecognitionController";

import { TTSController } from "../avatar/TTSController";

import { getDemoResponse } from "../avatar/DemoResponses";

import { inferEmotionFromText } from "../avatar/EmotionEngine";

import { getAIResponse, type ChatMessage } from "../services/aiService";

function ConversationPanel() {
  // ============================================================
  // AVATAR STATE
  // ============================================================

  const mode = useAvatarStore((state) => state.mode);

  const speechAnimation = useAvatarStore((state) => state.speechAnimation);

  const setEmotion = useAvatarStore((state) => state.setEmotion);

  // ============================================================
  // CONVERSATION STATE
  // ============================================================

  const conversationState = useConversationStore((state) => state.state);

  const setConversationState = useConversationStore((state) => state.setState);

  // ============================================================
  // LOCAL UI STATE
  // ============================================================

  const [message, setMessage] = useState("");

  const [isOpen, setIsOpen] = useState(true);

  const [isListening, setIsListening] = useState(false);

  // ============================================================
  // REFS
  // ============================================================

  const ttsRef = useRef<TTSController | null>(null);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);

  const responseRef = useRef("");

  const mountedRef = useRef(true);

  const processingRef = useRef(false);

  const historyRef = useRef<ChatMessage[]>([]);

  // ============================================================
  // COMPONENT CLEANUP
  // ============================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      try {
        ttsRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }

      try {
        speechAnimation?.stop();
      } catch {
        // Ignore cleanup errors.
      }
    };
  }, [speechAnimation]);

  // ============================================================
  // CHAT HISTORY
  // ============================================================

  const addToHistory = useCallback(
    (userText: string, assistantText: string) => {
      historyRef.current = [
        ...historyRef.current,

        {
          role: "user" as const,
          text: userText,
        },

        {
          role: "assistant" as const,
          text: assistantText,
        },
      ];

      // Keep the conversation small.
      if (historyRef.current.length > 20) {
        historyRef.current = historyRef.current.slice(-20);
      }
    },
    [],
  );

  // ============================================================
  // EMOTION
  // ============================================================

  const applyEmotion = useCallback(
    (text: string) => {
      const emotion = inferEmotionFromText(text);

      console.log("[Conversation] Emotion:", emotion);

      setEmotion(emotion);

      return emotion;
    },
    [setEmotion],
  );

  // ============================================================
  // HANDLE USER MESSAGE
  // ============================================================

  const handleUserMessage = useCallback(
    async (input: string) => {
      const trimmed = input.trim();

      if (!trimmed) {
        return;
      }

      if (processingRef.current) {
        console.log("[Conversation] Already processing");

        return;
      }

      processingRef.current = true;

      console.log("[Conversation] User:", trimmed);

      setMessage("");

      // ------------------------------------------------------
      // Stop current speech before new request
      // ------------------------------------------------------

      try {
        ttsRef.current?.stop();
      } catch {
        // Ignore.
      }

      try {
        speechAnimation?.stop();
      } catch {
        // Ignore.
      }

      try {
        // ----------------------------------------------------
        // THINKING
        // ----------------------------------------------------

        setConversationState("thinking");

        // ----------------------------------------------------
        // AI RESPONSE
        // ----------------------------------------------------

        let response = "";

        try {
          console.log("[Conversation] Asking AI...");

          response = await getAIResponse(trimmed, historyRef.current);

          console.log("[Conversation] AI:", response);
        } catch (error) {
          console.error("[Conversation] AI failed:", error);

          response = getDemoResponse(trimmed);

          console.log("[Conversation] Fallback:", response);
        }

        // ----------------------------------------------------
        // EMPTY RESPONSE FALLBACK
        // ----------------------------------------------------

        if (!response.trim()) {
          response = getDemoResponse(trimmed);

          console.log("[Conversation] Empty response fallback:", response);
        }

        // ----------------------------------------------------
        // EMOTION DETECTION
        // ----------------------------------------------------

        applyEmotion(response);

        // ----------------------------------------------------
        // HISTORY
        // ----------------------------------------------------

        addToHistory(trimmed, response);

        responseRef.current = response;

        // ----------------------------------------------------
        // SPEAK
        // ----------------------------------------------------

        setConversationState("speaking");

        ttsRef.current?.speak(response);
      } catch (error) {
        console.error("[Conversation] Unexpected error:", error);

        speechAnimation?.stop();

        setEmotion("neutral");

        setConversationState("idle");
      } finally {
        processingRef.current = false;
      }
    },
    [
      addToHistory,
      applyEmotion,
      setConversationState,
      setEmotion,
      speechAnimation,
    ],
  );

  // ============================================================
  // TTS CONTROLLER
  // ============================================================

  useEffect(() => {
    const tts = new TTSController({
      // ------------------------------------------------------
      // TTS START
      // ------------------------------------------------------

      onStart: () => {
        console.log("[Conversation] TTS started");

        setConversationState("speaking");

        // IMPORTANT:
        // Start the facial speech animation
        // using the same response that TTS is speaking.

        speechAnimation?.start(responseRef.current);
      },

      // ------------------------------------------------------
      // SPEECH BOUNDARY
      // ------------------------------------------------------

      onBoundary: (charIndex, charLength, elapsedTime, name) => {
        console.log("[Conversation] TTS boundary:", {
          charIndex,
          charLength,
          elapsedTime,
          name,
        });

        // Forward browser timing information
        // to SpeechAnimation.

        speechAnimation?.handleBoundary(charIndex, charLength, elapsedTime);
      },

      // ------------------------------------------------------
      // TTS END
      // ------------------------------------------------------

      onEnd: () => {
        console.log("[Conversation] TTS ended");

        if (!mountedRef.current) {
          return;
        }

        // Always stop speech animation.
        speechAnimation?.stop();

        // Return expression to neutral.
        setEmotion("neutral");

        setConversationState("idle");
      },

      // ------------------------------------------------------
      // TTS ERROR
      // ------------------------------------------------------

      onError: (error) => {
        console.error("[Conversation] TTS error:", error);

        if (!mountedRef.current) {
          return;
        }

        speechAnimation?.stop();

        setEmotion("neutral");

        setConversationState("idle");
      },
    });

    ttsRef.current = tts;

    return () => {
      tts.stop();

      if (ttsRef.current === tts) {
        ttsRef.current = null;
      }
    };
  }, [setConversationState, setEmotion, speechAnimation]);

  // ============================================================
  // SPEECH RECOGNITION
  // ============================================================

  useEffect(() => {
    const recognition = new SpeechRecognitionController({
      onStart: () => {
        console.log("[Conversation] Recognition started");

        setIsListening(true);

        setConversationState("listening");
      },

      onResult: (transcript: string) => {
        console.log("[Conversation] Recognition result:", transcript);

        setIsListening(false);

        void handleUserMessage(transcript);
      },

      onEnd: () => {
        console.log("[Conversation] Recognition ended");

        if (mountedRef.current) {
          setIsListening(false);
        }
      },

      onError: (error) => {
        console.error("[Conversation] Recognition error:", error);

        if (mountedRef.current) {
          setIsListening(false);

          setConversationState("idle");
        }
      },
    });

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [handleUserMessage, setConversationState]);

  // ============================================================
  // START LISTENING
  // ============================================================

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      console.log("[Conversation] Starting recognition");

      recognitionRef.current.start();
    }
  }, []);

  // ============================================================
  // STOP CONVERSATION
  // ============================================================

  const stopConversation = useCallback(() => {
    console.log("[Conversation] Stopping conversation");

    processingRef.current = false;

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore.
    }

    try {
      ttsRef.current?.stop();
    } catch {
      // Ignore.
    }

    try {
      speechAnimation?.stop();
    } catch {
      // Ignore.
    }

    setIsListening(false);

    setEmotion("neutral");

    setConversationState("idle");
  }, [setConversationState, setEmotion, speechAnimation]);

  // ============================================================
  // FORM SUBMIT
  // ============================================================

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void handleUserMessage(message);
  };

  // ============================================================
  // KEYBOARD
  // ============================================================

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      void handleUserMessage(message);
    }
  };

  // ============================================================
  // STATUS
  // ============================================================

  const statusLabel =
    conversationState === "listening"
      ? "Listening..."
      : conversationState === "thinking"
        ? "Thinking..."
        : conversationState === "speaking"
          ? "Speaking..."
          : "Ready";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section
      className="
    mx-auto
    w-full
    max-w-3xl
  "
    >
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-zinc-700/80
          bg-zinc-950/85
          shadow-2xl
          backdrop-blur-xl
        "
      >
        {/* ======================================================
            HEADER
        ======================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-zinc-800
            px-3
            py-2
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <div
              className={`
                h-2
                w-2
                rounded-full
                ${
                  conversationState === "speaking"
                    ? "bg-green-400"
                    : conversationState === "thinking"
                      ? "bg-yellow-400"
                      : conversationState === "listening"
                        ? "bg-blue-400"
                        : "bg-zinc-500"
                }
              `}
            />

            <span
              className="
                text-xs
                font-medium
                text-zinc-300
              "
            >
              {statusLabel}
            </span>

            <span
              className="
                hidden
                text-[10px]
                text-zinc-600
                sm:inline
              "
            >
              • {mode === "live" ? "Live mode" : "Demo mode"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="
              rounded-lg
              px-2
              py-1
              text-xs
              text-zinc-400
              transition
              hover:bg-zinc-800
              hover:text-white
            "
          >
            {isOpen ? "Hide" : "Chat"}
          </button>
        </div>

        {/* ======================================================
            BODY
        ======================================================= */}

        {isOpen && (
          <div className="p-3">
            <form
              onSubmit={handleSubmit}
              className="
                flex
                items-center
                gap-2
              "
            >
              {/* Input */}

              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to the avatar..."
                disabled={conversationState === "thinking"}
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  border-zinc-700
                  bg-zinc-900
                  px-3
                  py-2.5
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-zinc-600
                  focus:border-zinc-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />

              {/* Voice */}

              <button
                type="button"
                onClick={startListening}
                disabled={isListening || conversationState === "thinking"}
                aria-label="Start voice input"
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  transition
                  ${
                    isListening
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
                  }
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                `}
              >
                🎙
              </button>

              {/* Send */}

              <button
                type="submit"
                disabled={!message.trim() || conversationState === "thinking"}
                className="
                  h-10
                  shrink-0
                  rounded-xl
                  bg-white
                  px-4
                  text-sm
                  font-medium
                  text-black
                  transition
                  hover:bg-zinc-200
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Send
              </button>

              {/* Stop */}

              {conversationState === "speaking" && (
                <button
                  type="button"
                  onClick={stopConversation}
                  className="
                    h-10
                    shrink-0
                    rounded-xl
                    border
                    border-red-500/40
                    bg-red-500/10
                    px-3
                    text-xs
                    font-medium
                    text-red-400
                    transition
                    hover:bg-red-500/20
                  "
                >
                  Stop
                </button>
              )}
            </form>

            {/* Hint */}

            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                text-[10px]
                text-zinc-600
              "
            >
              <span>Text or voice • Gemini + local fallback</span>

              <span>{isListening ? "Listening" : "Ready"}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ConversationPanel;
