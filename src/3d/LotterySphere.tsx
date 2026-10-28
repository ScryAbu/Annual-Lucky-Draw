import { memo, useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Employee, DisplayOptions, SceneEffectType } from '../types'
import { useThemeStore } from '../stores/themeStore'
import { paintEmployeeCard } from '../utils/display'
import { effectPositions, scenePage, SCENE_PAGE_SIZE } from '../utils/draw'

interface LotterySphereProps {
  employees: Employee[]
  isRolling: boolean
  winners: Employee[]
  primaryColor: string
}

// A card owns one canvas/texture. Async photo completion paints this same canvas.
// No blank render while decoding; cleanup handles StrictMode and late callbacks.
const PhotoCard = memo(function PhotoCard({
  employee,
  basePosition,
  winnerPosition,
  isWinner,
  hasWinners,
  size,
  primaryColor,
  options,
  effect,
  index,
  isRolling,
  sphereScale,
}: {
  employee: Employee
  basePosition: [number, number, number]
  winnerPosition?: [number, number, number]
  isWinner: boolean
  hasWinners: boolean
  size: number
  primaryColor: string
  options: DisplayOptions
  effect: SceneEffectType
  index: number
  isRolling: boolean
  sphereScale: number
}) {
  const sprite = useRef<THREE.Sprite>(null)
  const materialRef = useRef<THREE.SpriteMaterial>(null)
  const fallOffsetRef = useRef(0)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace

    const paint = (photo?: HTMLImageElement) => {
      paintEmployeeCard(ctx, employee, options, primaryColor, photo)
      tex.needsUpdate = true
    }

    paint()
    const material = materialRef.current!
    material.map = tex
    material.color.set('white')
    material.needsUpdate = true

    let cancelled = false
    const image = new Image()
    image.onload = () => { if (!cancelled) paint(image) }
    image.onerror = () => { /* Keep the already visible text fallback. */ }
    if (options.showPhoto && employee.photoData) image.src = employee.photoData

    return () => {
      cancelled = true; image.onload = null; image.onerror = null
      if (material.map === tex) { material.map = null; material.needsUpdate = true }
      tex.dispose()
    }
  }, [employee.id, employee.name, employee.department, employee.photoData, options, primaryColor])

  useFrame((state, delta) => {
    const s = sprite.current
    if (!s) return
    const dt = Math.min(delta, 0.05)

    let tx = basePosition[0]
    let ty = basePosition[1]
    let tz = basePosition[2]

    if (hasWinners && isWinner && winnerPosition) {
      tx = winnerPosition[0]
      ty = winnerPosition[1]
      tz = winnerPosition[2]
    } else if (effect === 'matrix') {
      const colSpeed = (isRolling ? 4.2 : 0.65) * (0.75 + ((index * 7) % 5) * 0.14)
      fallOffsetRef.current = (fallOffsetRef.current + dt * colSpeed) % (5.8 * sphereScale)
      const halfH = 2.9 * sphereScale
      ty = ((basePosition[1] - fallOffsetRef.current + halfH * 3) % (halfH * 2)) - halfH
    } else if (effect === 'starfield') {
      const t = state.clock.elapsedTime * (isRolling ? 2.6 : 0.55)
      tx = basePosition[0] + Math.sin(t + index * 1.3) * 0.55 * sphereScale
      ty = basePosition[1] + Math.cos(t * 0.9 + index * 1.7) * 0.45 * sphereScale
      tz = basePosition[2] + Math.sin(t * 1.2 + index * 0.7) * 0.65 * sphereScale
    }

    s.position.x = THREE.MathUtils.damp(s.position.x, tx, 7, dt)
    s.position.y = THREE.MathUtils.damp(s.position.y, ty, 7, dt)
    s.position.z = THREE.MathUtils.damp(s.position.z, tz, 7, dt)

    const pulse = isWinner ? 1 + Math.sin(state.clock.elapsedTime * 6) * 0.08 : 1
    const targetScale = isWinner ? Math.max(size * 1.45, 1.18 * sphereScale) * pulse : hasWinners ? size * 0.72 : size
    const nextScale = THREE.MathUtils.damp(s.scale.x, targetScale, 8, dt)
    s.scale.set(nextScale, nextScale, 1)

    if (materialRef.current) {
      const targetOpacity = hasWinners ? (isWinner ? 1 : 0.25) : 0.98
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, targetOpacity, 8, dt)
    }
  })

  return (
    <sprite ref={sprite} position={basePosition} scale={[size, size, 1]}>
      <spriteMaterial ref={materialRef} color={primaryColor} transparent alphaTest={0.05} depthWrite depthTest />
    </sprite>
  )
})

