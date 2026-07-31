"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/cn"

export function AnimatedGrid({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener("resize", resize)

    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      const spacing = 60
      const cols = Math.ceil(canvas.offsetWidth / spacing) + 1
      const rows = Math.ceil(canvas.offsetHeight / spacing) + 1

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing
          const y = j * spacing
          const dist = Math.sqrt(
            Math.pow(x - canvas.offsetWidth / 2, 2) +
            Math.pow(y - canvas.offsetHeight / 2, 2)
          )
          const maxDist = Math.sqrt(
            Math.pow(canvas.offsetWidth / 2, 2) +
            Math.pow(canvas.offsetHeight / 2, 2)
          )
          const opacity = 0.03 + (1 - dist / maxDist) * 0.04

          ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 -z-10 pointer-events-none", className)}
    />
  )
}
