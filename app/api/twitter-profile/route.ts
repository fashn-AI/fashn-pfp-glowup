import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }

  try {
    const profileImageUrl = `https://unavatar.io/x/${username}`

    // Verify the image exists by making a HEAD request
    const imageResponse = await fetch(profileImageUrl, { method: "HEAD" })

    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ profile_image_url: profileImageUrl })
  } catch (error) {
    console.error("Error fetching profile image:", error)
    return NextResponse.json({ error: "Failed to fetch profile image" }, { status: 500 })
  }
}
