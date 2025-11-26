'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { sanitizeInput } from '@/lib/utils/sanitize';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const MAX_LOGIN_ATTEMPTS = 5;

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login } = useAuth();
  const router = useRouter();

  // Validación de email en tiempo real
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Email inválido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail) {
      validateEmail(newEmail);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar email antes de enviar
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un email válido');
      return;
    }

    // Rate limiting
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setError('Demasiados intentos fallidos. Por favor, espera unos minutos.');
      return;
    }

    setLoading(true);

    const cleanEmail = sanitizeInput(email);
    const result = await login(cleanEmail, password);

    if (result.success) {
      // Guardar preferencia de "Recordar sesión" si está activa
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      router.push('/dashboard');
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Mensajes de error específicos
      if (result.error?.includes('email') || result.error?.includes('user')) {
        setError('El email no está registrado');
      } else if (result.error?.includes('password')) {
        setError('Contraseña incorrecta');
      } else {
        setError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
      }

      setLoading(false);
    }
  };

  const attemptsRemaining = MAX_LOGIN_ATTEMPTS - loginAttempts;
  const showAttemptWarning = loginAttempts > 0 && attemptsRemaining > 0;

  return (
    <div className="glass-panel w-full animate-fade-in">
      <div className="rounded-[22px] border border-white/40 p-6 sm:p-10">
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
          {/* Email Input con validación */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
                required
                autoComplete="email"
                className={`w-full rounded-2xl border px-4 py-2.5 text-slate-900 shadow-inner transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border-red-300 bg-red-50/50 focus:ring-red-500/70'
                    : 'border-white/60 bg-white/80 focus:ring-blue-500/70 hover:border-blue-200 focus:scale-[1.01]'
                }`}
                placeholder="tu@email.com"
              />
              {emailError && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </div>
              )}
            </div>
          </div>

          {/* Password Input con mostrar/ocultar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => router.push('/auth/reset-password')}
                className="text-xs text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 pr-12 text-slate-900 shadow-inner transition-all duration-200 hover:border-blue-200 focus:scale-[1.01] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Checkbox Recordar sesión */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500/50"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-slate-700">
              Recordar sesión
            </label>
          </div>

          {/* Rate limiting warning */}
          {showAttemptWarning && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {attemptsRemaining} {attemptsRemaining === 1 ? 'intento restante' : 'intentos restantes'}
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-shake">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {/* Submit button con spinner */}
          <button
            type="submit"
            disabled={loading || !!emailError || loginAttempts >= MAX_LOGIN_ATTEMPTS}
            className="btn-gradient w-full px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
