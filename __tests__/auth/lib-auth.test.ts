/**
 * Unit tests for lib/auth.ts helper functions
 * 
 * To run: npm test
 */

import { getServerUserId, getServerSession } from '@/lib/auth'

// Mock NextAuth getServerSession
const mockGetServerSession = jest.fn()
jest.mock('next-auth/next', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}))

// Mock auth config
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

      mockGetServerSession.mockResolvedValue(mockSession)

      const userId = await getServerUserId()

      expect(userId).toBe('user-123')
      expect(mockGetServerSession).toHaveBeenCalled()
    })

    it('should throw error when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      await expect(getServerUserId()).rejects.toThrow('Unauthorized: User not authenticated')
    })

    it('should throw error when session has no user ID', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
        },
      }

      mockGetServerSession.mockResolvedValue(mockSession)

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

      mockGetServerSession.mockResolvedValue(mockSession)

      const session = await getServerSession()

      expect(session).toEqual(mockSession)
      expect(mockGetServerSession).toHaveBeenCalled()
    })

    it('should return null when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const session = await getServerSession()

      expect(session).toBeNull()
    })
  })
})

