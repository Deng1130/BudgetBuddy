import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
        {
          // Variants
          "bg-accent-500 text-white hover:bg-accent-600 shadow-md shadow-accent-500/20": variant === "primary",
          "border-2 border-accent-500 text-accent-500 hover:bg-accent-500/10": variant === "secondary",
          "text-text-secondary hover:text-text-primary hover:bg-bg-secondary": variant === "ghost",
          "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20": variant === "danger",
          
          // Sizes
          "h-9 px-4 text-xs": size === "sm",
          "h-11 px-6 text-sm": size === "md",
          "h-14 px-8 text-base rounded-2xl": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
}
