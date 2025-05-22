# Whispr Frontend

The frontend application for the Whispr platform, built with Next.js and TypeScript.

## Getting Started

The frontend directory is currently empty and ready for implementation. Here's how to get started:

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Setup

1. Initialize a new Next.js application:

```bash
# While in the frontend directory
npx create-next-app@latest . --typescript
```

2. Install additional dependencies:

```bash
npm install axios tailwindcss @headlessui/react
npm install js-cookie @types/js-cookie
npm install zustand # For state management
npm install react-hook-form zod @hookform/resolvers # For form validation
```

3. Start the development server:

```bash
npm run dev
```

## Recommended Project Structure

Once you start implementing the frontend, here's a recommended project structure:

```
frontend/
├── public/               # Static files
│   └── images/           # Image assets
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── auth/         # Authentication pages
│   │   │   ├── login/    # Login page
│   │   │   └── register/ # Registration page
│   │   ├── courses/      # Course pages
│   │   ├── professors/   # Professor pages
│   │   ├── user/         # User profile pages
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── ui/           # UI components
│   │   ├── layout/       # Layout components
│   │   ├── courses/      # Course-related components
│   │   └── reviews/      # Review-related components
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts    # Authentication hook
│   │   └── useMediaQuery.ts # Responsive design hook
│   ├── lib/              # Utility functions
│   │   ├── api.ts        # API client
│   │   └── utils.ts      # General utilities
│   ├── store/            # State management
│   │   ├── authStore.ts  # Authentication state
│   │   └── searchStore.ts # Search state
│   └── types/            # TypeScript type definitions
├── tailwind.config.js    # Tailwind CSS configuration
└── next.config.js        # Next.js configuration
```

## Key Features to Implement

### Authentication

Implement authentication using JWT tokens and cookies:

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import axios from 'axios';
import Cookies from 'js-cookie';

interface User {
  id: string;
  username: string;
  email: string;
  // Add other user fields
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });
      
      // The server sets the cookie, we just need to update state
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || 'Login failed',
      });
      throw error;
    }
  },

  // Implement other auth methods...
}));
```

### API Client

Create an API client with authentication and error handling:

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for cookies
});

// Add request interceptor for headers
api.interceptors.request.use(
  (config) => {
    // Add any headers if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors - redirect to login
    if (error.response?.status === 401) {
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Layout

Create a basic layout with navigation:

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-blue-600 text-white">
          <nav className="container mx-auto p-4 flex justify-between">
            <Link href="/" className="text-xl font-bold">Whispr</Link>
            <div className="space-x-4">
              <Link href="/courses">Courses</Link>
              <Link href="/professors">Professors</Link>
              <Link href="/auth/login">Login</Link>
            </div>
          </nav>
        </header>
        <main className="container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-gray-100 p-4 text-center">
          <p>© {new Date().getFullYear()} Whispr</p>
        </footer>
      </body>
    </html>
  );
}
```

### Pages to Implement

1. **Home Page**: Overview of the platform with stats and recent reviews
2. **Login/Register Pages**: Authentication forms
3. **Course List/Detail Pages**: Browse and view course information and reviews
4. **Professor List/Detail Pages**: Browse and view professor information and reviews
5. **User Profile Page**: View and edit user profile
6. **Review Creation Form**: Form to write reviews
7. **Search Page**: Search for courses and professors

## Connecting to the Backend

The frontend communicates with the backend through the API endpoints. Use the API client to make requests:

```typescript
// Example: Fetching courses
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Render the component...
}
```

## Styling

The project is set up to use Tailwind CSS for styling. Configure Tailwind according to your design preferences.

## Testing

Implement testing using Next.js testing tools:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Create test files alongside your components with a `.test.tsx` or `.spec.tsx` extension.

## Deployment

The frontend is containerized using Docker. The existing Dockerfile is a placeholder that you'll need to update once you've implemented the frontend. See the main README for deployment instructions.