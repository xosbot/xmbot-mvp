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

const RISK_LEVELS = [
  { name: "Conservative", value: 1, color: new THREE.Color("#059669") },
  { name: "Moderate", value: 2, color: new THREE.Color("#F59E0B") },
  { name: "Aggressive", value: 3, color: new THREE.Color("#8B5CF0") },
]

interface FloatingSliderProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  hovered: boolean
}

function FloatingSlider({ value, min, max, onChange, hovered }: FloatingSliderProps) {
  const ref = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()
  
  const normalized = (value - min) / (max - min)
  const yPos = -1 + normalized * 2
  const activeLevelIndex = Math.min(Math.floor(normalized * 3), RISK_LEVELS.length - 1)
  const activeLevel = RISK_LEVELS[activeLevelIndex]
  
  useFrame((state) => {
    if (ref.current && !reduced) {
      const t = (state.clock.elapsedTime as unknown) as number
      ref.current.position.y = yPos + Math.sin(t * 2) * 0.02
      ref.current.rotation.z = Math.sin(t * 2) * 0.1
      
      const scale = 1 + (hovered ? 0.2 : 0)
      ref.current.scale.setScalar(scale)
    }
  })

  const handlePointerDown = (e: Event) => {
    e.stopPropagation()
  }

  return (
    <group>
      <mesh ref={ref} position={[0, yPos, 0]} onClick={handlePointerDown}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={activeLevel.color}
          emissive={activeLevel.color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, yPos, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3, 8]} />
        <meshStandardMaterial color="#4B5563" opacity={0.3} />
      </mesh>
    </group>
  )
}

const MAX_RISK = 2
const MIN_RISK = 1

export function RiskControl({ 
  value = 2, 
  onChange,
  label = "Max Risk per Trade"
}: {
  value?: number
  onChange?: (value: number) => void
  label?: string
}) {
  const [internalValue, setInternalValue] = useState(value)
  const [hovered, setHovered] = useState(false)
  const handleChange = onChange || setInternalValue
  const reduced = useReducedMotion()
  
  return (
    <div className="relative" style={{ height: 200 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={reduced ? "demand" : "always"}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 3]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#E4C98A" />
        <FloatingSlider
          value={internalValue}
          min={MIN_RISK}
          max={MAX_RISK}
          onChange={handleChange}
          hovered={hovered}
        />
      </Canvas>
    </div>
  )
}