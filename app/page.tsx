'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingForm from '../components/OnboardingForm';
import PlanDisplay from '../components/PlanDisplay';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchPlans(data.user.id);
    });
  }, []);

  const fetchPlans = async (userId: string) => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setSavedPlans(data || []);
  };

  const handleSubmit = async (form: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.macros) {
        alert('Error: ' + (data.error || 'No plan returned'));
        return;
      }
      setResult(data);

      // Save to Supabase if logged in
      if (user) {
        await supabase.from('plans').insert({
          user_id: user.id,
          goal: form.goal,
          calories: data.macros.calories,
          protein: data.macros.protein,
          carbs: data.macros.carbs,
          fat: data.macros.fat,
          plan_text: data.plan,
        });
        fetchPlans(user.id);
      }
    } catch (err) {
      alert('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSavedPlans([]);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-12">

      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-green-400">HealthMaxx</h1>
          <p className="text-gray-400 text-sm">Science-based plans</p>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{user.email}</span>
            <button onClick={handleSignOut}
              className="text-sm border border-zinc-700 px-3 py-1 rounded-lg text-gray-400 hover:text-white">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={() => router.push('/auth')}
            className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-sm">
            Sign In
          </button>
        )}
      </div>

      {/* Saved Plans */}
      {user && savedPlans.length > 0 && !result && !loading && (
        <div className="w-full max-w-2xl mb-8">
          <h2 className="text-gray-400 text-sm mb-3">📋 Your Saved Plans</h2>
          <div className="space-y-2">
            {savedPlans.map((p) => (
              <div key={p.id}
                onClick={() => setResult({ plan: p.plan_text, macros: { calories: p.calories, protein: p.protein, carbs: p.carbs, fat: p.fat }})}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer hover:border-green-500 transition">
                <div>
                  <span className="text-white capitalize font-medium">{p.goal} Plan</span>
                  <span className="text-gray-500 text-sm ml-3">{p.calories} kcal · {p.protein}g protein</span>
                </div>
                <span className="text-gray-600 text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main States */}
      {!result && !loading && <OnboardingForm onSubmit={handleSubmit} />}

      {loading && (
        <div className="text-center space-y-3">
          <div className="text-green-400 text-3xl animate-pulse">⚡</div>
          <p className="text-white font-semibold">Generating your plan...</p>
          <p className="text-gray-500 text-sm">Analysing data · Calculating macros · Building schedule</p>
        </div>
      )}

      {result && (
        <PlanDisplay
          plan={result.plan}
          macros={result.macros}
          onReset={() => setResult(null)}
        />
      )}

      {!user && !result && !loading && (
        <p className="text-gray-600 text-sm mt-6">
          <button onClick={() => router.push('/auth')} className="text-green-500 hover:underline">Sign in</button> to save your plans
        </p>
      )}

    </main>
  );
}