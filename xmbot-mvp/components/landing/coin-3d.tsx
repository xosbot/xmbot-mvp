"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { ContactShadows } from "@react-three/drei"

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      setReduced(media.matches)
      const handleChange = (e: MediaQueryListEvent) => setReduced(e.matches)
      media.addEventListener("change", handleChange)
      return () => media.removeEventListener("change", handleChange)
    }
  }, [])
  return reduced
}

interface SignalData {
  symbol: string
  action: "BUY" | "SELL"
  entry: string
  sl: string
  tp: string
  confidence: number
  reason: string
  timestamp: string
}

export function SignalCoin({ 
  signal,
  onApprove,
  onReject
}: {
  signal: SignalData
  onApprove?: () => void
  onReject?: () => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()
  
  useFrame((state, delta) => {
    if (ref.current && !reduced) {
      ref.current.rotation.y += delta * 0.5
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      
      const scale = 1 + (hovered ? 0.08 : 0) as number
      ref.current.scale.setScalar(scale)
    }
  })

  const buyColor = new THREE.Color("#34D399")
  const sellColor = new THREE.Color("#EF4444")
  const coinColor = signal.action === "BUY" ? buyColor : sellColor
  
  const glowColor = hovered 
    ? coinColor.clone().offsetHSL(0, 0.3, 0.3)
    : coinColor.clone().offsetHSL(0, 0, 0)

  return (
    <mesh ref={ref} castShadow receiveShadow
      onPointerOver={(e) => { e.stopPropagation(); !reduced && setHovered(true) }}
      onPointerOut={(e) => { e.stopPropagation(); !reduced && setHovered(false) }}
      onClick={(e) => { e.stopPropagation(); signal.action === "BUY" && onApprove?.(); signal.action === "SELL" && onReject?.() }}
    >
      <torusGeometry args={[0.8, 0.12, 16, 40]} />
      <meshStandardMaterial 
        color={glowColor}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1}
      />
    </mesh>
  )
}

export function CoinCanvas({ 
  signal,
  onApprove,
  onReject
}: {
  signal: SignalData
  onApprove?: () => void
  onReject?: () => void
}) {
  const reduced = useReducedMotion()
  
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={reduced ? "demand" : "always"}
    >
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2}
        color="#FFFFFF"
      />
      <directionalLight 
        position={[-5, -5, -5]} 
        intensity={0.5}
        color="#B8873F"
      />
      <SignalCoin signal={signal} onApprove={onApprove} onReject={onReject} />
      <ContactShadows 
        position={[0, -1, 0]}
        opacity={0.3}
        scale={3}
        blur={2}
      />
    </Canvas>
  )
}