export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  console.log(
  "[Gemini] API key available:",
  Boolean(process.env.GEMINI_API_KEY)
);

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured",
    });
  }

  try {
    const {
      message,
      history = [],
    } = req.body || {};

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .filter(
            (item) =>
              item &&
              (item.role === "user" ||
                item.role === "assistant") &&
              typeof item.text === "string"
          )
      : [];

    const contents = [
      ...recentHistory.map((item) => ({
        role:
          item.role === "assistant"
            ? "model"
            : "user",
        parts: [
          {
            text: item.text.slice(0, 2000),
          },
        ],
      })),

      {
        role: "user",
        parts: [
          {
            text: message.trim().slice(0, 2000),
          },
        ],
      },
    ];

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text:
                  "You are a friendly real-time 3D avatar assistant. " +
                  "Keep responses concise because they will be spoken aloud. " +
                  "Usually respond in 1 to 3 sentences. " +
                  "Do not use markdown, bullet points, emojis, or unnecessary formatting.",
              },
            ],
          },

          contents,

          generationConfig: {
            maxOutputTokens: 180,
          },
        }),
      }
    );

    const data =
      await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error(
        "[Gemini] API error:",
        data
      );

      return res
        .status(geminiResponse.status)
        .json({
          error:
            data?.error?.message ||
            "Gemini request failed",
        });
    }

    const text =
      data?.candidates?.[0]
        ?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!text) {
      return res.status(502).json({
        error:
          "Gemini returned an empty response",
      });
    }

    return res.status(200).json({
      text,
    });
  } catch (error) {
    console.error(
      "[Gemini] Server error:",
      error
    );

    return res.status(500).json({
      error: "AI service unavailable",
    });
  }
}