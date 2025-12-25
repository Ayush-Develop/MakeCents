/**
 * Unit tests for lib/auth.ts helper functions
 * 
 * To run: npm test
 */

import { getServerUserId, getServerSession } from '@/lib/auth'
import { getServerSession as nextAuthGetServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}))

describe('lib/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getServerUserId', () => {
    it('should return user ID from session', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      }

      ;(nextAuthGetServerSession as jest.Mock).mockResolvedValue(mockSession)

      const userId = await getServerUserId()

      expect(userId).toBe('user-123')
      expect(nextAuthGetServerSession).toHaveBeenCalledWith(authOptions)
    })

    it('should throw error when user is not authenticated', async () => {
      ;(nextAuthGetServerSession as jest.Mock).mockResolvedValue(null)

      await expect(getServerUserId()).rejects.toThrow('Unauthorized: User not authenticated')
    })

    it('should throw error when session has no user ID', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
        },
      }

      ;(nextAuthGetServerSession as jest.Mock).mockResolvedValue(mockSession)

      await expect(getServerUserId()).rejects.toThrow('Unauthorized: User not authenticated')
    })
  })

  describe('getServerSession', () => {
    it('should return session when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      ;(nextAuthGetServerSession as jest.Mock).mockResolvedValue(mockSession)

      const session = await getServerSession()

      expect(session).toEqual(mockSession)
      expect(nextAuthGetServerSession).toHaveBeenCalledWith(authOptions)
    })

    it('should return null when not authenticated', async () => {
      ;(nextAuthGetServerSession as jest.Mock).mockResolvedValue(null)

      const session = await getServerSession()

      expect(session).toBeNull()
    })
  })
})

