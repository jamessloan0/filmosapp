import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Don't call onClose() here — let onAuthStateChange in AuthContext
        // update isAuthenticated, which causes App.jsx to re-render automatically.
        // The modal will unmount naturally when Landing is replaced by the app.
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email to confirm your account, then log in.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm relative">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">
          {mode === 'login' ? 'Log in to FilmOS' : 'Create your account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1 rounded-xl h-11"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 rounded-xl h-11"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 rounded-xl h-11 font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>

        <p className="text-sm text-zinc-500 text-center mt-4">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            className="text-zinc-900 font-medium hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 text-lg leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
