"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles, Download, Share2, AlertCircle, Copy } from "lucide-react"
import { transformImage, getTwitterProfileImage } from "@/lib/actions"
import { Turnstile } from "next-turnstile"
import toast, { Toaster } from 'react-hot-toast';

interface TransformationState {
  status: "idle" | "fetching-profile" | "transforming" | "complete" | "error"
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

  const inputHandleRef = useRef<HTMLInputElement>(null);
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
        throw new Error(result.error);
      }

      return result.image
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : "Something went wrong")
    }
  }

  const initiateTransform = () => {
    setState({ status: "idle" })

    executeTurnstile();
  }

  const handleTransform = async () => {
    if (!handle.trim()) {
      toast.error("Please enter a X/Twitter handle")
      return
    }

    try {
      // Step 1: Fetch profile picture
      setState({ status: "fetching-profile" })
      const profileImage = await fetchProfilePicture(handle)
      setState((prev) => ({ ...prev, profileImage }))

      // Step 2: Start transformation
      setState((prev) => ({ ...prev, status: "transforming" }))
      const transformedImage = await startTransformation(profileImage)

      // Step 3: Complete
      setState((prev) => ({
        ...prev,
        status: "complete",
        transformedImage,
      }))

      toast.success("Transformation complete! ✨")
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Something went wrong",
      })

      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setTurnstileStatus("required");
    }
  }

  const downloadImage = async () => {
    if (state.transformedImage) {
      let toastId = toast.loading("Downloading image...")
      try {
        const response = await fetch(state.transformedImage)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const link = document.createElement("a")
        link.href = url
        link.download = `${handle}-ai-model.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up the object URL
        window.URL.revokeObjectURL(url)
        toast.success("Image downloaded! Image downloaded to your downloads folder", { id: toastId })
      } catch (error) {
        toast.error("Download failed. Could not download image", { id: toastId })
      }
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
        toast.success("Link copied! Image URL copied to clipboard")
      }
    }
  }

  const copyImage = async () => {
    if (state.transformedImage) {
      let toastId = toast.loading("Copying image to clipboard...")
      try {
        const response = await fetch(state.transformedImage)
        const blob = await response.blob()
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        toast.success("Image copied! Image copied to clipboard", { id: toastId })
      } catch (error) {
        toast.error("Copy failed. Could not copy image to clipboard", { id: toastId })
      }
    }
  }

  const reset = () => {
    inputHandleRef.current?.focus();
    setState({ status: "idle" })
    setHandle("")
  }

  const isLoading = ["fetching-profile", "transforming"].includes(state.status) || turnstileVerificationInProgress;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Input Section */}
      <Card className="border border-primary/20 shadow-xs relative">
        <CardContent className="p-">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="handle" className="text-sm font-medium text-card-foreground">
                X Handle
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    ref={inputHandleRef}
                    id="handle"
                    placeholder="username"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="pl-8 bg-input border-border"
                    disabled={isLoading}
                    autoFocus={true}
                    onKeyDown={(e) => e.key === "Enter" && initiateTransform()}
                  />
                </div>
                <Button
                  onClick={initiateTransform}
                  disabled={isLoading || !handle.trim()}
                  className="w-28 bg-primary hover:bg-primary/90 text-sm text-primary-foreground px-6"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="size-3" />
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
        <div className="absolute bottom-0 right-0">
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
              setTimeout(() => {
                window.turnstile.reset(turnstileRef.current);
              }, 1500);
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
        </div>
      </Card>

      {/* Results Section */}
      {(state.profileImage || state.transformedImage) && (
        <Card className="overflow-hidden border border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {/* Original Profile */}
              {state.profileImage && (
                <div className="flex flex-col items-center justify-center h-full relative">
                  <img
                    src={state.profileImage || "/placeholder.svg"}
                    alt="Original profile"
                    className="w-32 h-32 rounded-lg object-cover shadow-lg"
                  />
                  {state.transformedImage && (
                    <div className="hidden absolute -top-[55%] -right-[15%] md:flex flex-col items-center justify-start">
                      <div className="relative">
                        <p className="absolute -top-[15px] lg:top-[7px] -rotate-12 text-xs text-gray-600 font-kalam">Hey that's me!</p>
                        <img
                          src="/arrow.svg"
                          alt="Transform arrow"
                          className="w-16 h-16 lg:w-20 lg:h-20 opacity-80"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {state.transformedImage && (
                <div className="md:hidden flex flex-col items-center justify-start">
                  <div className="relative flex items-center">
                    <p className="absolute -left-[80px] text-sm text-gray-600 font-kalam">Hey that's me!</p>
                    <img
                      src="/arrow.svg"
                      alt="Transform arrow"
                      className="size-12 rotate-90"
                    />
                  </div>
                </div>
              )}

              {/* AI Model */}
              {state.transformedImage && (
                <div className="flex flex-col items-center">
                  <div className="w-40 h-56 rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '2/3' }}>
                    <img
                      src={state.transformedImage || "/placeholder.svg"}
                      alt="AI transformed"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {state.transformedImage && (
              <div className="flex gap-2 mt-6 justify-center">
                <Button
                  onClick={downloadImage}
                  className="bg-secondary text-xs"
                >
                  <Download className="size-3" />
                  Download
                </Button>
                <Button onClick={copyImage} variant="outline" className="bg-transparent text-xs">
                  <Copy className="size-3" />
                  Copy
                </Button>
                <Button onClick={shareImage} variant="outline" className="bg-transparent text-xs">
                  <Share2 className="size-3" />
                  Share
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset Button */}
      {state.status === "complete" && (
        <div className="text-center">
          <Button onClick={reset} variant="outline" className="px-8 bg-transparent">
            Transform Another Profile
          </Button>
        </div>
      )}

      <Toaster />
    </div>
  )
}
