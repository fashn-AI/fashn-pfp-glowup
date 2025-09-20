"use server"

import { validateTurnstileToken } from "next-turnstile";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";
import Fashn from 'fashn';

const fashnClient = new Fashn({
  apiKey: process.env.FASHN_API_KEY,
});

const ipRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: false,
  prefix: "@fashn-ai/avatar",
});

const dailyRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  analytics: false,
  prefix: "@fashn-ai/avatar",
});

interface TransformImageParams {
  image_url: string
  turnstile_token: string
}

interface TransformImageResult {
  image?: string
  error?: string
}

const MIN_SEED = 0;
const MAX_SEED = 2 ** 32 - 1;

export async function transformImage({ image_url, turnstile_token }: TransformImageParams): Promise<TransformImageResult> {
  try {
    if (!image_url) {
      return { error: "image_url is required" }
    }

    const result = await validateTurnstileToken({
      token: turnstile_token,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
    });
    
    if (!result.success) {
      return { error: "Bot challenge failed." }
    }

    const headersList = headers();
    const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0];

    const identifier = `transform-image:${ip}`;
    const { success } = await ipRatelimit.limit(identifier);

    const dailyIdentifier = `transform-image-daily`;
    const { success: dailySuccess } = await dailyRatelimit.limit(dailyIdentifier);

    if (!dailySuccess) {
      return { error: "Daily rate limit exceeded. Please try again tomorrow." }
    }

    if (!success) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    const response: Fashn.PredictionSubscribeResponse = await fashnClient.predictions.subscribe({
      inputs: {
        face_image: image_url,
        seed: Math.floor(Math.random() * (MAX_SEED - MIN_SEED + 1)) + MIN_SEED,
        aspect_ratio: "2:3",
      },
      model_name: 'face-to-model',
    }).catch(async (err) => {
      throw new Error(err.name)
    });

    return {
      image: response.output?.[0]
    };
  } catch (error: any) {
    console.error("Transform action error:", error)
    return { error: error.name }
  }
}

interface TwitterProfileParams {
  username: string
}

interface TwitterProfileResult {
  profile_image_url?: string
  error?: string
}

export async function getTwitterProfileImage({ username }: TwitterProfileParams): Promise<TwitterProfileResult> {
  try {
    if (!username) {
      return { error: "Username is required" }
    }

    const profileImageUrl = `https://unavatar.io/x/${username}`

    // Verify the image exists by making a HEAD request
    const imageResponse = await fetch(profileImageUrl, { method: "HEAD" })

    if (!imageResponse.ok) {
      return { error: "Profile not found" }
    }

    return { profile_image_url: profileImageUrl }
  } catch (error) {
    console.error("Error fetching profile image:", error)
    return { error: "Failed to fetch profile image" }
  }
}