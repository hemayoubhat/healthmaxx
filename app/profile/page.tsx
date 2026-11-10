'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingForm from '../components/OnboardingForm';
import PlanDisplay from '../components/PlanDisplay';
import Nav from '../components/Nav';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../lib/useSubscription';

export default function Home() {
  const { color } = useTheme();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [plansGenerated, setPlansGenerated] = useState(0);
  const router = useRouter();
  const { isPro } = useSubscription(user?.id || null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchPlans(data.user.id);
    });
    setPlansGenerated(parseInt(localStorage.getItem('plansGenerated') || '0'));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) alert('🎉 Welcome to HealthMaxx Pro!');
  }, []);

  const fetchPlans = async (userId: string) => {
    const { data } = await supabase.from('plans').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false });
    setSavedPlans(data || []);
  };

  const handleCheckout = async () => {
    if (!user) { router.push('/auth'); return; }
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  const handleSubmit = async (form: any) => {
    if (!isPro) {
      if (!user && plansGenerated >= 1) { router.push('/auth'); return; }
      if (user && plansGenerated >= 2) {
        alert('Upgrade to Pro for unlimited plans!');
        handleCheckout();
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.macros) { alert('Error: ' + (data.error || 'No plan returned')); return; }

      setResult(data);
      const newCount = plansGenerated + 1;
      setPlansGenerated(newCount);
      localStorage.setItem('plansGenerated', newCount.toString());

      if (user) {
        await supabase.from('plans').insert({
          user_id: user.id, goal: form.goal,
          calories: data.macros.calories, protein: data.macros.protein,
          carbs: data.macros.carbs, fat: data.macros.fat, plan_text: data.plan,
        });
        fetchPlans(user.id);
      }
    } catch {
      alert('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 pt-12 pb-40">

      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color }}>HealthMaxx</h1>
          <p className="text-gray-500 text-sm">Science-based plans</p>
        </div>
        <div className="flex items-center gap-3">
          {isPro && (
            <span className="text-black text-xs font-bold px-2 py-1 rounded-full" style={{ background: color }}>PRO</span>
          )}
          {!user && (
            <button onClick={() => router.push('/auth')}
              className="font-bold px-4 py-2 rounded-xl text-sm text-black"
              style={{ background: color, boxShadow: `0 0 16px ${color}40` }}>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Pro Banner */}
      {!isPro && !result && !loading && (
        <div className="w-full max-w-2xl bg-[#0D0D0D] rounded-3xl p-4 mb-6 flex justify-between items-center"
          style={{ border: `1px solid ${color}40` }}>
          <div>
            <p className="text-white font-semibold text-sm">HealthMaxx Pro — $9.99/mo</p>
            <p className="text-gray-500 text-xs mt-0.5">Unlimited plans · Save history · Priority AI</p>
          </div>
          <button onClick={handleCheckout}
            className="font-bold px-4 py-2 rounded-xl text-sm text-black whitespace-nowrap"
            style={{ background: color }}>
            Upgrade →
          </button>
        </div>
      )}

      {/* Saved Plans */}
      {user && savedPlans.length > 0 && !result && !loading && (
        <div className="w-full max-w-2xl mb-8">
          <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">SAVED PLANS</p>
          <div className="space-y-2">
            {savedPlans.map((p) => (
              <div key={p.id}
                onClick={() => setResult({ plan: p.plan_text, macros: { calories: p.calories, protein: p.protein, carbs: p.carbs, fat: p.fat } })}
                className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl px-4 py-3 flex justify-between items-center cursor-pointer transition"
                onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A1A1A')}>
                <div>
                  <span className="text-white capitalize font-medium text-sm">{p.goal} Plan</span>
                  <span className="text-gray-600 text-xs ml-3">{p.calories} kcal · {p.protein}g protein</span>
                </div>
                <span className="text-gray-600 text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* States */}
      {!result && !loading && <OnboardingForm onSubmit={handleSubmit} />}

      {loading && (
        <div className="text-center space-y-3 mt-12">
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl animate-pulse"
            style={{ border: `2px solid ${color}`, boxShadow: `0 0 24px ${color}60` }}>⚡</div>
          <p className="text-white font-semibold">Generating your plan…</p>
          <p className="text-gray-500 text-sm">Analysing data · Calculating macros · Building schedule</p>
        </div>
      )}

      {result && (
        <PlanDisplay plan={result.plan} macros={result.macros} onReset={() => setResult(null)} />
      )}

      <Nav />
    </main>
  );
}