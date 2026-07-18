import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/auth-store';
import { loginUser } from '@/services/auth.service';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent } from '@/components/ui/card';
import AbstractBackground from '@/components/AbstractBackground';

export default function Login({ onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await loginUser(form);
      const user = res.data.user;
      const token = res.data.accessToken;

      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      onNavigate('wardrobe');
    } catch (err) {
      const response = typeof err === 'object' && err !== null && 'response' in err ? err.response : undefined;
      const responseData = typeof response === 'object' && response !== null && 'data' in response ? response.data : undefined;
      const responseMessage =
        typeof responseData === 'object' && responseData !== null && 'detail' in responseData && typeof responseData.detail === 'string'
          ? responseData.detail
          : undefined;
      const errorMessage =
        typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' ? err.message : undefined;
      const message = responseMessage || errorMessage || 'Login failed';

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
          <div className="mystyla-masthead inline-flex rounded-full mystyla-pill px-3 py-1 text-[10px] font-semibold">
            MyStyla
          </div>
          <p className="mystyla-subtle mt-3 text-sm leading-6">
            A wardrobe-first space for clothing, color, and outfit planning.
          </p>
        </div>

        <Card className="mystyla-auth-card w-full border-0">
          <CardContent className="space-y-6 p-7 sm:p-8">
            <div className="text-center space-y-2">
              <h1 className="mystyla-masthead text-[11px] font-semibold">Login</h1>
              <h2 className="mystyla-display text-3xl leading-tight text-[#F5F3FF] sm:text-[34px]">
                Open your wardrobe
              </h2>
              <p className="text-sm leading-6 text-[#B9C0E8]">
                Sign in to continue exploring garments, palettes, and saved pieces.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
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
                <div className="flex items-center justify-between">
                  <Label className="mystyla-masthead text-[10px] font-semibold">Password</Label>
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-xs font-medium text-[#FFD3EC] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mystyla-input h-auto rounded-none border-0 px-0 text-[15px] shadow-none"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-[#FF4FA0]/40 bg-[#FF4FA0]/10 px-3 py-2 text-sm text-[#FFCBE8]">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mystyla-button h-11 w-full rounded-full text-sm font-semibold text-white"
              >
                {loading ? 'Signing in...' : 'Open Wardrobe'}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 text-xs text-[#B9C0E8]">
              <span className="h-px w-10 bg-[#2A3374]" />
              Use the same email and password you registered with.
              <span className="h-px w-10 bg-[#2A3374]" />
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 text-center text-sm text-[#B9C0E8]">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-semibold text-[#FFD3EC] hover:underline"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
