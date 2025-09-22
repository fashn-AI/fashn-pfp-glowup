"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    skeletonClassName?: string
}

export function ImageWithSkeleton({
    className,
    skeletonClassName,
    onLoad,
    ...props
}: ImageWithSkeletonProps) {
    const [isLoading, setIsLoading] = useState(true)

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setIsLoading(false)
        onLoad?.(e)
    }

    return (
        <div className={cn("relative", className)}>
            {isLoading && (
                <Skeleton className={cn("absolute inset-0", skeletonClassName)} />
            )}
            <img
                className={cn(
                    "transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                onLoad={handleLoad}
                {...props}
            />
        </div>
    )
}