import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Navbar, Footer } from '../components/layout'
import { FeaturesSection, HowItWorks } from '../components/landing'
import { ApiStatus, buttonClasses } from '../components/ui'
import SceneFallback from '../components/three/SceneFallback'
import { isWebGLAvailable } from '../hooks/useWebGLSupport'

const HeroScene = lazy(() => import('../components/three/HeroScene'))

export function LandingPage() {
  const webgl = isWebGLAvailable()

  return (
    <div className="bg-slate-950 text-slate-100">
      <Navbar />

      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          {webgl ? (
            <Suspense fallback={<SceneFallback variant="loading" />}>
              <HeroScene />
            </Suspense>
          ) : (
            <SceneFallback variant="unsupported" />
          )}
        </div>

        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-end gap-5 px-6 pb-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">DocuMind 3D</h1>
          <p className="max-w-xl text-slate-300">
            Documents upload karo, AI se sawal poochho, aur unhe interactive 3D workspace mein
            explore karo.
          </p>
          <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
            <Link to="/register" className={buttonClasses('primary', 'px-6 py-3')}>
              Get started
            </Link>
            <Link to="/login" className={buttonClasses('secondary', 'px-6 py-3')}>
              Login
            </Link>
          </div>
          <div className="pointer-events-auto">
            <ApiStatus />
          </div>
        </div>
      </section>

      <main>
        <FeaturesSection />
        <HowItWorks />

        <section className="mx-auto max-w-4xl px-4 pb-24 text-center sm:px-6">
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Apne documents ko explore karna shuru karo</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-300">Free account banao aur pehla PDF upload karo.</p>
            <Link to="/register" className={buttonClasses('primary', 'mt-6 px-6 py-3')}>
              Create account
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}