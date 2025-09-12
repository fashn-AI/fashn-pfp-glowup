import { ProfileTransformer } from "@/components/profile-transformer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4 text-balance">AI Profile Magic ✨</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Transform your X profile picture into stunning AI-generated models with just your handle
          </p>
        </div>
        <ProfileTransformer />
      </div>
    </main>
  )
}
