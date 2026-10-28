import { memo, useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Employee, DisplayOptions } from '../types'
import { useThemeStore } from '../stores/themeStore'
import { displayLines } from '../utils/display'
import { spherePositions, scenePage, SCENE_PAGE_SIZE } from '../utils/draw'

interface LotterySphereProps {
  employees: Employee[]
  isRolling: boolean
  winners: Employee[]
  primaryColor: string
}

// A card owns one canvas/texture. Async photo completion paints this same canvas.
// No blank render while decoding; cleanup handles StrictMode and late callbacks.
const PhotoCard = memo(function PhotoCard({ employee, position, size, primaryColor, options }: {
  employee: Employee; position: [number, number, number]; size: number
  primaryColor: string; options: DisplayOptions
}) {
  const sprite = useRef<THREE.Sprite>(null)
  const materialRef = useRef<THREE.SpriteMaterial>(null)
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    const lines = displayLines(employee, options)
    const paint = (photo?: HTMLImageElement) => {
      ctx.fillStyle = primaryColor
      ctx.fillRect(0, 0, 256, 256)
      if (photo) {
        const scale = Math.max(256 / photo.width, 256 / photo.height)
        ctx.drawImage(photo, (256 - photo.width * scale) / 2, (256 - photo.height * scale) / 2, photo.width * scale, photo.height * scale)
      }
      if (lines.length) {
        const height = lines.length * 42 + 16
        if (photo) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 256 - height, 256, height) }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'white'
        lines.forEach((line, index) => {
          ctx.font = `bold ${lines.length === 1 ? 42 : 30}px sans-serif`
          ctx.fillText(line, 128, photo ? 256 - height + 29 + index * 42 : 128 + (index - (lines.length - 1) / 2) * 46, 240)
        })
      }
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
  return <sprite ref={sprite} position={position} scale={[size, size, 1]}>
    <spriteMaterial ref={materialRef} color={primaryColor} transparent={false} depthWrite depthTest />
  </sprite>
})

export default function LotterySphere({ employees, isRolling, winners, primaryColor }: LotterySphereProps) {
  const groupRef = useRef<THREE.Group>(null)
  const speedRef = useRef(0)
  const [page, setPage] = useState(0)
  const options = useThemeStore(s => s.displayOptions)
  const rotationSpeed = useThemeStore(s => s.rotationSpeed)
  useEffect(() => {
    setPage(0)
    if (employees.length <= SCENE_PAGE_SIZE || winners.length) return
    const timer = window.setInterval(() => setPage(p => p + 1), 8000)
    return () => clearInterval(timer)
  }, [employees, winners.length])
  const displayed = useMemo(() => winners.length ? winners : scenePage(employees, page), [employees, page, winners])
  const positions = useMemo(() => {
    if (!winners.length) return spherePositions(displayed.length)
    const columns = Math.min(6, displayed.length)
    const rows = Math.ceil(displayed.length / columns)
    return displayed.map((_, i): [number, number, number] => [(i % columns - (columns - 1) / 2) * 1.15, ((rows - 1) / 2 - Math.floor(i / columns)) * 1.15, 1])
  }, [displayed.length, winners.length])
  useFrame((_, delta) => {
    if (!groupRef.current) return
    const dt = Math.min(delta, 0.05)
    if (winners.length) { groupRef.current.rotation.set(0, 0, 0); speedRef.current = 0; return }
    speedRef.current = THREE.MathUtils.damp(speedRef.current, isRolling ? rotationSpeed : 0.15, 4, dt)
    groupRef.current.rotation.y += speedRef.current * dt
    groupRef.current.rotation.x = Math.sin(groupRef.current.rotation.y * 0.3) * 0.25
  })
  const size = winners.length ? 1 : Math.max(0.35, Math.min(1, 7 / Math.sqrt(displayed.length || 1)))
  return <group ref={groupRef}>
    {displayed.map((employee, i) => <PhotoCard key={employee.id} employee={employee} position={positions[i]} size={size} primaryColor={primaryColor} options={options} />)}
  </group>
}
