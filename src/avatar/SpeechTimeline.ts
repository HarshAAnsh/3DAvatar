import type { VisemeType } from "./VisemeEngine";

export interface SpeechFrame {
  viseme: VisemeType;
  duration: number;
}

export interface SpeechTimelineConfig {
  characterDuration?: number;
  vowelDuration?: number;
  consonantDuration?: number;
  shortPause?: number;
  mediumPause?: number;
  longPause?: number;
}

const DEFAULT_CONFIG: Required<SpeechTimelineConfig> = {
  characterDuration: 0.075,
  vowelDuration: 0.095,
  consonantDuration: 0.07,
  shortPause: 0.1,
  mediumPause: 0.2,
  longPause: 0.38,
};

export class SpeechTimeline {
  private config: Required<SpeechTimelineConfig>;

  constructor(config: SpeechTimelineConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  build(text: string): SpeechFrame[] {
    const frames: SpeechFrame[] = [];

    for (const char of text) {
      const character = char.toLowerCase();

      // --------------------------------------------
      // Whitespace
      // --------------------------------------------

      if (/\s/.test(character)) {
        frames.push({
          viseme: "rest",
          duration: this.config.shortPause,
        });

        continue;
      }

      // --------------------------------------------
      // Punctuation
      // --------------------------------------------

      if (/[.!?]/.test(character)) {
        frames.push({
          viseme: "rest",
          duration: this.config.longPause,
        });

        continue;
      }

      if (/[,;:]/.test(character)) {
        frames.push({
          viseme: "rest",
          duration: this.config.mediumPause,
        });

        continue;
      }

      if (/[-–—]/.test(character)) {
        frames.push({
          viseme: "rest",
          duration: this.config.mediumPause,
        });

        continue;
      }

      // --------------------------------------------
      // Non alphabetic characters
      // --------------------------------------------

      if (!/[a-z]/.test(character)) {
        frames.push({
          viseme: "rest",
          duration: this.config.characterDuration,
        });

        continue;
      }

      // --------------------------------------------
      // Letter → viseme
      // --------------------------------------------

      const viseme = this.characterToViseme(character);

      // Vowels generally need slightly more
      // mouth-open time.
      const duration = this.isVowel(character)
        ? this.config.vowelDuration
        : this.config.consonantDuration;

      frames.push({
        viseme,
        duration,
      });
    }

    return this.compressFrames(frames);
  }

  private compressFrames(frames: SpeechFrame[]): SpeechFrame[] {
    if (frames.length === 0) {
      return [];
    }

    const result: SpeechFrame[] = [];

    for (const frame of frames) {
      const previous = result[result.length - 1];

      if (previous && previous.viseme === frame.viseme) {
        previous.duration += frame.duration;

        continue;
      }

      result.push({
        viseme: frame.viseme,
        duration: frame.duration,
      });
    }

    return result;
  }

  private isVowel(character: string): boolean {
    return "aeiou".includes(character);
  }

  private characterToViseme(character: string): VisemeType {
    switch (character) {
      // ------------------------------------------
      // Open vowel
      // ------------------------------------------

      case "a":
        return "A";

      // ------------------------------------------
      // Front vowels
      // ------------------------------------------

      case "e":
        return "E";

      case "i":
      case "y":
        return "I";

      // ------------------------------------------
      // Rounded vowels
      // ------------------------------------------

      case "o":
        return "O";

      case "u":
      case "w":
        return "U";

      // ------------------------------------------
      // Bilabial
      // ------------------------------------------

      case "m":
      case "b":
      case "p":
        return "M";

      // ------------------------------------------
      // Labiodental
      // ------------------------------------------

      case "f":
      case "v":
        return "F";

      // ------------------------------------------
      // Tongue / alveolar
      // ------------------------------------------

      case "l":
      case "r":
        return "L";

      // ------------------------------------------
      // Sibilant
      // ------------------------------------------

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
