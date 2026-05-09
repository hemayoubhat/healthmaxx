'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/');
    });
  }, []);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold text-green-400 mb-2">HealthMaxx</h1>
      <p className="text-gray-400 mb-8">Sign in to save your plans</p>
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#22c55e',
                  brandAccent: '#16a34a',
                }
              }
            }
          }}
          providers={[]}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`}
        />
      </div>
    </main>
  );
}