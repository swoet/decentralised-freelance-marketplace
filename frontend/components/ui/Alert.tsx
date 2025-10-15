import { ReactNode } from 'react'

interface AlertProps {
  children: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  onClose?: () => void
}

export default function Alert({ children, variant = 'info', title, onClose }: AlertProps) {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✓'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '✕'
    }
  }

  const style = variants[variant]

  return (
    <div className={`${style.bg} ${style.border} ${style.text} border rounded-lg p-4`}>
      <div className="flex items-start">
        <span className="text-xl mr-3">{style.icon}</span>
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
