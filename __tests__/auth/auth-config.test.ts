/**
 * Unit tests for NextAuth configuration
 * 
 * To run: npm test
 */

import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have credentials provider configured', () => {
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('credentials')
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

    it('should return null for non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        email: 'nonexistent@example.com',
        password: 'password123',
      })

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
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

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const provider = authOptions.providers[0] as any
      const result = await provider.authorize({
        email: 'test@example.com',
        password: 'wrong-password',
      })

      expect(result).toBeNull()
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password')
    })

    it('should return user object for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

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
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-password')
    })

    it('should handle user without name', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: null,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

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

