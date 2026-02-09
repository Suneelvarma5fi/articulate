const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
const GROK_CHAT_URL = "https://api.x.ai/v1/chat/completions";

/**
 * Generate an image using Gemini 2.5 Flash Image.
 * Returns raw image Buffer (PNG) instead of a URL.
 */
export async function generateImage(
  prompt: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  qualityLevel: 1 | 2 | 3
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
    throw new Error(`Gemini image generation failed: ${error}`);
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

export async function scoreImages(
  referenceImageUrl: string,
  generatedImageUrl: string,
  articulationText: string
): Promise<number> {
  const scoringPrompt = `You are a strict image similarity judge for an articulation training app. Users describe a reference image in words, and an AI generates an image from that description. Your job is to score how well the generated image matches the reference — which directly reflects how precise and effective the user's written description was.

SCORING RUBRIC (be harsh — most attempts should score 20-55):

SUBJECT & CONTENT (0-30 points):
- Are the same primary subjects present? (people, animals, objects)
- Are secondary/background elements captured?
- Is the quantity and arrangement of subjects correct?
- Deduct heavily if the main subject is wrong or missing.

COMPOSITION & SPATIAL LAYOUT (0-20 points):
- Is the framing similar? (close-up vs wide, centered vs off-center)
- Are elements positioned in similar regions of the frame?
- Is the perspective/angle comparable?

COLOR & LIGHTING (0-20 points):
- Is the overall color palette similar?
- Is the lighting direction and mood comparable?
- Are specific notable colors present?

STYLE & ATMOSPHERE (0-15 points):
- Does the generated image convey a similar mood/feeling?
- Is the artistic style comparable? (photorealistic, illustrated, etc.)
- Are textures and fine details similar?

SPECIFICITY BONUS (0-15 points):
- Award points ONLY for precise details that match: specific patterns, expressions, text, small objects, exact colors, unique features.
- This rewards users who noticed and described fine details.

STRICT GUIDELINES:
- A score of 70+ means the images are remarkably similar — reserve this for truly excellent descriptions.
- A score of 50-69 means good but with notable differences.
- A score of 30-49 means the general idea was captured but many details are off.
- A score below 30 means significant mismatch.
- Generic descriptions that could apply to many images should NEVER produce scores above 45.
- Be especially strict about subject accuracy — wrong subject = max 25 points.

The user's description was: "${articulationText}"

Evaluate the two images below. The first is the REFERENCE (target). The second is GENERATED from the user's description. Return ONLY a single integer 0-100. Nothing else.`;

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
    throw new Error(`Grok scoring failed: ${error}`);
  }

  const data = await response.json();
  const scoreText = data.choices?.[0]?.message?.content?.trim();
  const score = parseInt(scoreText, 10);

  if (isNaN(score) || score < 0 || score > 100) {
    throw new Error(`Invalid score from Grok: ${scoreText}`);
  }

  return score;
}
