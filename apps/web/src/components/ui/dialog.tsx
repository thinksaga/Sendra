
import * as React from "react"
import { cn } from "../../lib/utils"

// Since we installed logic-less headless UI, we can build a simple Modal using standard HTML dialog or a pure CSS overlay
// For speed and "minimizing dependencies" if I can't rely on installing Radix fully
// But I previously installed `@radix-ui/react-slot`. 
// I will implement a custom Tailwind Modal for simplicity and zero-dep guarantee in this specific interaction, 
// unless I choose to use Radix. Let's stick to a robust custom one to avoid "Cannot find module" if installs fail or are slow.

const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => onOpenChange(false)} />
            <div className="relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg sm:p-8 animate-in fade-in zoom-in-95 duration-200">
                {children}
            </div>
        </div>
    )
}

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("grid gap-4", className)}>{children}</div>
)

const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>
)

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
)

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
