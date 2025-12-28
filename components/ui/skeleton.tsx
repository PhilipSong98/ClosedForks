import { cn } from "@/lib/utils"

/**
 * Skeleton loading component with shimmer animation.
 * Respects prefers-reduced-motion for accessibility.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        "animate-shimmer bg-gradient-to-r from-muted via-muted/60 to-muted",
        "bg-[length:200%_100%]",
        "motion-reduce:animate-pulse motion-reduce:bg-none",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }