import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '../lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md paper-texture p-8 rounded-2xl page-shadow">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="font-display text-2xl font-bold text-foreground">MemoryBook</span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
            <p className="text-muted-foreground font-body mb-6">
              If that email exists we've sent a password reset link. Check your inbox.
            </p>
            <Link to="/login">
              <Button variant="warm" className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              Forgot password?
            </h1>
            <p className="text-muted-foreground font-body text-center mb-8">
              Enter your email and we'll send you a reset link
            </p>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="font-body"
                />
              </div>
              <Button
                type="submit"
                variant="warm"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground font-body mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;