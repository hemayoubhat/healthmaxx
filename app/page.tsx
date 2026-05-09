'use client';
import { useState } from 'react';
import OnboardingForm from '../components/OnboardingForm';
import PlanDisplay from '../components/PlanDisplay';

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
      if (!data.macros) {
        alert('Error: ' + (data.error || 'No plan returned'));
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

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-400">HealthMaxx</h1>
        <p className="text-gray-400 mt-2">AI-powered diet & workout plans — built on science</p>
      </div>

      {/* States */}
      {!result && !loading && (
        <OnboardingForm onSubmit={handleSubmit} />
      )}

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

    </main>
  );
}