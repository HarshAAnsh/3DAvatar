export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface AIResponse {
  text?: string;
  error?: string;
}

export async function getAIResponse(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message,
      history,
    }),
  });

  const data =
    (await response.json()) as AIResponse;

  if (!response.ok) {
    throw new Error(
      data.error || "AI request failed"
    );
  }

  if (!data.text) {
    throw new Error(
      "AI returned an empty response"
    );
  }

  return data.text;
}