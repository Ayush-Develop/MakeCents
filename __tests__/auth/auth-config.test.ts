/**
 * Unit tests for NextAuth configuration
 * 
 * To run: npm test
 */

// Mock dependencies BEFORE importing auth-config
const mockFindUnique = jest.fn()
const mockCompare = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: (...args: any[]) => mockCompare(...args),
  hash: jest.fn(),
}))

// Now import after mocks are set up
import { authOptions } from '@/lib/auth-config'

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindUnique.mockClear()
    mockCompare.mockClear()
  })

  it('should have credentials provider configured', () => {
    expect(authOptions.providers).toHaveLength(1)
    // CredentialsProvider doesn't expose id directly, but we can check the name
    const provider = authOptions.providers[0] as any
    expect(provider.name).toBe('Credentials')
  })

  it('should use JWT session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('should have custom signin page', () => {
    expect(authOptions.pages?.signIn).toBe('/auth/signin')
  })

  describe('Credentials Provider - authorize function', () => {
    it('should return null for missing credentials', async () => {
      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({})

      expect(result).toBeNull()
    })

    it('should return null for missing email', async () => {
      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        password: 'password123',
      })

      expect(result).toBeNull()
    })

    it('should return null for missing password', async () => {
      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        email: 'test@example.com',
      })

      expect(result).toBeNull()
    })

    it('should return null for non-existent user', async () => {
      mockFindUnique.mockResolvedValue(null)

      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        email: 'nonexistent@example.com',
        password: 'password123',
      })

      expect(result).toBeNull()
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      })
    })

    it('should return null for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }

      mockFindUnique.mockResolvedValue(mockUser)
      mockCompare.mockResolvedValue(false)

      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'wrong-password',
      })

      expect(result).toBeNull()
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(mockCompare).toHaveBeenCalledWith('wrong-password', 'hashed-password')
    })

    it('should return user object for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }

      mockFindUnique.mockResolvedValue(mockUser)
      mockCompare.mockResolvedValue(true)

      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'correct-password',
      })

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(mockCompare).toHaveBeenCalledWith('correct-password', 'hashed-password')
    })

    it('should handle user without name', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: null,
      }

      mockFindUnique.mockResolvedValue(mockUser)
      mockCompare.mockResolvedValue(true)

      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'correct-password',
      })

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: undefined,
      })
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(mockCompare).toHaveBeenCalledWith('correct-password', 'hashed-password')
    })
  })

  describe('JWT Callback', () => {
    it('should add user ID to token on first sign in', async () => {
      const token = {}
      const user = { id: 'user-123', email: 'test@example.com' }

      const result = await authOptions.callbacks?.jwt({
        token,
        user,
      } as any)

      expect(result?.id).toBe('user-123')
    })

    it('should preserve existing token data', async () => {
      const token = { id: 'user-123', email: 'test@example.com' }

      const result = await authOptions.callbacks?.jwt({
        token,
      } as any)

      expect(result?.id).toBe('user-123')
      expect(result?.email).toBe('test@example.com')
    })
  })

  describe('Session Callback', () => {
    it('should add user ID to session', async () => {
      const session = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }
      const token = { id: 'user-123' }

      const result = await authOptions.callbacks?.session({
        session,
        token,
      } as any)

      expect(result?.user?.id).toBe('user-123')
      expect(result?.user?.email).toBe('test@example.com')
    })

    it('should handle missing token ID gracefully', async () => {
      const session = {
        user: {
          email: 'test@example.com',
        },
      }
      const token = {}

      const result = await authOptions.callbacks?.session({
        session,
        token,
      } as any)

      expect(result?.user?.id).toBeUndefined()
    })
  })
})

