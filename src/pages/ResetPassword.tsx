import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '../lib/api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!token) {
      setError('Invalid reset link — please request a new one');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Password reset!</h1>
            <p className="text-muted-foreground font-body mb-6">
              Your password has been updated. Redirecting to login in 3 seconds...
            </p>
            <Link to="/login">
              <Button variant="warm" className="w-full">Go to Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              Reset password
            </h1>
            <p className="text-muted-foreground font-body text-center mb-8">
              Enter your new password below
            </p>

            {!token && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 mb-4">
                Invalid reset link. Please request a new one.
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-body">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="font-body"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="font-body">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="font-body"
                />
              </div>
              <Button
                type="submit"
                variant="warm"
                className="w-full"
                disabled={isLoading || !token}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground font-body mt-6">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Request a new reset link
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;