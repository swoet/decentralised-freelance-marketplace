import { ReactNode } from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  children?: ReactNode
}

export default function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>}
      {action && (
        action.href ? (
          <Link href={action.href} className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            {action.label}
          </Link>
        ) : (
          <button 
            onClick={action.onClick}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {action.label}
          </button>
        )
      )}
      {children}
    </div>
  )
}
