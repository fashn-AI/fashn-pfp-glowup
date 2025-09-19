import { ProfileTransformer } from "@/components/profile-transformer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-4">
          <h1 className="text-xl md:text-3xl font-bold text-primary mb-2 text-balance">So you want to be a model?</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Enter your X handle to create your AI avatar!
          </p>
        </div>
        <ProfileTransformer />
      </div>
    </main>
  )
}
