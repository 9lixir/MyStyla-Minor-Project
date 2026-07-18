import { useState } from 'react';
import { toast } from 'sonner';

import { registerUser } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import AbstractBackground from '@/components/AbstractBackground';

export default function Register({ onNavigate }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!form.username || form.username.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }

    if (!form.email) {
      return 'Email is required';
    }

    if (!form.password || form.password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    try {
      setError('');
      setLoading(true);
      await registerUser({
        ...form,
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
      });
      useAuthStore.getState().clearAuth();
      toast.success('Account created successfully. You can log in now.');
      onNavigate('login');
    } catch (error) {
      const response = typeof error === 'object' && error !== null && 'response' in error ? error.response : undefined;
      const status = typeof response === 'object' && response !== null && 'status' in response ? response.status : undefined;
      const responseData = typeof response === 'object' && response !== null && 'data' in response ? response.data : undefined;
      const serverMessage =
        typeof responseData === 'object' && responseData !== null && 'detail' in responseData && typeof responseData.detail === 'string'
          ? responseData.detail
          : undefined;
      const fallbackMessage =
        typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Registration failed. Please try again.';

      const message = status === 409
        ? serverMessage ?? 'That email or username is already registered.'
        : serverMessage ?? fallbackMessage;

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mystyla-auth-shell flex w-full min-h-screen items-center justify-center px-4 py-8">
      <AbstractBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#2A3374] bg-[#151A4D] shadow-lg">
            <img src="/tlhlogo.png" alt="MyStyla logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="mystyla-masthead inline-flex rounded-full mystyla-pill-teal px-3 py-1 text-[10px] font-semibold">
            MyStyla
          </div>
          <p className="mystyla-subtle mt-3 text-sm leading-6">
            Build a wardrobe profile that remembers your colors and favorite silhouettes.
          </p>
        </div>

        <Card className="mystyla-auth-card w-full border-0">
          <CardContent className="space-y-6 p-7 sm:p-8">
            <div className="text-center space-y-2">
              <h1 className="mystyla-masthead text-[11px] font-semibold">Create account</h1>
              <h2 className="mystyla-display text-3xl leading-tight text-[#F5F3FF] sm:text-[34px]">
                Start your MyStyla wardrobe
              </h2>
              <p className="text-sm leading-6 text-[#B9C0E8]">
                Register once to save garments, review uploads, and manage your wardrobe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label className="mystyla-masthead text-[10px] font-semibold">Username</Label>
                <Input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="your username"
                  className="mystyla-input h-auto rounded-none border-0 px-0 text-[15px] shadow-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="mystyla-masthead text-[10px] font-semibold">Email address</Label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="mystyla-input h-auto rounded-none border-0 px-0 text-[15px] shadow-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="mystyla-masthead text-[10px] font-semibold">Password</Label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mystyla-input h-auto rounded-none border-0 px-0 text-[15px] shadow-none"
                />
                <div className="rounded-2xl bg-[#1E2560] px-3 py-2 text-[11px] leading-5 text-[#B9C0E8]">
                  Password must be at least 8 characters.
                </div>
              </div>

              <div className="space-y-1">
                <Label className="mystyla-masthead text-[10px] font-semibold">Confirm password</Label>
                <PasswordInput
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mystyla-input h-auto rounded-none border-0 px-0 text-[15px] shadow-none"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-[#FF4FA0]/40 bg-[#FF4FA0]/10 px-3 py-2 text-sm text-[#FFCBE8]">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="mystyla-button h-11 w-full rounded-full text-sm font-semibold text-white"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-1 text-center text-xs text-[#B9C0E8]">
              Already have an account?{' '}
              <button type="button" onClick={() => onNavigate('login')} className="font-semibold text-[#FFD3EC] hover:underline">
                Log In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
