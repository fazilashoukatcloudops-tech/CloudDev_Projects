type Props = {
  variant: 'loading' | 'unsupported'
}

export default function SceneFallback({ variant }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {variant === 'loading' ? (
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <span className="text-sm">Loading 3D scene...</span>
        </div>
      ) : (
        <div className="max-w-xs text-center text-sm text-slate-400">
          3D graphics aap ke browser/device par available nahi hain. Baqi website normal
          kaam karegi.
        </div>
      )}
    </div>
  )
}