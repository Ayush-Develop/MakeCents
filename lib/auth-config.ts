/**
 * NextAuth.js Configuration
 * 
 * This file will be used to configure NextAuth once we set it up.
 * For now, this is a placeholder showing what we'll need.
 */

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

/**
 * NextAuth Configuration
 * 
 * TODO: Uncomment and configure once NextAuth is set up
 * 
 * Steps:
 * 1. Create app/api/auth/[...nextauth]/route.ts
 * 2. Import this config
 * 3. Set up credentials provider
 * 4. Add session callback to include user ID
 */
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) {
                    return null
                }

                // Verify password
                const isValid = await bcrypt.compare(credentials.password, user.password)

                if (!isValid) {
                    return null
                }

                // Return user object (will be available in session)
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name || undefined,
                }
            }
        })
    ],
    session: {
        strategy: 'jwt', // Use JWT for sessions (simpler than database sessions)
    },
    callbacks: {
        async jwt({ token, user }) {
            // Add user ID to token on first sign in
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            // Add user ID to session
            if (session.user && token.id) {
                session.user.id = token.id as string
            }
            return session
        }
    },
    pages: {
        signIn: '/auth/signin',
        signUp: '/auth/signup', // We'll create custom signup page
    },
    secret: process.env.NEXTAUTH_SECRET,
}

