interface SkeletonLoaderProps {
  width?: string
  height?: string
  className?: string
  circle?: boolean
}

export default function SkeletonLoader({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '',
  circle = false 
}: SkeletonLoaderProps) {
  return (
    <div 
      className={`bg-gray-200 animate-pulse ${width} ${height} ${circle ? 'rounded-full' : 'rounded'} ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
      <SkeletonLoader height="h-6" width="w-3/4" />
      <SkeletonLoader height="h-4" width="w-full" />
      <SkeletonLoader height="h-4" width="w-5/6" />
      <div className="flex gap-2">
        <SkeletonLoader height="h-8" width="w-20" />
        <SkeletonLoader height="h-8" width="w-24" />
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      <SkeletonLoader height="h-10" width="w-full" />
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonLoader key={i} height="h-16" width="w-full" />
      ))}
    </div>
  )
}
