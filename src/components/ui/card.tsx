import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "accent"
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/50 shadow-sm overflow-hidden",
        {
          "bg-bg-card": variant === "default",
          "bg-bg-card/60 backdrop-blur-xl": variant === "glass",
          "bg-gradient-to-br from-accent-500/20 to-accent-600/5 border-accent-500/20": variant === "accent",
        },
        className
      )}
      {...props}
    />
  )
}
