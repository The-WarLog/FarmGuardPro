import React, { useState } from 'react';
import { Leaf, LogIn, UserPlus } from 'lucide-react';

const AuthPanel = ({ onLogin, onRegister, language = 'english' }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHindi = language === 'hindi';

  const resetError = () => setError('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetError();

    if (!email.trim() || !password.trim() || (mode === 'register' && !name.trim())) {
      setError(isHindi ? 'कृपया सभी जरूरी जानकारी भरें।' : 'Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await onLogin({ email: email.trim(), password });
      } else {
        await onRegister({ name: name.trim(), email: email.trim(), password });
      }
    } catch (err) {
      setError(err?.message || (isHindi ? 'ऑथेंटिकेशन विफल हुआ।' : 'Authentication failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 via-green-50 to-teal-50">
      <div className="w-full max-w-md card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">FarmGuard Pro</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isHindi ? 'अपने खाते से लॉगिन करें' : 'Sign in to your account'}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetError();
            }}
            className={`rounded-md py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-green-700 shadow' : 'text-gray-600'}`}
          >
            <span className="inline-flex items-center gap-1">
              <LogIn className="h-4 w-4" /> {isHindi ? 'लॉगिन' : 'Login'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              resetError();
            }}
            className={`rounded-md py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-white text-green-700 shadow' : 'text-gray-600'}`}
          >
            <span className="inline-flex items-center gap-1">
              <UserPlus className="h-4 w-4" /> {isHindi ? 'साइन अप' : 'Sign up'}
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{isHindi ? 'नाम' : 'Name'}</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isHindi ? 'अपना नाम लिखें' : 'Enter your name'}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{isHindi ? 'पासवर्ड' : 'Password'}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isHindi ? 'पासवर्ड दर्ज करें' : 'Enter your password'}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
            {isSubmitting
              ? (isHindi ? 'प्रोसेस हो रहा है...' : 'Processing...')
              : mode === 'login'
                ? (isHindi ? 'लॉगिन करें' : 'Login')
                : (isHindi ? 'खाता बनाएं' : 'Create account')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPanel;
