"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/cn"

export function BackgroundBeams({ className }: { className?: string }) {
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

    const beams = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * canvas.offsetWidth,
      angle: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.3,
      width: 1 + Math.random() * 2,
      opacity: 0.03 + Math.random() * 0.05,
      hue: Math.random() > 0.5 ? 46 : 160,
    }))

    const animate = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      beams.forEach((beam) => {
        beam.angle += beam.speed * 0.01
        const len = canvas.offsetHeight * 1.5

        ctx.beginPath()
        const startX = beam.x + Math.sin(beam.angle + time) * 100
        const startY = -50
        const endX = startX + Math.sin(beam.angle) * len * 0.3
        const endY = canvas.offsetHeight + 50

        const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
        gradient.addColorStop(0, `hsla(${beam.hue}, 80%, 50%, 0)`)
        gradient.addColorStop(0.3, `hsla(${beam.hue}, 80%, 50%, ${beam.opacity})`)
        gradient.addColorStop(0.7, `hsla(${beam.hue}, 80%, 50%, ${beam.opacity})`)
        gradient.addColorStop(1, `hsla(${beam.hue}, 80%, 50%, 0)`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = beam.width
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      })

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
      className={cn(
        "absolute inset-0 pointer-events-none",
        "[mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]",
        className
      )}
    />
  )
}
