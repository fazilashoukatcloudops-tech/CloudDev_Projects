import { Box, MessageSquareText, ShieldCheck, Upload, type LucideIcon } from 'lucide-react'
import { Card } from './ui'

// ==================== FEATURES SECTION ====================
const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Upload, title: 'Smart upload', text: 'PDF upload karo, text extraction aur processing background mein hoti hai.' },
  { icon: MessageSquareText, title: 'AI document chat', text: 'Apne document se sawal poochho aur source references ke saath jawab pao.' },
  { icon: Box, title: '3D explorer', text: 'Documents ko interactive 3D nodes ki tarah explore karo.' },
  { icon: ShieldCheck, title: 'Private by default', text: 'Har user ke documents sirf usi ko nazar aate hain.' },
]

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-bold">Features</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
        Core features 3D ke bina bhi usable hain; 3D explorer unhe ek naya andaaz deta hai.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="space-y-3 p-5">
            <div className="inline-flex rounded-lg bg-indigo-500/10 p-2 text-indigo-300">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-slate-400">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ==================== HOW IT WORKS ====================
const steps = [
  { n: '1', title: 'Upload', text: 'Apna PDF dashboard mein upload karo.' },
  { n: '2', title: 'Process', text: 'Worker text extract karke AI ke liye tayyar karta hai.' },
  { n: '3', title: 'Explore & Ask', text: '3D workspace mein dekho aur AI se sawal poochho.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-20 sm:px-6">
      <h2 className="text-center text-3xl font-bold">How it works</h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">
              {s.n}
            </span>
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}