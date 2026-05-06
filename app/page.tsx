'use client';
import { useState } from 'react';
import OnboardingForm from '../components/OnboardingForm';
import { calculateTDEE, getMacros } from '../lib/tdee';

export default function Home() {
  const [result, setResult] = useState(null);

  const handleSubmit = (form) => {
    const tdee = calculateTDEE(form);
    const macros = getMacros(tdee, form.goal, parseFloat(form.weight));
    setResult({ macros, form });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-4xl font-bold text-green-400 mb-2">HealthMaxx</h1>
      <p className="text-gray-400 mb-8">Science-based diet & workout plans</p>

      {!result ? (
        <OnboardingForm onSubmit={handleSubmit} />
      ) : (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-6">Your Daily Targets</h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            <Stat label="Calories" value={`${result.macros.calories} kcal`} />
            <Stat label="Protein" value={`${result.macros.protein}g`} />
            <Stat label="Carbs" value={`${result.macros.carbs}g`} />
            <Stat label="Fat" value={`${result.macros.fat}g`} />
          </div>
          <button onClick={() => setResult(null)}
            className="mt-6 text-sm text-gray-500 hover:text-white underline">
            ← Recalculate
          </button>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-zinc-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}