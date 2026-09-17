import { create } from "zustand";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface ConversationStore {
  state: AvatarState;
  transcript: string;
  response: string;

  setState: (state: AvatarState) => void;

  setTranscript: (transcript: string) => void;

  setResponse: (response: string) => void;

  reset: () => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  state: "idle",
  transcript: "",
  response: "",

  setState: (state) => set({ state }),

  setTranscript: (transcript) => set({ transcript }),

  setResponse: (response) => set({ response }),

  reset: () =>
    set({
      state: "idle",
      transcript: "",
      response: "",
    }),
}));
