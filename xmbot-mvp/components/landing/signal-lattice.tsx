"use client"

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { cn } from "@/lib/cn"

const GOLD = new THREE.Color("#D9AF3E")
const GOLD_BRIGHT = new THREE.Color("#F6E6B4")
const EMERALD = new THREE.Color("#34D399")

const MAX_DEGREE = 4
const CURSOR_RADIUS = 1.4
const FIRE_MIN_INTERVAL = 8
const FIRE_MAX_INTERVAL = 15
const FIRE_DURATION = 1.2

type LatticeConfig = {
  count: number
  bounds: THREE.Vector3
}

function buildLattice({ count, bounds }: LatticeConfig) {
  // Jittered 3D grid rather than a random cloud, so nearest-neighbor connections
  // read as a "lattice" instead of a sparse point scatter.
  const aspect = bounds.x / bounds.y
  const gy = Math.max(3, Math.round(Math.sqrt(count / (aspect * (bounds.y / bounds.z)))))
  const gx = Math.max(3, Math.round(gy * aspect))
  const gz = Math.max(2, Math.round(count / (gx * gy)))

  const cellW = bounds.x / gx
  const cellH = bounds.y / gy
  const cellD = bounds.z / gz

  const basePositions: number[] = []
  for (let ix = 0; ix < gx; ix++) {
    for (let iy = 0; iy < gy; iy++) {
      for (let iz = 0; iz < gz; iz++) {
        const jitterX = (Math.random() - 0.5) * cellW * 0.7
        const jitterY = (Math.random() - 0.5) * cellH * 0.7
        const jitterZ = (Math.random() - 0.5) * cellD * 0.7
        basePositions.push(
          -bounds.x / 2 + (ix + 0.5) * cellW + jitterX,
          -bounds.y / 2 + (iy + 0.5) * cellH + jitterY,
          -bounds.z / 2 + (iz + 0.5) * cellD + jitterZ
        )
      }
    }
  }

  const n = basePositions.length / 3
  const threshold = Math.max(cellW, cellH, cellD) * 1.6

  // Nearest-neighbor connections, capped per point so the mesh stays sparse and legible.
  const degree = new Array(n).fill(0)
  const connections: [number, number][] = []
  for (let i = 0; i < n; i++) {
    if (degree[i] >= MAX_DEGREE) continue
    const candidates: { j: number; dist: number }[] = []
    for (let j = i + 1; j < n; j++) {
      if (degree[j] >= MAX_DEGREE) continue
      const dx = basePositions[i * 3] - basePositions[j * 3]
      const dy = basePositions[i * 3 + 1] - basePositions[j * 3 + 1]
      const dz = basePositions[i * 3 + 2] - basePositions[j * 3 + 2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < threshold) candidates.push({ j, dist })
    }
    candidates.sort((a, b) => a.dist - b.dist)
    for (const { j } of candidates) {
      if (degree[i] >= MAX_DEGREE) break
      if (degree[j] >= MAX_DEGREE) continue
      connections.push([i, j])
      degree[i]++
      degree[j]++
    }
  }

  return {
    count: n,
    basePositions: new Float32Array(basePositions),
    phases: Float32Array.from({ length: n * 3 }, () => Math.random() * Math.PI * 2),
    connections,
  }
}

