export type BlendshapeValues = Record<string, number>

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'

export type AvatarEmotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'surprised'
  | 'thinking'