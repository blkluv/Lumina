import OpenAI from "openai";
import { ObjectStorageService } from "../objectStorage";

const objectStorageService = new ObjectStorageService();

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

export interface GenerateImageOptions {
  prompt: string;
  size?: ImageSize;
}

export interface GeneratedImage {
  url: string;
}

function getImageSize(aspectRatio?: string): ImageSize {
  switch (aspectRatio) {
    case "16:9":
      return "1536x1024";
    case "9:16":
      return "1024x1536";
    case "1:1":
    default:
      return "1024x1024";
  }
}

export async function generateImage(options: GenerateImageOptions): Promise<GeneratedImage> {
  const { prompt, size = "1024x1024" } = options;
  
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size,
    n: 1,
  });

  if (!response.data || !response.data[0]) {
    throw new Error("No image data returned from OpenAI");
  }

  const base64 = response.data[0].b64_json;
  if (!base64) {
    throw new Error("No base64 image data returned from OpenAI");
  }

  const buffer = Buffer.from(base64, "base64");
  
  const objectPath = await objectStorageService.uploadBufferWithReplitSDK(buffer, "image/png");
  
  return {
    url: objectPath
  };
}

export async function generateImageWithBrandStyle(
  basePrompt: string,
  brandColors?: string[],
  styleKeywords?: string[],
  aspectRatio?: string
): Promise<GeneratedImage> {
  let enhancedPrompt = basePrompt;
  
  if (brandColors && brandColors.length > 0) {
    enhancedPrompt += `. Use color palette: ${brandColors.join(", ")}`;
  }
  
  if (styleKeywords && styleKeywords.length > 0) {
    enhancedPrompt += `. Style: ${styleKeywords.join(", ")}`;
  }

  const size = getImageSize(aspectRatio);
  
  return generateImage({
    prompt: enhancedPrompt,
    size
  });
}
