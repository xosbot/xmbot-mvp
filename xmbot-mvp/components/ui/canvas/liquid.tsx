"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { cn } from "@/lib/cn"

function Particles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return pos
  }, [count])

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const isGreen = Math.random() > 0.3
      col[i * 3] = isGreen ? 0.06 : 0.55
      col[i * 3 + 1] = isGreen ? 0.73 : 0.36
      col[i * 3 + 2] = isGreen ? 0.5 : 0.96
    }
    return col
  }, [count])

  const positionAttr = useMemo(() => new THREE.BufferAttribute(positions, 3), [positions])
  const colorAttr = useMemo(() => new THREE.BufferAttribute(colors, 3), [colors])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.05
      mesh.current.rotation.y = state.clock.elapsedTime * 0.08
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={colorAttr} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

export function LiquidBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 -z-10", className)}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ alpha: true, antialias: false }}
        style={{ background: "transparent" }}
      >
        <Particles />
      </Canvas>
    </div>
  )
}
