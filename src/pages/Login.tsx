import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { KID_AVATARS } from '../lib/constants';

type Mode = 'signin' | 'signup';

export function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          avatar_emoji: avatar,
          avatar_color: 'bg-indigo-500',
          role: 'child',
          monthly_cap: 100,
        },
      },
    });
    if (error) setError(error.message);
    else setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account created!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Check your email to confirm your account, then come back and sign in.
          </p>
          <button onClick={() => { setDone(false); setMode('signin'); }} className="btn-primary w-full">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-gray-900">ChoreTracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signin' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="label">Your Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Pick your avatar</label>
                <div className="grid grid-cols-6 gap-2 mt-1">
                  {KID_AVATARS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`text-2xl p-1.5 rounded-xl transition-all ${avatar === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
