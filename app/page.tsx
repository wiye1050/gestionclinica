'use client';

//* removed unused useState */
import LoginForm from '@/components/auth/LoginForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Instituto Ordóñez</h1>
          <p className="text-blue-700">Medicina Regenerativa y Traumatología</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}