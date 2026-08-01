"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export function CursorGlow() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsMoving(true)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setIsMoving(false)
      }, 1000)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-5 overflow-hidden"
    >
      {/* Primary glow circle */}
      <motion.div
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          opacity: isMoving ? 0.6 : 0,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 400,
          mass: 0.5,
        }}
        className="absolute w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500/30 via-emerald-400/20 to-transparent blur-[80px] will-change-transform"
      />

      {/* Secondary glow circle - delayed follow */}
      <motion.div
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          opacity: isMoving ? 0.3 : 0,
        }}
        transition={{
          type: "spring",
          damping: 50,
          stiffness: 300,
          mass: 1,
        }}
        className="absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/20 via-transparent to-transparent blur-[100px] will-change-transform"
      />

      {/* Tertiary accent glow */}
      <motion.div
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          opacity: isMoving ? 0.2 : 0,
        }}
        transition={{
          type: "spring",
          damping: 70,
          stiffness: 200,
          mass: 1.5,
        }}
        className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent blur-[120px] will-change-transform"
      />

      {/* Static radial background that complements cursor glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030712_70%)]" />
    </div>
  )
}
