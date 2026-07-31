"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { cn } from "@/lib/cn"

function ForceFieldParticles({ count = 500 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2 + Math.random() * 2
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [count])

  const positionAttr = useMemo(() => new THREE.BufferAttribute(positions, 3), [positions])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.1
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#10b981"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

export function ForceField({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 -z-10", className)}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ alpha: true, antialias: false }}
        style={{ background: "transparent" }}
      >
        <ForceFieldParticles />
      </Canvas>
    </div>
  )
}
