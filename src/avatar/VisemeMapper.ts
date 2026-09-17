import type { Viseme } from "./VisemeEngine";

export function characterToViseme(character: string): Viseme {
  const char = character.toUpperCase();

  switch (char) {
    case "A":
      return "A";

    case "E":
      return "E";

    case "I":
      return "I";

    case "O":
      return "O";

    case "U":
      return "U";

    case "M":
    case "B":
    case "P":
      return "M";

    case "F":
    case "V":
      return "F";

    case "L":
    case "R":
      return "L";

    case "S":
    case "Z":
    case "C":
    case "X":
      return "S";

    default:
      return "rest";
  }
}
