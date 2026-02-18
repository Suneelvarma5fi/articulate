const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
const GROK_CHAT_URL = "https://api.x.ai/v1/chat/completions";

/**
 * Generate an image using Gemini 2.5 Flash Image.
 * Returns raw image Buffer (PNG) instead of a URL.
 */
export async function generateImage(
  prompt: string,
): Promise<Buffer> {
  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error("Image generation failed");
  }

  const data = await response.json();

  // Find the image part in the response
  const parts = data.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find(
    (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in Gemini response");
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}

import { ScoreBreakdown } from "@/types/database";

export interface ScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
}

export async function scoreImages(
  referenceImageUrl: string,
  generatedImageUrl: string,
  articulationText: string,
): Promise<ScoreResult> {
  const scoringPrompt = `You are a STRICT image similarity judge. You will see:
1. REFERENCE image (the target the user was trying to reproduce)
2. GENERATED image (created from the user's text description below)

USER'S ARTICULATION: "${articulationText}"

Your job: score how well the GENERATED image reproduces the REFERENCE image.

━━━ HARD CAPS (apply BEFORE rubric — these override everything) ━━━
- Wrong primary subject (e.g., cat instead of dog, car instead of boat) → MAX 20 total
- Completely wrong scene type (indoor vs outdoor, day vs night) → MAX 30 total
- Main subject entirely missing → MAX 10 total
- Opposite color scheme (dark scene vs bright scene) → MAX 35 total

━━━ RUBRIC ━━━

SUBJECT ACCURACY (0-35 points):
  35 = Exact same subject, correct count, correct species/type/variant
  25 = Right general category but wrong specifics (golden retriever vs poodle)
  15 = Vaguely related subject (both animals, but different species)
   5 = Unrelated subject

COMPOSITION & LAYOUT (0-25 points):
  25 = Same framing, angle, and position of elements in frame
  15 = Similar framing but elements repositioned or cropped differently
   8 = Completely different framing and perspective

COLOR & LIGHTING (0-20 points):
  20 = Matching color palette and light direction/mood
  12 = Similar overall mood but noticeably different palette
   5 = Clashing colors or opposite lighting

DETAIL FIDELITY (0-20 points):
  20 = Fine details match (textures, patterns, text, expressions, small objects)
  10 = Broad strokes match but details diverge
   3 = No meaningful detail overlap

━━━ SCORE DISTRIBUTION (calibrate to these anchors) ━━━
90-100: Near-identical. Would fool a casual observer. EXTREMELY rare.
70-89:  Same scene, same subject, only minor differences in detail/angle.
50-69:  Right general idea with noticeable differences in composition or details.
30-49:  Loosely related — some elements match but major things are wrong.
10-29:  Mostly different images, maybe one shared element.
 0-9:   Completely unrelated images.

IMPORTANT: Most image pairs should score between 25-55. Scores above 75 are exceptional and rare. Do NOT be generous.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"total":72,"subject":28,"composition":18,"color":14,"detail":12}

Where:
- total = subject + composition + color + detail (0-100)
- subject = Subject Accuracy score (0-35)
- composition = Composition & Layout score (0-25)
- color = Color & Lighting score (0-20)
- detail = Detail Fidelity score (0-20)`;

  const response = await fetch(GROK_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-2-vision-1212",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: scoringPrompt,
            },
            {
              type: "image_url",
              image_url: { url: referenceImageUrl },
            },
            {
              type: "image_url",
              image_url: { url: generatedImageUrl },
            },
          ],
        },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Grok API error:", error);
    throw new Error("Image scoring failed");
  }

  const data = await response.json();
  const scoreText = data.choices?.[0]?.message?.content?.trim();

  // Try to parse JSON response
  try {
    const parsed = JSON.parse(scoreText);
    const total = Number(parsed.total);
    const subject = Number(parsed.subject);
    const composition = Number(parsed.composition);
    const color = Number(parsed.color);
    const detail = Number(parsed.detail);

    if (isNaN(total) || total < 0 || total > 100) {
      throw new Error("Invalid total score");
    }

    return {
      total: Math.min(100, Math.max(0, total)),
      breakdown: {
        subject: Math.min(35, Math.max(0, subject)),
        composition: Math.min(25, Math.max(0, composition)),
        color: Math.min(20, Math.max(0, color)),
        detail: Math.min(20, Math.max(0, detail)),
      },
    };
  } catch {
    // Fallback: try parsing as a plain integer (backward compat)
    const score = parseInt(scoreText, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      console.error("Invalid score from Grok:", scoreText);
      throw new Error("Image scoring returned an invalid result");
    }

    // Approximate breakdown from total
    return {
      total: score,
      breakdown: {
        subject: Math.round(score * 0.35),
        composition: Math.round(score * 0.25),
        color: Math.round(score * 0.20),
        detail: Math.round(score * 0.20),
      },
    };
  }
}
