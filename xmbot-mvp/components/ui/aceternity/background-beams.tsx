import { cn } from "@/lib/cn"

/**
 * Two slow, monochrome scanlines sweeping top-to-bottom — a radar/data-feed
 * cue instead of soft colored light beams. Pure CSS, no canvas.
 */
export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none overflow-hidden", className)}>
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent animate-[scan-sweep_8s_linear_infinite]" />
      <div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent animate-[scan-sweep_11s_linear_infinite]"
        style={{ animationDelay: "3s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#030712_85%)]" />
    </div>
  )
}
