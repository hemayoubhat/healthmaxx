'use client';
import { useState } from 'react';
import OnboardingForm from '../components/OnboardingForm';

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    
      const data = await res.json();
console.log('API response:', data);
if (!data.macros) {
  alert('Error: ' + (data.error || 'No macros returned'));
  return;
}
setResult(data);
    } catch (err) {
      alert('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-4xl font-bold text-green-400 mb-2">HealthMaxx</h1>
      <p className="text-gray-400 mb-8">Science-based diet & workout plans</p>

      {!result && !loading && (
        <OnboardingForm onSubmit={handleSubmit} />
      )}

      {loading && (
        <div className="text-center">
          <div className="text-green-400 text-2xl animate-pulse">⚡ Generating your plan...</div>
          <p className="text-gray-500 mt-2">Analysing your data with AI</p>
        </div>
      )}

      {result && (
        <div className="w-full max-w-2xl">
          {/* Macro Summary */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Your Daily Targets</h2>
            <div className="grid grid-cols-4 gap-3 text-center">
              <Stat label="Calories" value={`${result.macros.calories}`} unit="kcal" />
              <Stat label="Protein" value={`${result.macros.protein}`} unit="g" />
              <Stat label="Carbs" value={`${result.macros.carbs}`} unit="g" />
              <Stat label="Fat" value={`${result.macros.fat}`} unit="g" />
            </div>
          </div>

          {/* AI Plan */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Your 7-Day Plan</h2>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {result.plan}
            </div>
          </div>

          <button onClick={() => setResult(null)}
            className="w-full border border-zinc-700 text-gray-400 hover:text-white py-3 rounded-xl transition">
            ← Generate New Plan
          </button>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-zinc-800 rounded-xl p-3">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white text-lg font-bold">{value}</p>
      <p className="text-gray-500 text-xs">{unit}</p>
    </div>
  );
}