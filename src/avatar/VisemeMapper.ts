import type { Viseme } from "./VisemeEngine";

/**
 * Maps a single character to a viseme.
 */
export function mapCharacterToViseme(character: string): Viseme {
  const char = character.toLowerCase();

  switch (char) {
    // ----------------------------------------------
    // Vowels
    // ----------------------------------------------

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

    // ----------------------------------------------
    // Bilabial
    // ----------------------------------------------

    case "m":
    case "b":
    case "p":
      return "M";

    // ----------------------------------------------
    // Labiodental
    // ----------------------------------------------

    case "f":
    case "v":
      return "F";

    // ----------------------------------------------
    // Tongue / alveolar
    // ----------------------------------------------

    case "l":
    case "r":
      return "L";

    // ----------------------------------------------
    // Sibilant / consonant
    // ----------------------------------------------

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

    // ----------------------------------------------
    // Everything else
    // ----------------------------------------------

    default:
      return "rest";
  }
}

/**
 * Maps an entire string to visemes.
 */
export function mapTextToVisemes(text: string): Viseme[] {
  return Array.from(text).map(mapCharacterToViseme);
}

/**
 * Legacy-style mapper object.
 *
 * Useful if existing code expects a mapper object.
 */
export const VisemeMapper = {
  characterToViseme: mapCharacterToViseme,

  textToVisemes: mapTextToVisemes,
};
