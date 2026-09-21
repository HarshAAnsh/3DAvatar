export interface TTSCallbacks {
  onStart?: () => void;

  onEnd?: () => void;

  onBoundary?: (
    charIndex: number,
    charLength: number,
    elapsedTime: number,
    name: string,
  ) => void;

  onError?: (error: string) => void;
}

export class TTSController {
  private callbacks: TTSCallbacks;

  constructor(callbacks: TTSCallbacks = {}) {
    this.callbacks = callbacks;
  }

  // ==================================================
  // Speak
  // ==================================================

  speak(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      console.error("[TTS] Speech synthesis not supported");

      this.callbacks.onError?.("Speech synthesis is not supported");

      return;
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-US";

    // ==================================================
    // Speech started
    // ==================================================

    utterance.onstart = () => {
      console.log("[TTS] Speech started");

      this.callbacks.onStart?.();
    };

    // ==================================================
    // Speech boundary
    // ==================================================

    utterance.onboundary = (event) => {
      /*
       * Some browser/TypeScript combinations don't expose
       * charLength on SpeechSynthesisEvent.
       *
       * We safely read it when available.
       */
      const charLength =
        "charLength" in event && typeof event.charLength === "number"
          ? event.charLength
          : 0;

      console.log("[TTS] Boundary:", {
        name: event.name,
        charIndex: event.charIndex,
        charLength,
        elapsedTime: event.elapsedTime,
      });

      this.callbacks.onBoundary?.(
        event.charIndex,
        charLength,
        event.elapsedTime,
        event.name,
      );
    };

    // ==================================================
    // Speech ended
    // ==================================================

    utterance.onend = () => {
      console.log("[TTS] Speech ended");

      this.callbacks.onEnd?.();
    };

    // ==================================================
    // Speech error
    // ==================================================

    utterance.onerror = (event) => {
      console.error("[TTS] Speech error:", event.error);

      this.callbacks.onError?.(event.error);
    };

    window.speechSynthesis.speak(utterance);
  }

  // ==================================================
  // Stop
  // ==================================================

  stop() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  // ==================================================
  // Speaking state
  // ==================================================

  isSpeaking() {
    return window.speechSynthesis?.speaking ?? false;
  }
}
