# MakeCents Tech Stack Explained

## 🎯 Core Framework & Language

### **Next.js 14 (App Router)**
- **What it is**: React framework for production
- **Why we use it**: 
  - Server-side rendering for better performance
  - Built-in API routes (no separate backend needed)
  - File-based routing (easy navigation)
  - Optimized builds and automatic code splitting
- **Key features we use**:
  - App Router (new routing system)
  - Server Components (faster initial load)
  - API Routes (backend endpoints)

### **TypeScript**
- **What it is**: JavaScript with type safety
- **Why we use it**: 
  - Catches errors before runtime
  - Better IDE autocomplete
  - Self-documenting code
  - Easier refactoring

## 🗄️ Database & ORM

### **Prisma ORM**
- **What it is**: Next-generation ORM (Object-Relational Mapping)
- **Why we use it**:
  - Type-safe database queries
  - Auto-generated TypeScript types
  - Database migrations made easy
  - Great developer experience
- **How it works**: 
  - Define schema in `schema.prisma`
  - Prisma generates client code
  - Use client to query database

### **SQLite (Development)**
- **What it is**: Lightweight file-based database
- **Why we use it**: 
  - No setup required (just a file)
  - Perfect for development
  - Easy to backup (just copy the file)
- **Production**: Can switch to PostgreSQL easily

## 🎨 Styling & UI

### **Tailwind CSS**
- **What it is**: Utility-first CSS framework
- **Why we use it**:
  - Write styles directly in JSX
  - No separate CSS files needed
  - Consistent design system
  - Responsive design made easy
- **Example**: `className="bg-blue-500 text-white px-4 py-2"`

### **Radix UI**
- **What it is**: Unstyled, accessible component primitives
- **Why we use it**:
  - Accessible by default (WCAG compliant)
  - Unstyled (we control the look)
  - Keyboard navigation built-in
  - Components: Dialog, Dropdown, Select, Tabs

### **Lucide React**
- **What it is**: Beautiful icon library
- **Why we use it**: 
  - Consistent icon set
  - Tree-shakeable (only imports what you use)
  - TypeScript support

## 📊 Data Visualization

### **Recharts**
- **What it is**: Composable charting library for React
- **Why we use it**:
  - Built for React
  - Responsive charts
  - Easy to customize
  - Types: Line, Bar, Pie, Area charts

## 🔄 State Management & Data Fetching

### **TanStack Query (React Query)**
- **What it is**: Powerful data synchronization for React
- **Why we use it**:
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Loading/error states handled
- **How it works**: 
  - Fetch data from API
  - Cache automatically
  - Refetch when needed
  - Update UI reactively

## 🔐 Authentication (Planned)

### **NextAuth.js**
- **What it is**: Complete authentication solution
- **Why we'll use it**:
  - Multiple auth providers (email, OAuth)
  - Session management
  - Secure by default
  - Easy to integrate

## 🛠️ Utilities & Tools

### **Zod**
- **What it is**: TypeScript-first schema validation
- **Why we use it**:
  - Validate API request data
  - Type inference from schemas
  - Runtime type checking

### **date-fns**
- **What it is**: Modern JavaScript date utility library
- **Why we use it**: 
  - Format dates easily
  - Calculate date differences
  - Timezone support

### **clsx & tailwind-merge**
- **What they are**: Utility functions for className management
- **Why we use them**:
  - Conditionally apply classes
  - Merge Tailwind classes properly
  - Cleaner JSX

### **bcryptjs**
- **What it is**: Password hashing library
- **Why we use it**: 
  - Secure password storage
  - Never store plain text passwords

## 📦 Project Structure

```
MakeCents/
├── app/                    # Next.js pages & API routes
│   ├── api/               # Backend endpoints
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx          # Landing page
├── components/           # Reusable React components
├── lib/                  # Utilities & configurations
├── prisma/               # Database schema
└── public/               # Static assets
```

## 🔄 Data Flow

1. **User Action** → React Component
2. **Component** → TanStack Query hook
3. **Query Hook** → API Route (`/api/*`)
4. **API Route** → Prisma Client
5. **Prisma** → SQLite Database
6. **Response** flows back up the chain

## 🚀 Development Workflow

1. **Define Schema** → `prisma/schema.prisma`
2. **Generate Client** → `npm run db:generate`
3. **Create API** → `app/api/*/route.ts`
4. **Build UI** → `app/dashboard/*/page.tsx`
5. **Fetch Data** → TanStack Query hooks
6. **Style** → Tailwind CSS classes

## 📈 Why This Stack?

- **Fast Development**: Next.js + TypeScript = quick iteration
- **Type Safety**: TypeScript + Prisma = fewer bugs
- **Modern**: Latest React patterns and best practices
- **Scalable**: Can handle growth easily
- **Developer Experience**: Great tooling and documentation

