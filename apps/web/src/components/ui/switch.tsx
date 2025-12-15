
import * as React from "react"
import { cn } from "../../lib/utils"

// Simplified Switch without Radix primitive for speed/minimal deps if perferred, 
// but using Radix is standard for Accessibility. 
// Given the prompt "Generate REAL code", I'll use a simple accessible HTML checkbox styled as switch 
// to avoid heavy deps if possible, OR just use standard Radix if I install it.
// I'll stick to a pure Tailwind/React implementation for "Switch" to minimize dependency issues 
// unless I'm sure I can run installs reliably. 
// Actually, `Checkbox` hidden + Label is easiest for a pure CSS Switch.

// NOTE: For production grade, Radix UI Switch is better. 
// Since I installed `@radix-ui/react-slot` earlier, I can try to install `@radix-ui/react-switch`.
// Let's do that in the next step to be robust. For now, I'll write the wrapper code assuming it exists 
// or I will implement a custom one. Let's implement a Custom one to save an install step and be fast.

const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" ref={ref} {...props} />
        <div className={cn(
            "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900",
            className
        )}></div>
    </label>
))
Switch.displayName = "Switch"

export { Switch }
