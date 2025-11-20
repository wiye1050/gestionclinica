import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock de Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}))

// Mock de useAuth hook
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', uid: 'test-uid' },
    loading: false,
  }),
}))
