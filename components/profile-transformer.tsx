"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Loader2, Sparkles, Download, AlertCircle, Copy, User, IdCard } from "lucide-react"
import { transformImage, getTwitterProfileImage } from "@/lib/actions"
import { Turnstile } from "next-turnstile"
import toast, { Toaster } from 'react-hot-toast';
import * as htmlToImage from 'html-to-image';

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
  const [downloadType, setDownloadType] = useState<"card" | "avatar">("card");
  const [copyType, setCopyType] = useState<"card" | "avatar">("card");
  const [transformingMessage, setTransformingMessage] = useState("Starting AI transformation...");

  const inputHandleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (turnstileStatus === "success") {
      handleTransform();
    }
  }, [turnstileStatus]);

  useEffect(() => {
    if (state.status === "transforming") {
      setTransformingMessage("Starting AI transformation...");
      const timer = setTimeout(() => {
        setTransformingMessage("Creating your AI model... This may take a few moments");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.status]);

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

    window.turnstile.execute('#turnstile-widget', {
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

  const downloadAvatar = async () => {
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
        toast.success("Image downloaded!", { id: toastId })
      } catch (error) {
        toast.error("Download failed. Could not download image", { id: toastId })
      }
    }
  }

  const copyAvatar = async () => {
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
        toast.success("Image copied!", { id: toastId })
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

  const copyCard = async () => {
    const node = document.getElementById('social-media-card');
    if (node) {
      let toastId = toast.loading("Copying card to clipboard...")
      try {
        const dataUrl = await htmlToImage.toPng(node);
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        toast.success("Card copied!", { id: toastId });
      } catch (error) {
        toast.error("Copy failed. Could not copy card to clipboard", { id: toastId });
      }
    }
  }

  const downloadCard = async () => {
    const node = document.getElementById('social-media-card');
    if (node) {
      htmlToImage
        .toPng(node)
        .then((dataUrl) => {
          const img = new Image();
          img.src = dataUrl;
          const link = document.createElement("a")
          link.href = dataUrl
          link.download = `${handle}-ai-model.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
    }
  }

  const isLoading = ["fetching-profile", "transforming"].includes(state.status) || turnstileVerificationInProgress;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="handle" className="text-sm font-medium text-card-foreground">
              X Handle
            </label>
            <div className="flex gap-2 relative">
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

              <div className="absolute top-full left-0 mt-2 z-50">
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
                  onVerify={async (token) => {
                    setTurnstileToken(token);
                    setTurnstileStatus("success");
                    setError(null);
                    setTimeout(() => {
                      setTurnstileVerificationInProgress(false);
                      window.turnstile.reset('#turnstile-widget');
                    }, 500);
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-red-500 text-sm"
                aria-live="polite"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
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
              {state.profileImage && (
                <img
                  src={state.profileImage}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-2 animate-spin  shadow-sm"
                  style={{ animationDuration: '1s' }}
                />
              )}
              {transformingMessage}
            </div>
          )}

          {state.error && (
            <div className="text-center text-destructive bg-destructive/10 p-3 rounded-lg">{state.error}</div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {(state.transformedImage) && (
        <Card className="bg-white overflow-hidden border border-primary/10 shadow-xs">
          <CardContent>
            <div id='social-media-card' className="bg-white p-2 flex flex-row items-center justify-center gap-2">
              {/* Original Profile */}
              {state.profileImage && (
                <div className="flex flex-col items-center justify-center h-full relative">
                  <img
                    src={state.profileImage || "/placeholder.svg"}
                    alt="Original profile"
                    className="w-32 h-32 rounded-xl border border-primary/15 shadow-sm object-cover"
                  />
                  {state.transformedImage && (
                    <div className="absolute z-10 -top-[45%] -right-[15%] flex flex-col items-center justify-start">
                      <div className="relative">
                        <p className="absolute -rotate-12 text-sm text-gray-600 font-kalam whitespace-nowrap">Hey that's me!</p>
                        <img
                          src="/arrow.svg"
                          alt="Transform arrow"
                          className="size-20 opacity-80"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Model */}
              {state.transformedImage && (
                <div className="flex flex-col items-center">
                  <div className="w-auto h-[28rem] rounded-lg overflow-hidden shadow-xs" style={{ aspectRatio: '2/3' }}>
                    <img
                      src={state.transformedImage || "/placeholder.svg"}
                      alt="AI transformed"
                      className="w-full h-full object-cover rounded-lg border border-primary/10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {state.transformedImage && (
              <div className="flex flex-row gap-3 mt-6 justify-end items-center">
                <div className="flex bg-transparent">
                  <Button
                    onClick={() => copyType === "card" ? copyCard() : copyAvatar()}
                    variant="outline"
                    size="sm"
                    className="rounded-l-lg rounded-r-none border-r-0 text-xs px-3"
                  >
                    <Copy className="size-3 mr-1" />
                    Copy {copyType}
                  </Button>

                  <Select onValueChange={(value: "card" | "avatar") => setCopyType(value)}>
                    <SelectTrigger size="sm" className="rounded-r-lg rounded-l-none border border-border bg-background border-l-0 text-xs px-2 focus:ring-0 shadow-xs hover:bg-accent hover:text-white [&_svg]:hover:text-white"></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <IdCard className="size-3 hover:text-white" />
                          Card Image
                        </div>
                      </SelectItem>
                      <SelectItem value="avatar">
                        <div className="flex items-center gap-2">
                          <User className="size-3 hover:text-white" />
                          Avatar
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex bg-transparent">
                  <Button
                    onClick={() => downloadType === "card" ? downloadCard() : downloadAvatar()}
                    variant="outline"
                    size="sm"
                    className="rounded-l-lg rounded-r-none border-r-0 text-xs px-3"
                  >
                    <Download className="size-3 mr-1" />
                    Download {downloadType}
                  </Button>

                  <Select onValueChange={(value: "card" | "avatar") => setDownloadType(value)}>
                    <SelectTrigger size="sm" className="rounded-r-lg rounded-l-none border border-border bg-background border-l-0 text-xs px-2 focus:ring-0 shadow-xs hover:bg-accent hover:text-white [&_svg]:hover:text-white"></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <IdCard className="size-3 hover:text-white" />
                          Card Image
                        </div>
                      </SelectItem>
                      <SelectItem value="avatar">
                        <div className="flex items-center gap-2">
                          <User className="size-3 hover:text-white" />
                          Avatar
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
