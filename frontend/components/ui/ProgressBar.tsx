interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({ 
  value, 
  max = 100, 
  color = 'bg-indigo-600', 
  showLabel = false,
  label,
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-700">{label || 'Progress'}</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heights[size]} overflow-hidden`}>
        <div 
          className={`${color} ${heights[size]} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