function AmbientParticles({ count, primaryColor, scale }: { count: number; primaryColor: string; scale: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = ((i * 0.61803398875) % 1) * Math.PI * 2
      const phi = Math.acos(2 * (((i * 0.38196601125 + 0.19) % 1)) - 1)
      const r = (3.8 + ((i * 7) % 13) / 6) * scale
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [count, scale])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.06
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color={primaryColor} transparent opacity={0.55} sizeAttenuation />
    </points>
  )
}

export default function LotterySphere({ employees, isRolling, winners, primaryColor }: LotterySphereProps) {
  const groupRef = useRef<THREE.Group>(null)
  const speedRef = useRef(0)
  const [page, setPage] = useState(0)
  const options = useThemeStore(s => s.displayOptions)
  const rotationSpeed = useThemeStore(s => s.rotationSpeed)
  const sphereScale = useThemeStore(s => s.sphereScale)
  const sceneEffect = useThemeStore(s => s.sceneEffect)

  useEffect(() => {
    setPage(0)
    if (employees.length <= SCENE_PAGE_SIZE || winners.length) return
    const timer = window.setInterval(() => setPage(p => p + 1), 8000)
    return () => clearInterval(timer)
  }, [employees, winners.length])

  const displayed = useMemo(() => {
    const pageSlice = scenePage(employees, page)
    if (!winners.length) return pageSlice
    const presentIds = new Set(pageSlice.map(e => e.id))
    const missingWinners = winners.filter(w => !presentIds.has(w.id))
    if (!missingWinners.length) return pageSlice
    return [...pageSlice.slice(0, Math.max(0, pageSlice.length - missingWinners.length)), ...missingWinners]
  }, [employees, page, winners])

  const basePositions = useMemo(
    () => effectPositions(displayed.length, sceneEffect, sphereScale),
    [displayed.length, sceneEffect, sphereScale]
  )

  const winnerPositionMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>()
    if (!winners.length) return map
    const columns = Math.min(6, winners.length)
    const rows = Math.ceil(winners.length / columns)
    const gap = 1.28 * Math.min(1.25, Math.max(0.9, sphereScale * 0.95))
    winners.forEach((w, i) => {
      const x = (i % columns - (columns - 1) / 2) * gap
      const y = ((rows - 1) / 2 - Math.floor(i / columns)) * gap
      map.set(w.id, [x, y, 2.2])
    })
    return map
  }, [winners, sphereScale])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const dt = Math.min(delta, 0.05)
    if (winners.length) {
      speedRef.current = THREE.MathUtils.damp(speedRef.current, 0, 8, dt)
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, 0, 7, dt)
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 7, dt)
      return
    }
    if (sceneEffect === 'matrix') {
      speedRef.current = THREE.MathUtils.damp(speedRef.current, 0, 6, dt)
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, 0, 5, dt)
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 5, dt)
      return
    }
    const targetSpeed = isRolling
      ? (sceneEffect === 'starfield' ? rotationSpeed * 0.45 : rotationSpeed)
      : (sceneEffect === 'starfield' ? 0.06 : 0.15)
    speedRef.current = THREE.MathUtils.damp(speedRef.current, targetSpeed, 4, dt)
    groupRef.current.rotation.y += speedRef.current * dt
    groupRef.current.rotation.x = sceneEffect === 'helix'
      ? Math.sin(groupRef.current.rotation.y * 0.25) * 0.12
      : Math.sin(groupRef.current.rotation.y * 0.3) * 0.22
  })

  const size = Math.max(0.42, Math.min(1.15, 7.6 / Math.sqrt(displayed.length || 1))) * Math.pow(sphereScale, 0.75)
  const hasWinners = winners.length > 0

  return (
    <group ref={groupRef}>
      {sceneEffect === 'sphere' && (
        <mesh>
          <sphereGeometry args={[0.55 * sphereScale, 24, 24]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.18} />
        </mesh>
      )}
      {displayed.map((employee, i) => {
        const winPos = winnerPositionMap.get(employee.id)
        return (
          <PhotoCard
            key={employee.id}
            employee={employee}
            basePosition={basePositions[i] || [0, 0, 0]}
            winnerPosition={winPos}
            isWinner={Boolean(winPos)}
            hasWinners={hasWinners}
            size={size}
            primaryColor={primaryColor}
            options={options}
            effect={sceneEffect}
            index={i}
            isRolling={isRolling}
            sphereScale={sphereScale}
          />
        )
      })}
      <AmbientParticles count={180} primaryColor={primaryColor} scale={sphereScale} />
    </group>
  )
}
