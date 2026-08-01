'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', age: '', weight: '', height: '', goal: 'cut' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recs, setRecs] = useState('');
  const [loadingRecs, setLoadingRecs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (p) setForm({ name: p.name || '', age: p.age?.toString() || '', weight: p.weight?.toString() || '', height: p.height?.toString() || '', goal: p.goal || 'cut' });
    });
  }, []);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').upsert({ id: user.id, name: form.name, age: parseInt(form.age), weight: parseFloat(form.weight), height: parseFloat(form.height), goal: form.goal });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getRecs = async () => {
    setLoadingRecs(true);
    try {
      const res = await fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      setRecs(d.recommendations || d.error);
    } finally { setLoadingRecs(false); }
  };

  const bmi = form.weight && form.height ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1) : null;
  const bmiColor = bmi ? (parseFloat(bmi) < 18.5 ? '#00E5FF' : parseFloat(bmi) < 25 ? '#39FF14' : parseFloat(bmi) < 30 ? '#FFE66D' : '#FF6B6B') : '#fff';
  const bmiLabel = bmi ? (parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Healthy' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese') : '';
  const ic = "w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#39FF14]";

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <div className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
      </div>

      {bmi && (
        <div className="px-4 mb-5">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl px-6 py-5">
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-4">BODY METRICS</p>
            <div className="flex justify-around text-center">
              <div>
                <p className="font-bold text-2xl" style={{ color: bmiColor, textShadow: `0 0 12px ${bmiColor}60` }}>{bmi}</p>
                <p className="text-gray-600 text-xs">BMI</p>
                <p className="text-xs mt-1" style={{ color: bmiColor }}>{bmiLabel}</p>
              </div>
              <div className="w-px bg-[#1A1A1A]" />
              <div><p className="font-bold text-2xl text-[#39FF14]">{form.weight}kg</p><p className="text-gray-600 text-xs">Weight</p></div>
              <div className="w-px bg-[#1A1A1A]" />
              <div><p className="font-bold text-2xl text-[#00E5FF]">{form.height}cm</p><p className="text-gray-600 text-xs">Height</p></div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mb-5">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-5 space-y-4">
          <p className="text-gray-500 text-xs font-semibold tracking-widest">PERSONAL INFO</p>
          <input placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={ic} />
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-gray-600 text-xs mb-1">AGE</p><input type="number" placeholder="25" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} className={ic} /></div>
            <div><p className="text-gray-600 text-xs mb-1">WEIGHT kg</p><input type="number" placeholder="75" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} className={ic} /></div>
            <div><p className="text-gray-600 text-xs mb-1">HEIGHT cm</p><input type="number" placeholder="175" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} className={ic} /></div>
          </div>
          <select value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} className={ic}>
            <option value="cut">Cut — Lose Fat</option>
            <option value="bulk">Bulk — Gain Muscle</option>
            <option value="recomp">Recomp — Body Recomposition</option>
            <option value="longevity">Longevity — Health Optimization</option>
          </select>
          <button onClick={save} disabled={saving} className="w-full font-bold py-3 rounded-xl text-black transition"
            style={{ background: saved ? '#16a34a' : '#39FF14', boxShadow: '0 0 16px #39FF1440' }}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="px-4 mb-5">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-5">
          <p className="text-gray-500 text-xs font-semibold tracking-widest mb-4">AI RECOMMENDATIONS</p>
          {recs
            ? <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{recs}</div>
            : <p className="text-gray-600 text-sm">Personalized advice based on your stats, goal, and body metrics.</p>
          }
          <button onClick={getRecs} disabled={loadingRecs}
            className="w-full border font-bold py-3 rounded-xl mt-4 transition text-sm"
            style={{ borderColor: '#A855F7', color: loadingRecs ? '#666' : '#A855F7' }}>
            {loadingRecs ? '⚡ Generating…' : '✨ Get AI Recommendations'}
          </button>
        </div>
      </div>

      <div className="px-4">
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth'); }}
          className="w-full border border-[#1A1A1A] text-gray-600 hover:text-white py-3 rounded-xl transition text-sm">
          Sign Out
        </button>
      </div>
      <Nav />
    </main>
  );
}