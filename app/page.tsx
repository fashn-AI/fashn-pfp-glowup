import { ProfileTransformer } from "@/components/profile-transformer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 text-balance">So you want to be a model?</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
           We know it's hard to find body shots of yourself. Transform your X profile picture into a real-life model
          </p>
        </div>
        <ProfileTransformer />
      </div>
    </main>
  )
}
