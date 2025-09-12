import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { image_url, model_name } = await request.json()

    if (!image_url || !model_name) {
      return NextResponse.json({ error: "image_url and model_name are required" }, { status: 400 })
    }

    const response = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
      },
      body: JSON.stringify({
        model_name,
        input: {
          image_url,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Fashn API error:", errorData)
      return NextResponse.json({ error: "Failed to start transformation" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Transform API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
