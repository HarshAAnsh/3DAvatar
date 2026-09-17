import { FacialAnimationEngine } from "./FacialAnimationEngine";
import { VisemeEngine } from "./VisemeEngine";
import { characterToViseme } from "./VisemeMapper";

export class SpeechAnimation {
  private engine: FacialAnimationEngine;
  private visemeEngine: VisemeEngine;

  private speaking = false;
  private text = "";

  private currentCharacterIndex = 0;

  private timeSinceCharacter = 0;

  /*
   * Used as a fallback between browser
   * speech boundary events.
   */
  private fallbackInterval = 0.08;

  constructor(engine: FacialAnimationEngine) {
    this.engine = engine;

    this.visemeEngine = new VisemeEngine(engine);

    console.log("[SpeechAnimation] Initialized");
  }

  start(text = "") {
    this.speaking = true;

    this.text = text;

    this.currentCharacterIndex = 0;

    this.timeSinceCharacter = 0;

    this.engine.setTTSActive(true);

    this.visemeEngine.setViseme("rest");

    console.log("[SpeechAnimation] START");
  }

  stop() {
    this.speaking = false;

    this.text = "";

    this.currentCharacterIndex = 0;

    this.timeSinceCharacter = 0;

    this.visemeEngine.setViseme("rest");

    this.engine.setTTSActive(false);

    this.engine.clearSource("tts");

    console.log("[SpeechAnimation] STOP");
  }

  /*
   * Called from SpeechSynthesis
   * when the browser reaches a
   * speech boundary.
   */
  handleBoundary(charIndex: number) {
    if (!this.speaking) {
      return;
    }

    if (!this.text) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(charIndex, this.text.length - 1));

    this.currentCharacterIndex = safeIndex;

    this.timeSinceCharacter = 0;

    const character = this.text[this.currentCharacterIndex];

    const viseme = characterToViseme(character);

    console.log("[SpeechAnimation] Boundary:", {
      charIndex: safeIndex,
      character,
      viseme,
    });

    this.visemeEngine.setViseme(viseme);
  }

  update(delta: number) {
    if (!this.speaking) {
      return;
    }

    this.timeSinceCharacter += delta;

    /*
     * Browser boundary events are not
     * guaranteed to fire for every
     * character on every browser.
     *
     * Use a lightweight fallback so
     * the mouth doesn't freeze between
     * boundary events.
     */
    if (this.timeSinceCharacter >= this.fallbackInterval) {
      this.timeSinceCharacter = 0;

      this.advanceFallbackCharacter();
    }

    this.visemeEngine.update(delta);
  }

  private advanceFallbackCharacter() {
    if (!this.text) {
      return;
    }

    if (this.currentCharacterIndex >= this.text.length - 1) {
      this.visemeEngine.setViseme("rest");

      return;
    }

    this.currentCharacterIndex++;

    const character = this.text[this.currentCharacterIndex];

    const viseme = characterToViseme(character);

    this.visemeEngine.setViseme(viseme);
  }
}
