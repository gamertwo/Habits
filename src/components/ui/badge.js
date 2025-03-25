import * as React from "react"
import { cva } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white",
        outline: "text-foreground border-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={badgeVariants({ variant, className })} {...props} />
))
Badge.displayName = "Badge"

export { Badge, badgeVariants }
