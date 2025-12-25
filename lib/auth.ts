/**
 * Authentication helpers using NextAuth.js
 */

import { getServerSession as nextAuthGetServerSession } from 'next-auth/next'
import { authOptions } from './auth-config'

/**
 * Get the current user's ID from the session
 * Throws an error if user is not authenticated
 * 
 * @returns User ID string
 * @throws Error if user is not authenticated
 */
export async function getServerUserId(): Promise<string> {
  const session = await nextAuthGetServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('Unauthorized: User not authenticated')
  }

  return session.user.id
}

/**
 * Get the current user's session
 * Returns null if user is not authenticated
 * 
 * @returns Session object or null
 */
export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions)
}



