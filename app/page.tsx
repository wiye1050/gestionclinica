'use client';

//* removed unused useState */
import LoginForm from '@/components/auth/LoginForm';

export default function HomePage() {
  return (
    <div className="app-shell app-shell--hero">
      <div className="app-shell__content flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center text-white drop-shadow-lg">
            <p className="text-sm tracking-[0.4em] uppercase text-white/70">Instituto Ordóñez</p>
            <h1 className="mt-2 text-4xl font-semibold">Gestión Clínica Integral</h1>
            <p className="mt-1 text-white/80">Medicina Regenerativa y Traumatología</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
