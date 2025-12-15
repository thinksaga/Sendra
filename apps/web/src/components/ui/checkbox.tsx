
import * as React from "react"
import { cn } from "../../lib/utils"

// Custom Checkbox to avoid Radix dependency issues for now, 
// ensuring simple reliable compilation.
// Matches shadcn/ui visual style.

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <input
        type="checkbox"
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
            "accent-gray-900", // Tailwind accent color for native checkbox
            className
        )}
        ref={ref}
        {...props}
    />
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
