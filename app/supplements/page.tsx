'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';

const TC: Record<string, string> = { morning: '#FFE66D', 'pre-workout': '#39FF14', 'post-workout': '#00E5FF', night: '#A855F7' };
const STACK = [
  { name: 'Creatine', dose: '5g', timing: 'post-workout' },
  { name: 'Whey Protein', dose: '25g', timing: 'post-workout' },
  { name: 'Vitamin D3', dose: '5000 IU', timing: 'morning' },
  { name: 'Omega-3', dose: '2g', timing: 'morning' },
  { name: 'Magnesium Glycinate', dose: '400mg', timing: 'night' },
  { name: 'Zinc', dose: '25mg', timing: 'night' },
  { name: 'Caffeine', dose: '200mg', timing: 'pre-workout' },
  { name: 'Beta-Alanine', dose: '3.2g', timing: 'pre-workout' },
];

function Ring({ pct, taken, total }: { pct: number; taken: number; total: number }) {
  const [size, stroke] = [80, 8];
  const r = (size - stroke) / 2;
  const c = r * 2 * Math.PI;
  const off = c - (Math.min(pct, 100) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#1A1A1A" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="#00E5FF" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px #00E5FF)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{taken}/{total}</span>
      </div>
    </div>
  );
}

export default function SuppsPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [custom, setCustom] = useState({ name: '', dose: '', timing: 'morning' });
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      load(data.user.id);
    });
  }, []);

  const load = async (uid: string) => {
    const { data } = await supabase.from('supplement_logs').select('*').eq('user_id', uid).eq('date', today).order('timing');
    setLogs(data || []);
  };

  const toggle = async (id: string, cur: boolean) => {
    await supabase.from('supplement_logs').update({ taken: !cur }).eq('id', id);
    setLogs(p => p.map(l => l.id === id ? { ...l, taken: !cur } : l));
  };

  const add = async (name: string, dose: string, timing: string) => {
    if (!user) return;
    const { data } = await supabase.from('supplement_logs').insert({ user_id: user.id, date: today, name, dose, timing, taken: false }).select().single();
    if (data) setLogs(p => [...p, data]);
    setShowAdd(false);
  };

  const remove = async (id: string) => {
    await supabase.from('supplement_logs').delete().eq('id', id);
    setLogs(p => p.filter(l => l.id !== id));
  };

  const taken = logs.filter(l => l.taken).length;
  const pct = logs.length > 0 ? Math.round((taken / logs.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <div className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Supplements</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Adherence */}
      <div className="px-4 mb-6">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-5 flex items-center gap-5">
          <Ring pct={pct} taken={taken} total={logs.length} />
          <div>
            <p className="text-white font-bold text-xl">{pct}% Today</p>
            <p className="text-gray-500 text-sm">{taken} of {logs.length} taken</p>
            <p className="text-xs mt-2" style={{ color: '#00E5FF' }}>
              {pct === 100 ? '🎉 Perfect adherence!' : pct >= 75 ? '💪 Almost there!' : '⚡ Keep going!'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {['morning', 'pre-workout', 'post-workout', 'night'].map(timing => {
          const group = logs.filter(l => l.timing === timing);
          if (!group.length) return null;
          return (
            <div key={timing}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TC[timing], boxShadow: `0 0 6px ${TC[timing]}` }} />
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: TC[timing] }}>{timing}</p>
              </div>
              <div className="space-y-2">
                {group.map(s => (
                  <div key={s.id} className={`bg-[#0D0D0D] border rounded-2xl px-4 py-3 flex items-center gap-3 transition ${s.taken ? 'border-[#39FF14]/25' : 'border-[#1A1A1A]'}`}>
                    <button onClick={() => toggle(s.id, s.taken)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition flex-shrink-0 ${s.taken ? 'bg-[#39FF14] border-[#39FF14]' : 'border-gray-600'}`}>
                      {s.taken && <span className="text-black text-xs font-bold">✓</span>}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${s.taken ? 'line-through text-gray-500' : 'text-white'}`}>{s.name}</p>
                      <p className="text-gray-600 text-xs">{s.dose}</p>
                    </div>
                    <button onClick={() => remove(s.id)} className="text-gray-700 hover:text-red-400 text-xl">×</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">💊</p>
            <p className="text-gray-400 font-medium">No supplements yet</p>
            <p className="text-gray-600 text-sm">Add your stack below</p>
          </div>
        )}

        <button onClick={() => setShowAdd(true)} className="w-full border border-dashed border-[#1A1A1A] hover:border-[#00E5FF]/40 rounded-2xl py-4 text-gray-600 hover:text-[#00E5FF] transition text-sm">+ Add Supplement</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-t-3xl w-full p-6 max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Add Supplement</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 text-2xl">×</button>
            </div>
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">TIER 1 EVIDENCE-BASED</p>
            <div className="space-y-2 mb-6">
              {STACK.filter(s => !logs.find(l => l.name === s.name)).map(s => (
                <button key={s.name} onClick={() => add(s.name, s.dose, s.timing)}
                  className="w-full text-left bg-[#1A1A1A] hover:bg-[#1F1F1F] rounded-xl px-4 py-3 flex justify-between items-center transition">
                  <div>
                    <p className="text-white text-sm font-medium">{s.name}</p>
                    <p className="text-gray-600 text-xs">{s.dose}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: TC[s.timing], backgroundColor: `${TC[s.timing]}18` }}>{s.timing}</span>
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">CUSTOM</p>
            <div className="space-y-3">
              <input placeholder="Name" value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00E5FF]" />
              <input placeholder="Dose e.g. 5g" value={custom.dose} onChange={e => setCustom(p => ({ ...p, dose: e.target.value }))}
                className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00E5FF]" />
              <select value={custom.timing} onChange={e => setCustom(p => ({ ...p, timing: e.target.value }))}
                className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none">
                {Object.keys(TC).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => { if (custom.name) add(custom.name, custom.dose, custom.timing); }}
                className="w-full font-bold py-3 rounded-xl text-black" style={{ background: '#00E5FF' }}>Add Custom</button>
            </div>
          </div>
        </div>
      )}
      <Nav />
    </main>
  );
}