"use client"

import * as React from "react"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ value = 0, className, ...props }, ref) => (
  <div
    ref={ref}
    className="relative h-2 w-full overflow-hidden rounded-full bg-gray-900/20"
    {...props}
  >
    <div
      className="h-full flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200 ease-in-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
))

Progress.displayName = "Progress"

export { Progress }
