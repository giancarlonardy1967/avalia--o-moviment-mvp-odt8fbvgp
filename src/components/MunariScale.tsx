import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface MunariScaleProps {
  onSelect: (value: number) => void
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  leftLabel?: string
  rightLabel?: string
}

export function MunariScale({
  onSelect,
  leftIcon,
  rightIcon,
  leftLabel,
  rightLabel,
}: MunariScaleProps) {
  const options = [1, 2, 3, 4, 5, 6, 7]

  return (
    <div className="w-full flex flex-col items-center animate-fade-in-up">
      <div className="flex justify-between w-full mb-4 gap-1 sm:gap-2 relative">
        {/* Connection line behind buttons */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border -translate-y-1/2 z-0 rounded-full opacity-50" />

        {options.map((num) => (
          <button
            key={num}
            onClick={() => onSelect(num)}
            aria-label={`Nível ${num}`}
            className={cn(
              'relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold transition-all duration-200',
              'flex items-center justify-center text-base',
              'hover:scale-110 active:scale-95',
              'border-2 bg-background',
              // Semantic color gradient from Munari philosophy
              num <= 3
                ? 'hover:border-terracota hover:text-terracota'
                : num === 4
                  ? 'hover:border-muted-foreground hover:text-foreground'
                  : 'hover:border-salvia hover:text-salvia',
              'border-border text-foreground shadow-sm',
            )}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="flex justify-between w-full text-xs text-muted-foreground px-1">
        <div className="flex flex-col items-start gap-1 max-w-[100px] text-left">
          <span className="text-terracota/80">{leftIcon}</span>
          <span className="leading-tight">{leftLabel}</span>
        </div>
        <div className="flex flex-col items-end gap-1 max-w-[100px] text-right">
          <span className="text-salvia/80">{rightIcon}</span>
          <span className="leading-tight">{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}
