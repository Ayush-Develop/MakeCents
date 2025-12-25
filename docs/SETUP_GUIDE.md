# Environment Setup Guide

## Step 1: Create `.env` File

Create a `.env` file in the root directory with these variables:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="xJPbobcdkmFMxGH8wXmXC7x06425USmjmqVL60QXxPg="

# Teller API Configuration (optional - only if using Teller)
# Get these from your Teller dashboard: https://dashboard.teller.io
# 
# IMPORTANT: For client-side access, use NEXT_PUBLIC_ prefix
NEXT_PUBLIC_TELLER_APPLICATION_ID="your-app-id"
NEXT_PUBLIC_TELLER_ENV="sandbox"  # Options: sandbox, development, production
#
# For server-side API calls (development/production only):
# TELLER_CERTIFICATE="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
# TELLER_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# TELLER_ENV="sandbox"  # Can also use this instead of NEXT_PUBLIC_TELLER_ENV
```

**Note**: The `NEXTAUTH_SECRET` above is a generated secret. You can generate a new one with:
```bash
openssl rand -base64 32
```

## Step 2: Install Dependencies

You may need to fix npm permissions first:
```bash
sudo chown -R $(whoami) ~/.npm
```

Then install:
```bash
npm install
```

## Step 3: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed
```

## Step 4: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## NextAuth.js Quick Explanation

**What it does**: Handles user login/signup and session management

**How it works**:
1. User logs in → NextAuth creates a session
2. Session stored in encrypted cookie
3. Your app can access user info via `getServerSession()`
4. Protects routes automatically

**Your User model** is already set up with:
- `email` (unique)
- `password` (hashed with bcryptjs)
- `name` (optional)

**Next steps for NextAuth**:
1. Create NextAuth API route (`app/api/auth/[...nextauth]/route.ts`)
2. Configure credentials provider (email/password)
3. Replace `getServerUserId()` in `lib/auth.ts` with real session
4. Create login/signup pages

---

## Teller vs NextAuth

- **NextAuth**: User authentication (who is logged in)
- **Teller**: Bank account linking (connects user's bank accounts)

They work together but are separate:
- User logs in via NextAuth
- User links bank via Teller OAuth flow
- Teller syncs transactions to that user's account

