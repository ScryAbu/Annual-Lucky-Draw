import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import LotterySphere from '../../3d/LotterySphere'
import { Employee } from '../../types'

interface LotterySceneProps {
  employees: Employee[]
  isRolling: boolean
  winners: Employee[]
  primaryColor: string
}

// 加载占位
function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#6366f1" wireframe />
    </mesh>
  )
}

export default function LotteryScene({
  employees,
  isRolling,
  winners,
  primaryColor,
}: LotterySceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          <LotterySphere
            employees={employees}
            isRolling={isRolling}
            winners={winners}
            primaryColor={primaryColor}
          />
        </Suspense>
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={20}
          autoRotate={!isRolling}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
