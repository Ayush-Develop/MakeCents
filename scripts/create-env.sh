#!/bin/bash

# Script to create .env file with required variables
# Run with: bash scripts/create-env.sh

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  echo "⚠️  .env file already exists. Backing up to .env.backup"
  cp "$ENV_FILE" "$ENV_FILE.backup"
fi

# Generate a random secret for NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > "$ENV_FILE" << EOF
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Teller API Configuration (optional - only if using Teller)
# Get these from your Teller dashboard: https://dashboard.teller.io
# TELLER_CERTIFICATE="-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----"
# TELLER_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
# TELLER_ENV="sandbox"  # Options: sandbox, development, production

# Teller Application ID (required for Teller Connect - must be NEXT_PUBLIC_ for client-side access)
# Get this from your Teller dashboard: https://dashboard.teller.io
# NEXT_PUBLIC_TELLER_APPLICATION_ID="your-app-id"
# NEXT_PUBLIC_TELLER_ENV="sandbox"  # Options: sandbox, development, production
EOF

echo "✅ Created .env file with generated NEXTAUTH_SECRET"
echo "📝 Review and update the file if needed"

