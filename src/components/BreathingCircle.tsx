import { cn } from '@/lib/utils'

export function BreathingCircle({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center mx-auto my-8">
      {/* Outer subtle rings */}
      <div
        className={cn(
          'absolute inset-0 rounded-full border border-primary/20 transition-all duration-[5000ms] ease-in-out',
          isActive ? 'scale-150 opacity-0' : 'scale-100 opacity-100',
        )}
      />
      <div
        className={cn(
          'absolute inset-4 rounded-full border border-primary/40 transition-all duration-[5000ms] ease-in-out',
          isActive ? 'scale-125 opacity-0' : 'scale-100 opacity-100',
        )}
      />

      {/* Core animated breathing lung/circle */}
      <div
        className={cn(
          'w-24 h-24 rounded-[40%] bg-primary/80 blur-[2px] transition-all flex items-center justify-center text-white',
          isActive ? 'animate-breathe' : 'animate-pulse',
        )}
      >
        <div className="w-16 h-16 rounded-[45%] bg-primary mix-blend-overlay rotate-45" />
      </div>
    </div>
  )
}
