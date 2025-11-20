'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error para debugging
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Callback opcional para reporting (Sentry, etc.)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Algo salió mal
          </h2>
          <p className="text-gray-600 text-center mb-4 max-w-md">
            Ha ocurrido un error inesperado. Puedes intentar recargar el componente.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-xs text-red-600 bg-red-100 p-3 rounded mb-4 max-w-full overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar con Error Boundary en componentes funcionales
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  if (error) {
    throw error
  }

  return {
    showBoundary: setError,
    resetBoundary: () => setError(null),
  }
}

// Componente wrapper para módulos específicos
interface ModuleErrorBoundaryProps {
  children: React.ReactNode
  moduleName: string
}

export function ModuleErrorBoundary({ children, moduleName }: ModuleErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error en {moduleName}
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            Este módulo no se pudo cargar correctamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Recargar página
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
