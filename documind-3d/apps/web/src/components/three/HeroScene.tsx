import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery'

function Core({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    if (animate) {
      mesh.rotation.y += delta * 0.3
      mesh.rotation.x += delta * 0.1
    }
    const target = hovered ? 1.15 : 1
    mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, target, 5, delta))
  })

  return (
    <mesh
      ref={ref}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <icosahedronGeometry args={[1.4, 4]} />
      <MeshDistortMaterial
        color="#6366f1"
        emissive="#312e81"
        roughness={0.2}
        metalness={0.6}
        distort={animate ? 0.35 : 0}
        speed={animate ? 2 : 0}
      />
    </mesh>
  )
}

function FloatingDocs({ count, animate }: { count: number; animate: boolean }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const radius = 3 + (i % 3) * 0.5
        return {
          position: [
            Math.cos(angle) * radius,
            Math.sin(i * 1.7) * 1.2,
            Math.sin(angle) * radius * 0.6,
          ] as [number, number, number],
          rotation: [0, -angle, 0.15 * (i % 2 ? 1 : -1)] as [number, number, number],
        }
      }),
    [count],
  )

  return (
    <>
      {items.map((item, i) => (
        <Float
          key={i}
          speed={animate ? 1.2 : 0}
          rotationIntensity={animate ? 0.4 : 0}
          floatIntensity={animate ? 0.8 : 0}
        >
          <mesh position={item.position} rotation={item.rotation}>
            <boxGeometry args={[0.8, 1.1, 0.05]} />
            <meshStandardMaterial color="#e0e7ff" roughness={0.4} metalness={0.1} />
          </mesh>
        </Float>
      ))}
    </>
  )
}

function CameraRig({ enabled }: { enabled: boolean }) {
  useFrame((state, delta) => {
    if (!enabled) return
    const { pointer, camera } = state
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 1.2, 3, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.8, 3, delta)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function HeroScene() {
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const animate = !reducedMotion

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 50 }}
      dpr={isMobile ? 1 : [1, 2]}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, -2, 3]} intensity={25} color="#a78bfa" />

      <Core animate={animate} />
      <FloatingDocs count={isMobile ? 5 : 9} animate={animate} />
      <Sparkles
        count={isMobile ? 40 : 140}
        scale={[12, 8, 8]}
        size={isMobile ? 2 : 3}
        speed={animate ? 0.4 : 0}
        color="#c7d2fe"
      />
      <CameraRig enabled={!isMobile && animate} />
    </Canvas>
  )
}