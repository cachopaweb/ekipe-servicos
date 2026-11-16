import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[6px] border border-ek-control bg-white px-3 py-1.5 text-sm text-ek-text file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ek-faint focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 transition-colors disabled:cursor-not-allowed disabled:bg-ek-raised disabled:text-ek-faint",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
