export interface TTSCallbacks {
  onStart?: () => void;

  onEnd?: () => void;

  onBoundary?: (event: SpeechSynthesisEvent) => void;

  onError?: (event: SpeechSynthesisErrorEvent) => void;
}

export class TTSController {
  private callbacks: TTSCallbacks;

  constructor(callbacks: TTSCallbacks = {}) {
    this.callbacks = callbacks;
  }

  speak(text: string) {
    if (!("speechSynthesis" in window)) {
      console.error("[TTS] Speech synthesis is not supported");

      return;
    }

    if (!text.trim()) {
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1;

    utterance.pitch = 1;

    utterance.volume = 1;

    utterance.onstart = () => {
      console.log("[TTS] Speech started");

      this.callbacks.onStart?.();
    };

    utterance.onend = () => {
      console.log("[TTS] Speech ended");

      this.callbacks.onEnd?.();
    };

    utterance.onboundary = (event) => {
      console.log("[TTS] Boundary:", {
        charIndex: event.charIndex,
        name: event.name,
      });

      this.callbacks.onBoundary?.(event);
    };

    utterance.onerror = (event) => {
      console.error("[TTS] Speech error:", event.error);

      this.callbacks.onError?.(event);
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  isSpeaking() {
    if (!("speechSynthesis" in window)) {
      return false;
    }

    return window.speechSynthesis.speaking;
  }
}
