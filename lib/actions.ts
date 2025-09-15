"use server"
import axios from "axios"

interface TransformImageParams {
    image_url: string
}

interface TransformImageResult {
    id?: string
    error?: string
    status?: number
}

const MIN_SEED = 0;
const MAX_SEED = 2 ** 32 - 1;

export async function transformImage({ image_url }: TransformImageParams): Promise<TransformImageResult> {
    try {
        if (!image_url) {
            return { error: "image_url and model_name are required" }
        }

        const response = await axios.post("https://api.fashn.ai/v1/run", {

            model_name: "face-to-model",
            inputs: {
                face_image: image_url,
                seed: Math.floor(Math.random() * (MAX_SEED - MIN_SEED + 1)) + MIN_SEED,
                aspect_ratio: "2:3",
            },
        },
            {
                headers: {
                    Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            },
        )

        const { id } = response.data;

        if (!id) {
            throw new Error('Failed to generate prediction ID');
        }

        return {
            id,
            status: 200
        };
    } catch (error) {
        console.error("Transform action error:", error)
        return { error: "Internal server error" }
    }
}

export const getPredictionStatus = async (id: string) => {

    try {
        const response: any = await axios.get(`https://api.fashn.ai/v1/status/${id}`, {
            headers: {
                Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const prediction = response.data;

        return { prediction };
    } catch (err: any) {
        if (err?.response?.status === 400) {
            return { error: 'Prediction is canceled', status: 400 };
        }

        return { error: 'Something went wrong', status: 500 };
    }
};

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