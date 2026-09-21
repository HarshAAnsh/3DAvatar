import type { FacialAnimationEngine } from "./FacialAnimationEngine";
import {
  EMOTION_PRESETS,
  type EmotionTarget,
  type EmotionType,
} from "./EmotionPresets";

export class EmotionEngine {
  private engine: FacialAnimationEngine;

  private currentValues: EmotionTarget = {};
  private targetValues: EmotionTarget = {};

  private currentEmotion: EmotionType = "neutral";

  private smoothing = 8;

  constructor(engine: FacialAnimationEngine) {
    this.engine = engine;

    this.setEmotion("neutral");

    console.log("[EmotionEngine] Initialized");
  }

  getEmotion(): EmotionType {
    return this.currentEmotion;
  }

  setEmotion(emotion: EmotionType) {
    if (emotion === this.currentEmotion) {
      return;
    }

    this.currentEmotion = emotion;

    this.targetValues = {
      ...EMOTION_PRESETS[emotion],
    };

    console.log("[EmotionEngine] Emotion:", emotion);
  }

  update(delta: number) {
    const alpha = 1 - Math.exp(-this.smoothing * delta);

    const names = new Set([
      ...Object.keys(this.currentValues),
      ...Object.keys(this.targetValues),
    ]);

    for (const name of names) {
      const current = this.currentValues[name] ?? 0;

      const target = this.targetValues[name] ?? 0;

      const next = current + (target - current) * alpha;

      this.currentValues[name] = next;

      /*
       * Emotion uses the procedural channel.
       *
       * TTS still owns the mouth during speech,
       * while emotion controls brows/cheeks/eyes.
       */
      this.engine.setARKitBlendshape(name, next, "procedural");
    }
  }

  reset() {
    this.setEmotion("neutral");
  }
}

/*
 * Lightweight local response classifier.
 *
 * This intentionally does not call another API.
 */
export function inferEmotionFromText(text: string): EmotionType {
  const value = text.toLowerCase().replace(/[^\w\s']/g, " ");

  if (
    /amazing|incredible|awesome|wow|fantastic|brilliant|excited|can't wait/.test(
      value,
    )
  ) {
    return "excited";
  }

  if (
    /great|excellent|glad|happy|congratulations|success|wonderful|love/.test(
      value,
    )
  ) {
    return "happy";
  }

  if (/i'm sorry|im sorry|my apologies|apologize|my mistake/.test(value)) {
    return "apologetic";
  }

  if (/sad|hurt|disappointed|unfortunately|lost|failed|failure/.test(value)) {
    return "sad";
  }

  if (
    /error|issue|problem|warning|careful|risk|danger|concern|failed/.test(value)
  ) {
    return "concerned";
  }

  if (/why|how|what|tell me|explain|curious|wonder/.test(value)) {
    return "curious";
  }

  if (/let me think|consider|thinking|hmm/.test(value)) {
    return "thinking";
  }

  return "neutral";
}
