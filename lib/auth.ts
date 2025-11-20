/**
 * Temporary auth helper until real identity provider is wired up.
 * Centralizing here makes it easy to swap in NextAuth/Clerk later.
 */
export function getServerUserId(): string {
  // TODO: Replace with real session lookup.
  return 'user-1'
}



