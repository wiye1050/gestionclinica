'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { sanitizeInput } from '@/lib/utils/sanitize';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = sanitizeInput(email);
    const result = await login(cleanEmail, password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel w-full">
      <div className="rounded-[22px] border border-white/40 p-10">
        <div className="mb-8 text-center text-slate-900">
          <span className="inline-flex items-center justify-center rounded-full border border-blue-100/80 bg-blue-50/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
            Panel de coordinación
          </span>
          <h1 className="mt-6 text-3xl font-semibold">Gestión Clínica</h1>
          <p className="mt-2 text-slate-500">
            Accede al control completo de pacientes, servicios y operaciones del Instituto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-slate-900">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 text-slate-900 shadow-inner focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 text-slate-900 shadow-inner focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gradient w-full px-6 py-3 text-base">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
