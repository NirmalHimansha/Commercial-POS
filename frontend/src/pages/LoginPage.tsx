import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loginWithPin, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'email' | 'pin'>('email');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  const onPinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pin = formData.get('pin') as string;

    setError(null);
    try {
      await loginWithPin(pin);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid PIN');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome to POS</h1>
          <p className="text-gray-600 mt-2">Please sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {mode === 'email' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={onPinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
              <input
                type="password"
                name="pin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-wider"
                maxLength={4}
                minLength={4}
                disabled={isLoading}
                autoComplete="off"
                placeholder="0000"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Use PIN'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'email' ? 'pin' : 'email')}
            className="text-sm text-blue-600 hover:underline"
            disabled={isLoading}
          >
            {mode === 'email' ? 'Use PIN instead' : 'Use email instead'}
          </button>
        </div>
      </div>
    </div>
  );
}