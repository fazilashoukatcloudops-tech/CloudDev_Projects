import { lazy, Suspense } from 'react'
import SceneFallback from '../components/three/SceneFallback'
import ApiStatus from '../components/ui/ApiStatus'
import { isWebGLAvailable } from '../hooks/useWebGLSupport'

const HeroScene = lazy(() => import('../components/three/HeroScene'))

export default function LandingPage() {
  const webgl = isWebGLAvailable()

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0">
        {webgl ? (
          <Suspense fallback={<SceneFallback variant="loading" />}>
            <HeroScene />
          </Suspense>
        ) : (
          <SceneFallback variant="unsupported" />
        )}
      </div>

      <section className="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-end gap-5 px-6 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">DocuMind 3D</h1>
        <p className="max-w-xl text-slate-300">
          Documents upload karo, AI se sawal poochho, aur unhe interactive 3D workspace mein
          explore karo.
        </p>
        <div className="pointer-events-auto">
          <ApiStatus />
        </div>
      </section>
    </main>
  )
}