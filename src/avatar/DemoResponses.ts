export const responses = {
  hello: "Hello! I am a real-time 3D avatar.",

  capabilities:
    "I can track facial expressions, head movement, and perform text to speech with facial animation.",

  about:
    "I am a browser-based real-time 3D avatar built with React, TypeScript, Three.js, MediaPipe, and facial blendshapes.",

  threejs:
    "I use Three.js and React Three Fiber to render and control the real-time 3D avatar in the browser.",

  mediapipe:
    "I use MediaPipe Face Landmarker to detect facial expressions, facial landmarks, and head pose from the webcam.",

  live: "Live mode uses your webcam and MediaPipe to drive the avatar facial expressions and head movement.",

  demo: "Demo mode uses text or voice input, browser speech synthesis, and viseme animation to make the avatar speak.",

  lipsync:
    "The avatar uses visemes to translate speech into mouth blendshape movements such as jaw opening, smiling, funneling, and puckering.",

  headTracking:
    "Head tracking uses MediaPipe facial transformation data to control the avatar head rotation.",

  fallback:
    "When live head tracking is unavailable, the avatar switches to procedural head motion and continues animating.",

  blinking:
    "The avatar has procedural blinking and gaze behavior so it remains visually active even when the user is not interacting with it.",

  technologies:
    "The main technologies are React, TypeScript, Three.js, React Three Fiber, MediaPipe, browser speech synthesis, and ARKit-style blendshapes.",

  api:
  "The avatar can use an external AI conversation service for dynamic responses, with a local scripted fallback when the AI service is unavailable.",
 
  default: "I am currently running in demonstration mode.",
};

export function getDemoResponse(input: string): string {
  const text = input.toLowerCase().trim();

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return responses.hello;
  }

  if (
    text.includes("what can you do") ||
    text.includes("capabilities") ||
    text.includes("what do you do")
  ) {
    return responses.capabilities;
  }

  if (
    text.includes("who are you") ||
    text.includes("what are you") ||
    text.includes("about yourself")
  ) {
    return responses.about;
  }

  if (
    text.includes("three.js") ||
    text.includes("three js") ||
    text.includes("react three fiber")
  ) {
    return responses.threejs;
  }

  if (text.includes("mediapipe") || text.includes("face tracking")) {
    return responses.mediapipe;
  }

  if (text.includes("live mode") || text.includes("live")) {
    return responses.live;
  }

  if (text.includes("demo mode") || text.includes("demo")) {
    return responses.demo;
  }

  if (
    text.includes("lip sync") ||
    text.includes("lipsync") ||
    text.includes("viseme")
  ) {
    return responses.lipsync;
  }

  if (
    text.includes("head tracking") ||
    text.includes("head movement") ||
    text.includes("head pose")
  ) {
    return responses.headTracking;
  }

  if (
    text.includes("blink") ||
    text.includes("blinking") ||
    text.includes("gaze")
  ) {
    return responses.blinking;
  }

  if (
    text.includes("technology") ||
    text.includes("technologies") ||
    text.includes("tech stack")
  ) {
    return responses.technologies;
  }

  if (
    text.includes("api") ||
    text.includes("llm") ||
    text.includes("ai model") ||
    text.includes("external api")
  ) {
    return responses.api;
  }

  if (
    text.includes("fallback") ||
    text.includes("camera fails") ||
    text.includes("camera failure")
  ) {
    return responses.fallback;
  }

  return responses.default;
}

