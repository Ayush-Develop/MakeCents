# Testing Guide

This guide explains how to run and write tests for the MakeCents project.

## 🧪 Testing Framework

We use **Jest** with **React Testing Library** for unit and integration tests.

### Setup

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Run tests**:
   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm run test:watch

   # Run tests with coverage
   npm run test:coverage
   ```

## 📁 Test Structure

Tests are located in the `__tests__/` directory, mirroring the source structure:

```
__tests__/
  auth/
    signup.test.ts
    auth-config.test.ts
    lib-auth.test.ts
```

## ✍️ Writing Tests

### Test File Naming

- Test files should end with `.test.ts` or `.test.tsx`
- Place tests in `__tests__/` directories or alongside source files

### Example: Testing an API Route

```typescript
import { POST } from '@/app/api/auth/signup/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user', async () => {
    // Test implementation
  })
})
```

### Example: Testing a React Component

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/Button'

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

## 🎯 Test Coverage

We aim for:
- **Unit tests**: Core utilities, helpers, and business logic
- **Integration tests**: API routes and data flows
- **E2E tests**: Critical user flows (using Playwright - future)

### Current Coverage

- ✅ Authentication flows (signup, auth config, auth helpers)
- ⏳ API routes (in progress)
- ⏳ React components (in progress)
- ⏳ Utility functions (in progress)

## 🔧 Configuration

### Jest Configuration

- **Config file**: `jest.config.js`
- **Setup file**: `jest.setup.js` (mocks and global setup)
- **Environment**: `jest-environment-jsdom` (for React components)

### Mocks

Common mocks are set up in `jest.setup.js`:
- Next.js router (`next/navigation`)
- NextAuth (`next-auth/react`)
- Environment variables

## 🚀 Running Tests in CI/CD

Tests should run automatically in CI/CD pipelines. Example GitHub Actions:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

## 📝 Best Practices

1. **Test behavior, not implementation**
   - Focus on what the code does, not how it does it

2. **Use descriptive test names**
   - `it('should return user ID from session', ...)`
   - Not: `it('works', ...)`

3. **Arrange-Act-Assert pattern**
   ```typescript
   it('should create user', async () => {
     // Arrange
     const mockUser = { email: 'test@example.com' }
     
     // Act
     const result = await createUser(mockUser)
     
     // Assert
     expect(result).toBeDefined()
   })
   ```

4. **Clean up after tests**
   - Use `beforeEach` and `afterEach` to reset mocks
   - Don't let tests affect each other

5. **Mock external dependencies**
   - Database calls
   - API requests
   - File system operations

## 🐛 Debugging Tests

### Run a specific test file:
```bash
npm test signup.test.ts
```

### Run tests matching a pattern:
```bash
npm test -- --testNamePattern="should create user"
```

### Debug in VS Code:
1. Set breakpoints in test files
2. Use "Debug Jest Test" configuration
3. Or use `npm run test:watch` and press `p` to filter

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

