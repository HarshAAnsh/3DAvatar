import { SpeechTimeline, type SpeechFrame } from "./SpeechTimeline";

import type { VisemeType } from "./VisemeEngine";

import { VisemeEngine } from "./VisemeEngine";

import { FacialAnimationEngine } from "./FacialAnimationEngine";

export class SpeechAnimation {
  private engine: FacialAnimationEngine;

  private visemeEngine: VisemeEngine;

  private timeline = new SpeechTimeline();

  private frames: SpeechFrame[] = [];

  private frameIndex = 0;

  private frameElapsed = 0;

  private text = "";

  private speaking = false;

  private boundaryDriven = false;

  private lastBoundaryIndex = -1;

  constructor(engine: FacialAnimationEngine) {
    this.engine = engine;

    this.visemeEngine = new VisemeEngine(engine);

    console.log("[SpeechAnimation] Initialized");
  }

  // ==================================================
  // Start
  // ==================================================

  start(text: string) {
    this.text = text;

    this.speaking = true;

    this.boundaryDriven = false;

    this.lastBoundaryIndex = -1;

    this.frameElapsed = 0;

    this.frames = this.timeline.build(text);

    this.frameIndex = 0;

    this.engine.setTTSActive(true);

    this.visemeEngine.setViseme("rest");

    console.log("[SpeechAnimation] START");
  }

  // ==================================================
  // Stop
  // ==================================================

  stop() {
    this.speaking = false;

    this.text = "";

    this.frames = [];

    this.frameIndex = 0;

    this.frameElapsed = 0;

    this.boundaryDriven = false;

    this.lastBoundaryIndex = -1;

    this.visemeEngine.reset();

    this.engine.setTTSActive(false);

    this.engine.clearSource("tts");

    console.log("[SpeechAnimation] STOP");
  }

  // ==================================================
  // Boundary event from SpeechSynthesis
  // ==================================================

  handleBoundary(charIndex: number, charLength = 0, elapsedTime = 0) {
    if (!this.speaking) {
      return;
    }

    if (charIndex < this.lastBoundaryIndex) {
      return;
    }

    this.lastBoundaryIndex = charIndex;

    this.boundaryDriven = true;

    const character = this.text[charIndex]?.toLowerCase() ?? "";

    const viseme = this.characterToViseme(character);

    console.log("[SpeechAnimation] Boundary:", {
      charIndex,
      charLength,
      elapsedTime,
      character,
      viseme,
    });

    this.visemeEngine.setViseme(viseme);
  }

  // ==================================================
  // Update
  // ==================================================

  update(delta: number) {
    if (!this.speaking) {
      return;
    }

    // Boundary-driven mode:
    // SpeechSynthesis is telling us where it is.
    if (this.boundaryDriven) {
      this.visemeEngine.update(delta);

      return;
    }

    // -----------------------------------------------
    // Fallback mode
    //
    // Used when browser speech synthesis doesn't emit
    // boundary events.
    // -----------------------------------------------

    if (this.frames.length === 0) {
      this.visemeEngine.update(delta);

      return;
    }

    this.frameElapsed += delta;

    while (this.frameElapsed >= this.frames[this.frameIndex].duration) {
      this.frameElapsed -= this.frames[this.frameIndex].duration;

      this.frameIndex++;

      if (this.frameIndex >= this.frames.length) {
        this.frameIndex = this.frames.length - 1;

        this.visemeEngine.setViseme("rest");

        break;
      }

      this.visemeEngine.setViseme(this.frames[this.frameIndex].viseme);
    }

    if (this.frameIndex === 0 && this.frameElapsed === 0) {
      this.visemeEngine.setViseme(this.frames[0].viseme);
    }

    this.visemeEngine.update(delta);
  }

  // ==================================================
  // State
  // ==================================================

  isSpeaking() {
    return this.speaking;
  }

  // ==================================================
  // Character → viseme
  //
  // Used for browser boundary events.
  // ==================================================

  private characterToViseme(character: string): VisemeType {
    switch (character) {
      case "a":
        return "A";

      case "e":
        return "E";

      case "i":
      case "y":
        return "I";

      case "o":
        return "O";

      case "u":
      case "w":
        return "U";

      case "m":
      case "b":
      case "p":
        return "M";

      case "f":
      case "v":
        return "F";

      case "l":
      case "r":
        return "L";

      case "s":
      case "z":
      case "c":
      case "x":
      case "j":
      case "q":
      case "k":
      case "g":
      case "t":
      case "d":
      case "n":
      case "h":
        return "S";

      default:
        return "rest";
    }
  }
}
