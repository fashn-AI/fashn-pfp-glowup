import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Fashn status API error:", errorData)
      return NextResponse.json({ error: "Failed to check status" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
