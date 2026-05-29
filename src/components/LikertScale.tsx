import { cn } from '@/lib/utils'

export const LikertScale = ({ onSelect }: { onSelect: (val: number) => void }) => {
  const colors = [
    'bg-[#D9745B]', // 1 - Terracota
    'bg-[#d08866]', // 2
    'bg-[#c79d71]', // 3
    'bg-[#bdc3c7]', // 4 - Neutro
    'bg-[#97b1a8]', // 5
    'bg-[#709688]', // 6
    'bg-[#4A7C68]', // 7 - Verde Sálvia
  ]

  return (
    <div className="flex w-full justify-between items-center gap-1">
      {colors.map((color, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx + 1)}
          aria-label={`Opção ${idx + 1}`}
          className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white font-medium',
            'hover:scale-110 transition-transform active:scale-95 shadow-sm',
            color,
          )}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  )
}
