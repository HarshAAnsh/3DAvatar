export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

type RecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

export class SpeechRecognitionController {
  private recognition: RecognitionInstance | null = null;

  private callbacks: SpeechRecognitionCallbacks;

  constructor(callbacks: SpeechRecognitionCallbacks = {}) {
    this.callbacks = callbacks;

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[SpeechRecognition] Not supported");

      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("[SpeechRecognition] START");

      this.callbacks.onStart?.();
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      console.log("[SpeechRecognition] RESULT:", transcript);

      this.callbacks.onResult?.(transcript);
    };

    recognition.onend = () => {
      console.log("[SpeechRecognition] END");

      this.callbacks.onEnd?.();
    };

    recognition.onerror = (event) => {
      console.error("[SpeechRecognition] ERROR:", event.error);

      this.callbacks.onError?.(event.error);
    };

    this.recognition = recognition;
  }

  isSupported() {
    return Boolean(this.recognition);
  }

  start() {
    if (!this.recognition) {
      this.callbacks.onError?.("Speech recognition is not supported");

      return;
    }

    this.recognition.start();
  }

  stop() {
    this.recognition?.stop();
  }
}

declare global {
  interface Window {
    SpeechRecognition?: new () => RecognitionInstance;

    webkitSpeechRecognition?: new () => RecognitionInstance;
  }
}
