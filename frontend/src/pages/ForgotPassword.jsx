import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AbstractBackground from '@/components/AbstractBackground';

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      /* API CALL HERE */
      toast.success('Password reset link sent');
    } catch {
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mystyla-auth-shell flex w-full min-h-screen items-center justify-center px-4 py-8">
      <AbstractBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#2A3374] bg-[#F5F3FF] shadow-lg">
            <img src="/tlhlogo.png" alt="MyStyla logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="mystyla-masthead inline-flex rounded-full mystyla-pill px-3 py-1 text-[10px] font-semibold">
            MyStyla
          </div>
        </div>

        <Card className="mystyla-auth-card border-0">
          <CardContent className="space-y-5 p-7 sm:p-8">
            <div className="text-center space-y-2">
              <h1 className="mystyla-masthead text-[11px] font-semibold">Reset access</h1>
              <h2 className="mystyla-display text-3xl leading-tight text-[#F5F3FF] sm:text-[34px]">Forgot your password?</h2>
              <p className="text-sm leading-6 text-[#B9C0E8]">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label className="mystyla-masthead text-[10px] font-semibold">Email address</Label>
                <Input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mystyla-input h-auto rounded-none border-0 px-0 text-[15px] shadow-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mystyla-button h-11 w-full rounded-full text-sm font-semibold text-white"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="text-center text-xs text-[#B9C0E8]">
              <button type="button" onClick={() => onNavigate('login')} className="font-semibold text-[#FFD3EC] hover:text-[#FF6FB5] hover:underline">
                ← Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}