function LatticeField({ count, bounds }: LatticeConfig) {
  const { basePositions, phases, connections } = useMemo(
    () => buildLattice({ count, bounds }),
    [count, bounds]
  )
  const n = basePositions.length / 3

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const pulseRef = useRef<THREE.Points>(null)

  const livePositions = useMemo(() => basePositions.slice(), [basePositions])
  const colors = useMemo(() => {
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = GOLD.r
      arr[i * 3 + 1] = GOLD.g
      arr[i * 3 + 2] = GOLD.b
    }
    return arr
  }, [n])
  const linePositions = useMemo(() => new Float32Array(connections.length * 6), [connections])

  const cursorWorld = useRef(new THREE.Vector3(0, 0, 1e6)) // start far away — no reactivity until moved
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const intersection = useMemo(() => new THREE.Vector3(), [])

  const nextFireAt = useRef(FIRE_MIN_INTERVAL + Math.random() * (FIRE_MAX_INTERVAL - FIRE_MIN_INTERVAL))
  const fire = useRef<{ a: number; b: number; start: number } | null>(null)
  const tmpColor = useMemo(() => new THREE.Color(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    state.raycaster.setFromCamera(state.pointer, state.camera)
    if (state.raycaster.ray.intersectPlane(plane, intersection)) {
      cursorWorld.current.copy(intersection)
    }

    for (let i = 0; i < n; i++) {
      const bx = basePositions[i * 3]
      const by = basePositions[i * 3 + 1]
      const bz = basePositions[i * 3 + 2]

      const px = bx + Math.sin(t * 0.15 + phases[i * 3]) * 0.18
      const py = by + Math.sin(t * 0.12 + phases[i * 3 + 1]) * 0.18
      const pz = bz + Math.sin(t * 0.1 + phases[i * 3 + 2]) * 0.18

      const dx = px - cursorWorld.current.x
      const dy = py - cursorWorld.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      let fx = px
      let fy = py
      let brighten = 0

      if (dist < CURSOR_RADIUS) {
        brighten = 1 - dist / CURSOR_RADIUS
        const push = brighten * 0.35
        const len = dist || 1
        fx = px + (dx / len) * push
        fy = py + (dy / len) * push
      }

      livePositions[i * 3] = fx
      livePositions[i * 3 + 1] = fy
      livePositions[i * 3 + 2] = pz

      tmpColor.copy(GOLD).lerp(GOLD_BRIGHT, brighten)
      colors[i * 3] = tmpColor.r
      colors[i * 3 + 1] = tmpColor.g
      colors[i * 3 + 2] = tmpColor.b
    }

    // Signal fire: a rare gold -> emerald pulse traveling between two connected nodes —
    // the only place emerald appears, echoing "AI signal detected -> human approval."
    if (!fire.current && t >= nextFireAt.current && connections.length > 0) {
      const [a, b] = connections[Math.floor(Math.random() * connections.length)]
      fire.current = { a, b, start: t }
    }

    if (fire.current) {
      const progress = (t - fire.current.start) / FIRE_DURATION
      if (progress >= 1) {
        fire.current = null
        nextFireAt.current = t + FIRE_MIN_INTERVAL + Math.random() * (FIRE_MAX_INTERVAL - FIRE_MIN_INTERVAL)
        if (pulseRef.current) {
          ;(pulseRef.current.material as THREE.PointsMaterial).opacity = 0
        }
      } else {
        const { a, b } = fire.current
        const originFlash = Math.max(0, 1 - Math.abs(progress - 0.1) / 0.3)
        const destFlash = Math.max(0, 1 - Math.abs(progress - 0.9) / 0.3)

        tmpColor.copy(GOLD).lerp(EMERALD, originFlash)
        colors[a * 3] = tmpColor.r
        colors[a * 3 + 1] = tmpColor.g
        colors[a * 3 + 2] = tmpColor.b

        tmpColor.copy(GOLD).lerp(EMERALD, destFlash)
        colors[b * 3] = tmpColor.r
        colors[b * 3 + 1] = tmpColor.g
        colors[b * 3 + 2] = tmpColor.b

        if (pulseRef.current) {
          const ax = livePositions[a * 3], ay = livePositions[a * 3 + 1], az = livePositions[a * 3 + 2]
          const bx = livePositions[b * 3], by = livePositions[b * 3 + 1], bz = livePositions[b * 3 + 2]
          const posAttr = pulseRef.current.geometry.attributes.position as THREE.BufferAttribute
          posAttr.setXYZ(0, ax + (bx - ax) * progress, ay + (by - ay) * progress, az + (bz - az) * progress)
          posAttr.needsUpdate = true
          const mat = pulseRef.current.material as THREE.PointsMaterial
          mat.opacity = Math.sin(Math.min(progress, 1) * Math.PI) * 0.9
        }
      }
    }

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      posAttr.array = livePositions
      posAttr.needsUpdate = true
      const colorAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute
      colorAttr.array = colors
      colorAttr.needsUpdate = true
    }

    if (linesRef.current) {
      for (let k = 0; k < connections.length; k++) {
        const [a, b] = connections[k]
        linePositions[k * 6] = livePositions[a * 3]
        linePositions[k * 6 + 1] = livePositions[a * 3 + 1]
        linePositions[k * 6 + 2] = livePositions[a * 3 + 2]
        linePositions[k * 6 + 3] = livePositions[b * 3]
        linePositions[k * 6 + 4] = livePositions[b * 3 + 1]
        linePositions[k * 6 + 5] = livePositions[b * 3 + 2]
      }
      const posAttr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute
      posAttr.array = linePositions
      posAttr.needsUpdate = true
    }
  })

  return (
    <>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#D9AF3E" transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[livePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={pulseRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(3), 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#34D399"
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}

function Scene({ mobile }: { mobile: boolean }) {
  const { size } = useThree()
  const aspect = size.width / size.height
  const bounds = useMemo(
    () => new THREE.Vector3(9 * Math.max(aspect, 1), 5.5, 4),
    [aspect]
  )
  return <LatticeField count={mobile ? 150 : 400} bounds={bounds} />
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.warn("SignalLattice: WebGL unavailable, skipping background effect.", error)
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

export function SignalLattice({ className }: { className?: string }) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(media.matches)
    setMobile(window.innerWidth < 768)

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  return (
    <div className={cn("fixed inset-0 -z-10 pointer-events-none", className)}>
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ alpha: true, antialias: false }}
          style={{ background: "transparent" }}
          frameloop={reducedMotion ? "demand" : "always"}
        >
          <Scene mobile={mobile} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}
