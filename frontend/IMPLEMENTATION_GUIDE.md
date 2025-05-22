# Frontend Implementation Guide

This guide outlines how to implement the Whispr frontend using Next.js and TypeScript.

## Getting Started

### Setting Up the Next.js Project

1. While in the `frontend` directory, initialize a new Next.js project:

```bash
npx create-next-app@latest . --typescript
```

2. Install additional dependencies:

```bash
npm install axios tailwindcss @headlessui/react
npm install js-cookie @types/js-cookie
npm install zustand
npm install react-hook-form zod @hookform/resolvers
```

3. Set up Tailwind CSS:

```bash
npx tailwindcss init -p
```

4. Configure Tailwind CSS in `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        secondary: {
          DEFAULT: '#6B7280',
          hover: '#4B5563',
        },
      },
    },
  },
  plugins: [],
}
```

## Project Structure

Create the following directory structure:

```
frontend/
├── public/
│   └── images/         # Store images here
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── auth/       # Authentication pages
│   │   ├── courses/    # Course pages
│   │   ├── professors/ # Professor pages
│   │   ├── user/       # User profile pages
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page
│   ├── components/     # React components
│   │   ├── ui/         # UI components
│   │   └── layout/     # Layout components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility functions
│   ├── store/          # State management
│   └── types/          # TypeScript types
└── ...
```

## Implementation Steps

### 1. Create API Client

Create `src/lib/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for cookies
});

// Add request interceptor for error handling
api.interceptors.request.use(
  (config) => {
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

### 2. Create Authentication Store

Create `src/store/authStore.ts`:

```typescript
import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  is_verified: boolean;
  is_muffled: boolean;
  is_admin: boolean;
  echoes: number;
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
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username, password) => {
    try {
      set({ isLoading: true, error: null });
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData);
      
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

  register: async (username, email, password) => {
    try {
      set({ isLoading: true, error: null });
      await api.post('/auth/register', {
        username,
        email,
        password,
      });
      
      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/users/me');
      
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
```

### 3. Create Root Layout

Create `src/app/layout.tsx`:

```tsx
'use client';

import { Inter } from 'next/font/google';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkAuth, isAuthenticated, user, logout } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-primary text-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">Whispr</Link>
            
            <nav className="flex space-x-4">
              <Link
                href="/courses"
                className={`px-3 py-2 rounded-md ${
                  pathname.startsWith('/courses') ? 'bg-primary-hover' : 'hover:bg-primary-hover'
                }`}
              >
                Courses
              </Link>
              <Link
                href="/professors"
                className={`px-3 py-2 rounded-md ${
                  pathname.startsWith('/professors') ? 'bg-primary-hover' : 'hover:bg-primary-hover'
                }`}
              >
                Professors
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/user/profile"
                    className={`px-3 py-2 rounded-md ${
                      pathname.startsWith('/user') ? 'bg-primary-hover' : 'hover:bg-primary-hover'
                    }`}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="px-3 py-2 rounded-md hover:bg-primary-hover"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className={`px-3 py-2 rounded-md ${
                      pathname === '/auth/login' ? 'bg-primary-hover' : 'hover:bg-primary-hover'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className={`px-3 py-2 rounded-md ${
                      pathname === '/auth/register' ? 'bg-primary-hover' : 'hover:bg-primary-hover'
                    }`}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="bg-gray-100 border-t mt-auto">
          <div className="container mx-auto px-4 py-6 text-center text-gray-600">
            <p>© {new Date().getFullYear()} Whispr. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
```

### 4. Create Home Page

Create `src/app/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="space-y-10">
      <section className="text-center py-12 bg-gray-50 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to Whispr</h1>
        <p className="text-xl mb-6 max-w-2xl mx-auto">
          Your platform for honest course and professor reviews.
          {isAuthenticated ? ' Share your experiences and help others make informed decisions.' : ' Join us to read and write reviews.'}
        </p>
        {!isAuthenticated && (
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-5 py-3 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-5 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-3">Course Reviews</h2>
          <p className="mb-4">Browse honest reviews from students about courses at your institution.</p>
          <Link
            href="/courses"
            className="text-primary hover:underline font-medium"
          >
            Explore Courses →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-3">Professor Insights</h2>
          <p className="mb-4">Learn about professors' teaching styles, grading, and more from student experiences.</p>
          <Link
            href="/professors"
            className="text-primary hover:underline font-medium"
          >
            Explore Professors →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-3">Community</h2>
          <p className="mb-4">Join a community of students helping each other make informed academic decisions.</p>
          {isAuthenticated ? (
            <Link
              href="/user/profile"
              className="text-primary hover:underline font-medium"
            >
              View Your Profile →
            </Link>
          ) : (
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-medium"
            >
              Join Now →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
```

### 5. Create Login Page

Create `src/app/auth/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(username, password);
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Log In to Whispr</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span className="block">{error}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={clearError}
          >
            &times;
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link href="/auth/register" className="text-primary hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
```

### 6. Create Registration Page

Create `src/app/auth/register/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    setPasswordError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(username, email, password);
      router.push('/auth/login?registered=true');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span className="block">{error}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={clearError}
          >
            &times;
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
              passwordError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {passwordError && (
            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
```

## Next Steps

Continue building the frontend by implementing the following features:

1. **Course Listing and Detail Pages**:
   - Course browsing with filters
   - Course detail page with reviews
   - Review submission form

2. **Professor Listing and Detail Pages**:
   - Professor browsing with filters
   - Professor detail page with reviews
   - Review submission form

3. **User Profile**:
   - View and edit profile information
   - View user's reviews
   - Follow/unfollow other users

4. **Search Functionality**:
   - Search bar in header
   - Search results page
   - Filtering and sorting options

## UI Components

Create reusable UI components in the `components/ui` directory:

1. **Button**: Primary, secondary, and outline variants
2. **Card**: For displaying courses, professors, reviews
3. **Input**: Text input, select, textarea
4. **Alert**: Success, error, warning messages
5. **Modal**: For confirmations and forms
6. **Rating**: Star rating component for reviews

## Data Fetching Patterns

Use the following pattern for data fetching in components:

```tsx
'use client';

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Courses</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
```

## Forms with Validation

Use react-hook-form and zod for form validation:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(10, 'Review must be at least 10 characters'),
  is_anonymous: z.boolean().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function ReviewForm({ courseId }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      content: '',
      is_anonymous: false,
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await api.post('/reviews', {
        ...data,
        course_id: courseId,
      });
      reset();
      // Show success message or redirect
    } catch (error) {
      console.error('Error submitting review:', error);
      // Show error message
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields */}
    </form>
  );
}
```

## Testing

Add testing using Jest and React Testing Library:

```tsx
// src/app/auth/login/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { useAuthStore } from '@/store/authStore';

// Mock the store
jest.mock('@/store/authStore');
// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    (useAuthStore as jest.Mock).mockReturnValue({
      login: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('submits the form with correct values', async () => {
    const mockLogin = jest.fn().mockResolvedValue({});
    (useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin,
      error: null,
      clearError: jest.fn(),
    });
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });
});
```