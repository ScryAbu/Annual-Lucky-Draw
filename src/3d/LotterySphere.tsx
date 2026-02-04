import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { Employee } from '../types'

interface LotterySphereProps {
  employees: Employee[]
  isRolling: boolean
  winners: Employee[]
  primaryColor: string
}

// 创建精致的姓名卡片纹理（没有照片时使用）
function createNameCardTexture(name: string, department: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  
  // 圆角矩形背景
  const radius = 20
  ctx.beginPath()
  ctx.roundRect(4, 4, 248, 248, radius)
  ctx.fillStyle = color
  ctx.fill()
  
  // 渐变叠加
  const gradient = ctx.createLinearGradient(0, 0, 256, 256)
  gradient.addColorStop(0, 'rgba(255,255,255,0.15)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.1)')
  ctx.fillStyle = gradient
  ctx.fill()
  
  // 边框
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 3
  ctx.stroke()
  
  // 姓名（居中显示全名）
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // 根据名字长度调整字体大小
  const fontSize = name.length <= 2 ? 72 : name.length <= 3 ? 56 : 44
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`
  ctx.fillText(name, 128, department ? 110 : 128)
  
  // 部门（如果有）
  if (department) {
    ctx.font = '20px "Microsoft YaHei", sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText(department.slice(0, 8), 128, 170)
  }
  
  // 底部装饰线
  ctx.beginPath()
  ctx.moveTo(60, 200)
  ctx.lineTo(196, 200)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2
  ctx.stroke()
  
  return new THREE.CanvasTexture(canvas)
}

// 创建照片卡片纹理（有照片时使用）
function createPhotoCardTexture(photoData: string, name: string): Promise<THREE.CanvasTexture> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    
    const img = new Image()
    img.onload = () => {
      // 圆角裁剪
      const radius = 20
      ctx.beginPath()
      ctx.roundRect(4, 4, 248, 248, radius)
      ctx.clip()
      
      // 绘制照片（居中裁剪）
      const scale = Math.max(248 / img.width, 248 / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (256 - w) / 2
      const y = (256 - h) / 2
      ctx.drawImage(img, x, y, w, h)
      
      // 底部渐变遮罩
      const gradient = ctx.createLinearGradient(0, 180, 0, 256)
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.7)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 180, 256, 76)
      
      // 姓名
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(name, 128, 235)
      
      // 边框
      ctx.beginPath()
      ctx.roundRect(4, 4, 248, 248, radius)
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 3
      ctx.stroke()
      
      resolve(new THREE.CanvasTexture(canvas))
    }
    img.src = photoData
  })
}

// 单个卡片组件
function PhotoCard({ 
  employee, 
  position, 
  isWinner,
  primaryColor,
}: { 
  employee: Employee
  position: [number, number, number]
  isWinner: boolean
  primaryColor: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  
  // 异步加载纹理
  useEffect(() => {
    let mounted = true
    
    const loadTexture = async () => {
      let tex: THREE.Texture
      if (employee.photoData) {
        tex = await createPhotoCardTexture(employee.photoData, employee.name)
      } else {
        tex = createNameCardTexture(employee.name, employee.department, primaryColor)
      }
      if (mounted) {
        setTexture(tex)
      }
    }
    
    loadTexture()
    
    return () => {
      mounted = false
    }
  }, [employee.photoData, employee.name, employee.department, primaryColor])

  useFrame((state) => {
    if (meshRef.current) {
      // 卡片始终面向相机
      meshRef.current.lookAt(state.camera.position)
      
      // 中奖者高亮效果
      if (isWinner) {
        const scale = 1.3 + Math.sin(state.clock.elapsedTime * 5) * 0.15
        meshRef.current.scale.setScalar(scale)
      }
    }
  })

  if (!texture) return null

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        opacity={isWinner ? 1 : 0.95}
      />
    </mesh>
  )
}

export default function LotterySphere({ 
  employees, 
  isRolling, 
  winners,
  primaryColor,
}: LotterySphereProps) {
  const groupRef = useRef<THREE.Group>(null)
  const speedRef = useRef(0)
  const targetSpeedRef = useRef(0)

  // 计算球面上的位置
  const positions = useMemo(() => {
    const count = Math.min(employees.length, 60) // 最多显示60个
    const points: [number, number, number][] = []
    const phi = Math.PI * (3 - Math.sqrt(5)) // 黄金角
    
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = phi * i
      
      const x = Math.cos(theta) * radius * 3
      const z = Math.sin(theta) * radius * 3
      
      points.push([x, y * 3, z])
    }
    
    return points
  }, [employees.length])

  // 显示的员工（随机选取）
  const displayEmployees = useMemo(() => {
    if (employees.length <= 60) return employees
    
    // 随机选取60个
    const shuffled = [...employees].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 60)
  }, [employees])

  // 滚动效果
  useEffect(() => {
    if (isRolling) {
      targetSpeedRef.current = 0.03
    } else {
      targetSpeedRef.current = 0
    }
  }, [isRolling])

  useFrame(() => {
    if (groupRef.current) {
      // 平滑过渡速度
      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.05
      
      // 旋转
      groupRef.current.rotation.y += speedRef.current
      groupRef.current.rotation.x = Math.sin(groupRef.current.rotation.y * 0.5) * 0.1
    }
  })

  const winnerIds = new Set(winners.map(w => w.id))

  return (
    <group ref={groupRef}>
      {/* 中心光球 */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.3} />
      </mesh>
      
      {/* 员工卡片 */}
      {displayEmployees.map((emp, index) => (
        <PhotoCard
          key={emp.id}
          employee={emp}
          position={positions[index] || [0, 0, 0]}
          isWinner={winnerIds.has(emp.id)}
          primaryColor={primaryColor}
        />
      ))}
      
      {/* 装饰性粒子 */}
      <Points count={200} primaryColor={primaryColor} />
    </group>
  )
}

// 装饰粒子
function Points({ count, primaryColor }: { count: number; primaryColor: string }) {
  const ref = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 4 + Math.random() * 2
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [count])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={primaryColor}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}
