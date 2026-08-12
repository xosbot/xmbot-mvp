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

const GOLD_COLOR = new THREE.Color("#B8873F")
const EMERALD_COLOR = new THREE.Color("#34D399")
const RED_COLOR = new THREE.Color("#EF4444")

interface Signal {
  symbol: string
  action: "BUY" | "SELL"
  entry: string
  confidence: number
  risk: number
}

interface CoinRef {
  current: THREE.Mesh | null
}

function SignalCube({ 
  signal, 
  onClick 
}: { 
  signal: Signal
  onClick: () => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()
  
  const color = signal.action === "BUY" ? EMERALD_COLOR : RED_COLOR
  
  useFrame((state) => {
    if (ref.current && !reduced) {
      const t = state.clock.elapsedTime as unknown as number
      ref.current.rotation.x = t * 0.3
      ref.current.rotation.y = t * 0.5
      ref.current.rotation.z = t * 0.2
      
      const scale = 1 + (hovered ? 0.2 : 0)
      ref.current.scale.setScalar(scale)
    }
  })

  return (
    <mesh 
      ref={ref}
      position={[0, 0, 0]}
      onClick={onClick}
      onPointerOver={() => { if (!reduced) setHovered(true) }}
      onPointerOut={() => { if (!reduced) setHovered(false) }}
    >
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.9}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

interface CoinData {
  position: [number, number, number]
  rotationSpeed: number
  bobSpeed: number
  symbol: string
  action: "BUY" | "SELL"
  confidence: number
  meshRef: CoinRef
}

function FloatingCoins({ count = 5 }: { count?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const reduced = useReducedMotion()
  
  const coins = useMemo((): CoinData[] => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ] as [number, number, number],
      rotationSpeed: 0.5 + Math.random() * 0.3,
      bobSpeed: 1 + Math.random() * 0.5,
      symbol: ['XAUUSD', 'XAGUSD', 'Gold'][i % 3],
      action: Math.random() > 0.5 ? 'BUY' : 'SELL' as const,
      confidence: Math.floor(60 + Math.random() * 30),
      meshRef: { current: null }
    }))
  }, [count])

  useFrame((state) => {
    if (reduced) return
    
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i]
      const t = state.clock.elapsedTime as unknown as number
      
      const x = coin.position[0] + Math.sin(t * coin.bobSpeed) * 0.02
      const y = coin.position[1] + Math.cos(t * coin.bobSpeed * 0.7) * 0.01
      const z = coin.position[2]
      
      if (coin.meshRef.current) {
        coin.meshRef.current.position.set(x, y, z)
        coin.meshRef.current.rotation.y = t * coin.rotationSpeed
        coin.meshRef.current.rotation.x = Math.sin(t * coin.rotationSpeed * 0.5) * 0.1
      }
    }
  })

  return (
    <group>
      {coins.map((coin, i) => (
        <mesh 
          key={i}
          ref={coin.meshRef}
          position={coin.position}
          onPointerOver={() => setHoveredIndex(i)}
          onPointerOut={() => setHoveredIndex(null)}
        >
          <torusGeometry args={[0.3, 0.04, 12, 24]} />
          <meshStandardMaterial 
            color={coin.action === "BUY" ? EMERALD_COLOR : RED_COLOR}
            metalness={0.9}
            roughness={0.1}
            emissive={coin.action === "BUY" ? EMERALD_COLOR : RED_COLOR}
            emissiveIntensity={hoveredIndex === i ? 0.8 : 0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

interface InteractiveHeroCanvasProps {
  onApprove?: () => void
  onReject?: () => void
  onRiskChange?: (risk: number) => void
}

export function InteractiveHeroCanvas({ 
  onApprove,
  onReject,
  onRiskChange
}: InteractiveHeroCanvasProps) {
  const [hovered] = useState(false)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      if (!media.matches) {
        const mouse = { x: 0, y: 0 }
        const handleMouseMove = (e: MouseEvent) => {
          mouse.x = (e.clientX / window.innerWidth) * 2 - 1
          mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [])

  const sampleSignal: Signal = useMemo(() => ({
    symbol: "XAUUSD",
    action: "BUY",
    entry: "3350.25",
    confidence: 82,
    risk: 2
  }), [])

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true 
        }}
        frameloop="always"
      >
        <color attach="background" args={["rgba(0, 0, 0, 0)"]} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.0}
          color="#FFFFFF"
        />
        <directionalLight 
          position={[-3, -3, -3]} 
          intensity={0.5}
          color="#B8873F"
        />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#E4C98A" />
        
        <SignalCube 
          signal={sampleSignal}
          onClick={() => { if (sampleSignal.action === "BUY") onApprove?.(); }}
        />
        
        <FloatingCoins count={5} />
        
        <ContactShadows 
          position={[0, -1.5, 0]}
          opacity={0.2}
          scale={5}
          blur={3}
          rotation-x={-Math.PI * 0.5}
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-8 bg-black/30 rounded-full backdrop-blur-sm" />
    </div>
  )
}