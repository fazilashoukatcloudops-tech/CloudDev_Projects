import { useEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Sparkles, Stats } from '@react-three/drei'
import * as THREE from 'three'
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import type { DocumentItem } from '../../types/document'
import {
  STATUS_COLORS,
  buildEdges,
  edgePositions,
  nodePosition,
  nodeRadius,
  type Vec3,
} from './galaxyLayout'

type Controls = ComponentRef<typeof OrbitControls>

const FOCUS_DISTANCE = 6

/* ---------- Ek document node ---------- */

type NodeProps = {
  doc: DocumentItem
  position: Vec3
  radius: number
  selected: boolean
  hovered: boolean
  animate: boolean
  detail: number
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

function DocumentNode({
  doc,
  position,
  radius,
  selected,
  hovered,
  animate,
  detail,
  onSelect,
  onHover,
}: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const color = STATUS_COLORS[doc.status]

  useFrame((state, delta) => {
    const mesh = meshRef.current
    const mat = matRef.current
    if (!mesh || !mat) return

    const factor = selected ? 1.35 : hovered ? 1.2 : 1
    mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, radius * factor, 8, delta))

    const pulse =
      animate && doc.status === 'processing'
        ? 0.5 + 0.3 * Math.sin(state.clock.elapsedTime * 3)
        : 0.35
    mat.emissiveIntensity = selected || hovered ? 0.9 : pulse
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        scale={radius}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(doc.id)
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          if (e.delta > 4) return // drag tha, click nahi
          e.stopPropagation()
          onSelect(doc.id)
        }}
      >
        {doc.status === 'failed' ? (
          <octahedronGeometry args={[1, 0]} />
        ) : (
          <icosahedronGeometry args={[1, detail]} />
        )}
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.3}
          flatShading={doc.status === 'failed'}
        />
      </mesh>

      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.9, 0.025, 8, 64]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      )}

      {(hovered || selected) && (
        <Html
          position={[0, radius * 1.6 + 0.3, 0]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none' }}
        >
          <div className="max-w-[220px] truncate whitespace-nowrap rounded-md border border-slate-600 bg-slate-900/90 px-2 py-1 text-xs text-slate-100 shadow">
            {doc.name}
          </div>
        </Html>
      )}
    </group>
  )
}

/* ---------- Center ka wireframe hub ---------- */

function Hub({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (!animate || !ref.current) return
    ref.current.rotation.y += delta * 0.2
    ref.current.rotation.x += delta * 0.1
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.9, 1]} />
      <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.35} />
    </mesh>
  )
}

/* ---------- Select hone par camera focus ---------- */

function FocusRig({
  focus,
  controlsRef,
}: {
  focus: Vec3 | null
  controlsRef: RefObject<Controls | null>
}) {
  const goal = useMemo(() => new THREE.Vector3(), [])
  const before = useMemo(() => new THREE.Vector3(), [])
  const move = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])
  const anim = useRef({ active: false, zoom: false })

  const fx = focus?.[0]
  const fy = focus?.[1]
  const fz = focus?.[2]

  useEffect(() => {
    if (fx === undefined || fy === undefined || fz === undefined) {
      goal.set(0, 0, 0)
      anim.current = { active: true, zoom: false }
    } else {
      goal.set(fx, fy, fz)
      anim.current = { active: true, zoom: true }
    }
  }, [fx, fy, fz, goal])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const stop = () => {
      anim.current.active = false
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controlsRef])

  useFrame((state, delta) => {
    const controls = controlsRef.current
    const a = anim.current
    if (!controls || !a.active) return

    const { camera } = state
    const t = controls.target

    before.copy(t)
    t.set(
      THREE.MathUtils.damp(t.x, goal.x, 4, delta),
      THREE.MathUtils.damp(t.y, goal.y, 4, delta),
      THREE.MathUtils.damp(t.z, goal.z, 4, delta),
    )
    camera.position.add(move.subVectors(t, before))

    let zoomDone = true
    if (a.zoom) {
      dir.subVectors(camera.position, t)
      const next = THREE.MathUtils.damp(dir.length(), FOCUS_DISTANCE, 4, delta)
      camera.position.copy(t).add(dir.setLength(next))
      zoomDone = Math.abs(next - FOCUS_DISTANCE) < 0.05
    }

    controls.update()
    if (t.distanceTo(goal) < 0.01 && zoomDone) a.active = false
  })

  return null
}

/* ---------- Main scene ---------- */

type Props = {
  documents: DocumentItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function DocumentGalaxy({ documents, selectedId, onSelect }: Props) {
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const animate = !reducedMotion
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const controlsRef = useRef<Controls>(null)

  const layout = useMemo(() => {
    const positions = documents.map((_, i) => nodePosition(i))
    return { positions, edges: buildEdges(positions) }
  }, [documents])

  const selectedIndex = documents.findIndex((d) => d.id === selectedId)
  const focus = selectedIndex >= 0 ? layout.positions[selectedIndex] : null

  const links = useMemo(
    () => edgePositions(layout.positions, layout.edges),
    [layout],
  )
  const activeLinks = useMemo(
    () =>
      selectedIndex < 0
        ? null
        : edgePositions(
            layout.positions,
            layout.edges.filter(([a, b]) => a === selectedIndex || b === selectedIndex),
          ),
    [layout, selectedIndex],
  )

  useEffect(() => {
    document.body.style.cursor = hoveredId ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hoveredId])

  return (
    <Canvas
      camera={{ position: [0, 3, 13], fov: 50 }}
      dpr={isMobile ? 1 : [1, 2]}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 14, 34]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} />
      <pointLight position={[-6, -3, 4]} intensity={30} color="#a78bfa" />

      <Hub animate={animate} />

      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[links, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#475569" transparent opacity={0.6} />
      </lineSegments>

      {activeLinks && activeLinks.length > 0 && (
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[activeLinks, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#c7d2fe" />
        </lineSegments>
      )}

      {documents.map((doc, i) => (
        <DocumentNode
          key={doc.id}
          doc={doc}
          position={layout.positions[i]}
          radius={nodeRadius(doc.sizeBytes)}
          selected={doc.id === selectedId}
          hovered={doc.id === hoveredId}
          animate={animate}
          detail={isMobile ? 1 : 2}
          onSelect={onSelect}
          onHover={setHoveredId}
        />
      ))}

      <Sparkles
        count={isMobile ? 30 : 100}
        scale={[22, 14, 22]}
        size={2}
        speed={animate ? 0.3 : 0}
        color="#c7d2fe"
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={26}
        autoRotate={animate && !isMobile && !selectedId && !hoveredId}
        autoRotateSpeed={0.5}
      />
      <FocusRig focus={focus} controlsRef={controlsRef} />

      {import.meta.env.DEV && <Stats />}
    </Canvas>
  )
}
