"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2, Sparkles, Download, Share2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getPredictionStatus, transformImage, getTwitterProfileImage } from "@/lib/actions"
import { Turnstile } from "next-turnstile"

interface TransformationState {
  status: "idle" | "fetching-profile" | "transforming" | "polling" | "complete" | "error"
  profileImage?: string
  transformedImage?: string
  error?: string
}

export function ProfileTransformer() {
  const [handle, setHandle] = useState("")
  const [state, setState] = useState<TransformationState>({ status: "idle" })
  const [turnstileVerificationInProgress, setTurnstileVerificationInProgress] = useState(false);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast()

  const turnstileRef = useRef<any>(null);

  useEffect(() => {
    if (turnstileStatus === "success") {
      handleTransform();
    }
  }, [turnstileStatus]);

  const fetchProfilePicture = async (username: string) => {
    // Remove @ if present
    const cleanUsername = username.replace("@", "")

    try {
      const result = await getTwitterProfileImage({ username: cleanUsername })

      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.profile_image_url) {
        throw new Error("No profile image found")
      }

      return result.profile_image_url
    } catch (error) {
      throw new Error("Could not fetch profile picture. Please check the username.")
    }
  }

  const executeTurnstile = () => {
    setTurnstileVerificationInProgress(true);
    
    window.turnstile.execute(turnstileRef.current, {
      retry: "auto",
      refreshExpired: "auto",
      sandbox: false,
    })
  }

  const startTransformation = async (imageUrl: string) => {
    try {
      const result = await transformImage({
        image_url: imageUrl,
        turnstile_token: turnstileToken || "",
      })

      if (result.error) {
        throw new Error("Failed to start transformation");
      }

      if (!result.id) {
        throw new Error("No transformation ID returned")
      }

      return result.id
    } catch (error: any) {
      throw new Error("Failed to start transformation")
    }
  }

  const pollTransformation = async (id: string): Promise<string> => {
    const maxAttempts = 30
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await getPredictionStatus(id)
        if (response?.error) throw new Error("Polling failed")



        if (response.prediction.status === "completed" && response.prediction.output?.[0]) {
          return response.prediction.output[0]
        }

        if (response.prediction.status === "failed") {
          throw new Error("Transformation failed")
        }

        // Wait 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000))
        attempts++
      } catch (error) {
        attempts++
        if (attempts >= maxAttempts) throw error
      }
    }

    throw new Error("Transformation timed out")
  }

  const initiateTransform = () => {
    executeTurnstile();
  }

  const handleTransform = async () => {
    if (!handle.trim()) {
      toast({
        title: "Please enter a handle",
        description: "Enter an X username to get started",
        variant: "destructive",
      })
      return
    }

    try {
      // Step 1: Fetch profile picture
      setState({ status: "fetching-profile" })
      const profileImage = await fetchProfilePicture(handle)
      setState((prev) => ({ ...prev, profileImage }))

      // Step 2: Start transformation
      setState((prev) => ({ ...prev, status: "transforming" }))
      const transformationId = await startTransformation(profileImage)

      // Step 3: Poll for results
      setState((prev) => ({ ...prev, status: "polling" }))
      const transformedImage = await pollTransformation(transformationId)

      // Step 4: Complete
      setState((prev) => ({
        ...prev,
        status: "complete",
        transformedImage,
      }))

      toast({
        title: "Transformation complete! ✨",
        description: "Your AI model is ready to download",
      })
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Something went wrong",
      })

      toast({
        title: "Transformation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const downloadImage = () => {
    if (state.transformedImage) {
      const link = document.createElement("a")
      link.href = state.transformedImage
      link.download = `${handle}-ai-model.jpg`
      link.click()
    }
  }

  const shareImage = async () => {
    if (state.transformedImage && navigator.share) {
      try {
        await navigator.share({
          title: "My AI Profile Transformation",
          text: "Check out my AI-generated model!",
          url: state.transformedImage,
        })
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(state.transformedImage)
        toast({
          title: "Link copied!",
          description: "Image URL copied to clipboard",
        })
      }
    }
  }

  const reset = () => {
    setState({ status: "idle" })
    setHandle("")
  }

  const isLoading = ["fetching-profile", "transforming", "polling"].includes(state.status) || turnstileVerificationInProgress;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Input Section */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="handle" className="text-sm font-medium text-card-foreground">
                X Handle
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="handle"
                    placeholder="username"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="pl-8 bg-input border-border"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === "Enter" && initiateTransform()}
                  />
                </div>
                <Button
                  onClick={initiateTransform}
                  disabled={isLoading || !handle.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Transform
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Status Messages */}
            {state.status === "fetching-profile" && (
              <div className="text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Fetching your profile picture...
              </div>
            )}

            {state.status === "transforming" && (
              <div className="text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Starting AI transformation...
              </div>
            )}

            {state.status === "polling" && (
              <div className="text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Creating your AI model... This may take a minute ✨
              </div>
            )}

            {turnstileVerificationInProgress && (
              <div className="text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Performing security checks...
              </div>
            )}

            {state.error && (
              <div className="text-center text-destructive bg-destructive/10 p-3 rounded-lg">{state.error}</div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            retry="auto"
            refreshExpired="auto"
            execution="execute"
            appearance="execute"
            theme="auto"
            sandbox={false}
            onError={() => {
              setTurnstileStatus("error");
              setError("Security check failed. Please try again.");
              setTurnstileVerificationInProgress(false);
            }}
            onExpire={() => {
              setTurnstileStatus("expired");
              setError("Security check expired. Please verify again.");
              setTurnstileVerificationInProgress(false);
            }}
            onLoad={() => {
              setTurnstileStatus("required");
              setError(null);
            }}
            onVerify={async(token) => {
              setTurnstileToken(token);
              setTurnstileStatus("success");
              setError(null);
              setTurnstileVerificationInProgress(false);
            }}
          />
          {error && (
            <div
              className="flex items-center gap-2 text-red-500 text-sm mb-2"
              aria-live="polite"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Results Section */}
      {(state.profileImage || state.transformedImage) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original Profile */}
          {state.profileImage && (
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-semibold text-card-foreground mb-3 text-center">Original Profile</h3>
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={state.profileImage || "/placeholder.svg"}
                    alt="Original profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transformed Result */}
          {state.transformedImage && (
            <Card className="overflow-hidden border-2 border-accent/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-card-foreground mb-3 text-center">AI Model ✨</h3>
                <div className="relative rounded-lg overflow-hidden bg-muted mb-4" style={{ aspectRatio: '2/3' }}>
                  <img
                    src={state.transformedImage || "/placeholder.svg"}
                    alt="AI transformed"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={downloadImage}
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={shareImage} variant="outline" className="flex-1 bg-transparent">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Reset Button */}
      {state.status === "complete" && (
        <div className="text-center">
          <Button onClick={reset} variant="outline" className="px-8 bg-transparent">
            Transform Another Profile
          </Button>
        </div>
      )}
    </div>
  )
}
