'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';
import { useTheme } from '../../components/ThemeProvider';

type Exer = { id: string; name: string; category: string; target_sets: number; rep_min: number; rep_max: number };
type Log  = { id: string; exercise_id: string; exercise_name: string; date: string; weight: number; reps: string; created_at: string };
type Plan = { day_of_week: number; label: string; planned_exercises: string[]; notes: string };

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_LABELS = ['Push Day','Pull Day','Leg Day','Upper Body','Lower Body','Cardio','Full Body','Active Recovery','Rest'];
const CATS = ['Chest','Back','Legs','Shoulders','Arms','Core','Cardio','Other'];
const PRESETS: Record<string,string[]> = {
  Chest:     ['Barbell Bench Press','Incline Bench Press','Dumbbell Flyes','Cable Flyes','Push Ups','Dips'],
  Back:      ['Barbell Row','Pull Ups','Lat Pulldown','Seated Row','Deadlift','Face Pulls','T-Bar Row'],
  Legs:      ['Back Squat','Front Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raises','Bulgarian Split Squat'],
  Shoulders: ['Overhead Press','Lateral Raises','Front Raises','Arnold Press','Cable Lateral Raise','Shrugs'],
  Arms:      ['Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl','Tricep Pushdown','Skull Crushers','Close-Grip Bench'],
  Core:      ['Plank','Cable Crunch','Hanging Leg Raise','Ab Wheel','Russian Twists'],
  Cardio:    ['Running','Cycling','Rowing Machine','Jump Rope','HIIT','Stair Climber','Swimming'],
  Other:     [],
};

// Group consecutive same-weight sessions — matches the user's example format
function groupByWeight(logs: Log[]) {
  const out: { weight: number; sessions: Log[] }[] = [];
  for (const log of logs) {
    const last = out[out.length - 1];
    if (last && last.weight === log.weight) last.sessions.push(log);
    else out.push({ weight: log.weight, sessions: [log] });
  }
  return out;
}

function todayDow() { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; }
function todayStr()  { return new Date().toISOString().split('T')[0]; }

export default function WorkoutPage() {
  const { color } = useTheme();
  const router  = useRouter();
  const [user, setUser]   = useState<any>(null);
  const [tab,  setTab]    = useState<'log'|'history'|'plan'>('log');

  // Library
  const [exercises, setExercises] = useState<Exer[]>([]);
  const [showAddEx, setShowAddEx] = useState(false);
  const [exCat, setExCat]         = useState('Chest');
  const [newEx, setNewEx]         = useState({ name:'', target_sets:4, rep_min:5, rep_max:8 });

  // Logs
  const [allLogs,    setAllLogs]    = useState<Log[]>([]);
  const [todayLogs,  setTodayLogs]  = useState<Log[]>([]);
  const [expandedEx, setExpandedEx] = useState<string|null>(null);
  const [histSearch, setHistSearch] = useState('');

  // Log form
  const [showLog,  setShowLog]  = useState(false);
  const [logDate,  setLogDate]  = useState(todayStr());
  const [logEx,    setLogEx]    = useState('');
  const [logWt,    setLogWt]    = useState('');
  const [logReps,  setLogReps]  = useState<string[]>(['','','','']);
  const [saving,   setSaving]   = useState(false);

  // Plan
  const [weekPlan,   setWeekPlan]   = useState<Plan[]>(DAYS.map((_,i)=>({ day_of_week:i, label: i<5?'Training':'Rest', planned_exercises:[], notes:'' })));
  const [editingDay, setEditingDay] = useState<number|null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      await Promise.all([loadEx(data.user.id), loadLogs(data.user.id), loadPlan(data.user.id)]);
    });
  }, []);

  const loadEx = async (uid: string) => {
    const { data } = await supabase.from('exercises').select('*').eq('user_id', uid).order('name');
    setExercises(data || []);
  };

  const loadLogs = async (uid: string) => {
    const { data } = await supabase.from('lift_logs').select('*').eq('user_id', uid)
      .order('date').order('created_at');
    setAllLogs(data || []);
    setTodayLogs((data||[]).filter((l:Log) => l.date === todayStr()));
  };

  const loadPlan = async (uid: string) => {
    const { data } = await supabase.from('weekly_plan').select('*').eq('user_id', uid);
    if (data?.length) {
      const map: Record<number,any> = {};
      data.forEach((d:any) => { map[d.day_of_week] = d; });
      setWeekPlan(DAYS.map((_,i) => map[i] || { day_of_week:i, label: i<5?'Training':'Rest', planned_exercises:[], notes:'' }));
    }
  };

  const addExercise = async (name: string) => {
    if (!user || !name) return;
    const { data } = await supabase.from('exercises').insert({
      user_id: user.id, name, category: exCat,
      target_sets: newEx.target_sets, rep_min: newEx.rep_min, rep_max: newEx.rep_max,
    }).select().single();
    if (data) setExercises(p => [...p, data].sort((a,b) => a.name.localeCompare(b.name)));
    setShowAddEx(false);
    setNewEx({ name:'', target_sets:4, rep_min:5, rep_max:8 });
  };

  const deleteExercise = async (id: string) => {
    if (!confirm('Delete this exercise and ALL its history?')) return;
    await supabase.from('lift_logs').delete().eq('exercise_id', id);
    await supabase.from('exercises').delete().eq('id', id);
    setExercises(p => p.filter(e => e.id !== id));
    setAllLogs(p => p.filter(l => l.exercise_id !== id));
    setTodayLogs(p => p.filter(l => l.exercise_id !== id));
  };

  const saveLog = async () => {
    if (!user || !logEx || !logWt) { alert('Select an exercise and enter weight'); return; }
    const reps = logReps.filter(r => r !== '').join('/');
    if (!reps) { alert('Enter reps for at least one set'); return; }
    const ex = exercises.find(e => e.id === logEx);
    setSaving(true);
    const { data } = await supabase.from('lift_logs').insert({
      user_id: user.id, exercise_id: logEx, exercise_name: ex?.name || '',
      date: logDate, weight: parseFloat(logWt), reps,
    }).select().single();
    if (data) {
      const sorted = [...allLogs, data].sort((a,b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
      setAllLogs(sorted);
      if (data.date === todayStr()) setTodayLogs(p => [...p, data]);
    }
    setLogEx(''); setLogWt(''); setLogReps(['','','','']);
    setShowLog(false); setSaving(false);
  };

  const deleteLog = async (id: string) => {
    await supabase.from('lift_logs').delete().eq('id', id);
    setAllLogs(p => p.filter(l => l.id !== id));
    setTodayLogs(p => p.filter(l => l.id !== id));
  };

  const savePlan = async (day: number, updates: Partial<Plan>) => {
    if (!user) return;
    const merged = { ...weekPlan[day], ...updates };
    setWeekPlan(p => p.map((d,i) => i === day ? merged : d));
    await supabase.from('weekly_plan').upsert({
      user_id: user.id, day_of_week: day,
      label: merged.label, planned_exercises: merged.planned_exercises, notes: merged.notes,
    }, { onConflict: 'user_id,day_of_week' });
  };

  const selectedEx = exercises.find(e => e.id === logEx);
  const filteredEx = exercises.filter(e => e.name.toLowerCase().includes(histSearch.toLowerCase()));
  const ic = "bg-[#1A1A1A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none w-full";

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Workout</h1>
        <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-5">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-1 flex gap-1">
          {(['log','history','plan'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition capitalize"
              style={{ background: tab===t ? color : 'transparent', color: tab===t ? '#000' : '#4b5563' }}>
              {t==='log'?'📝 Log':t==='history'?'📊 Progress':'📅 Plan'}
            </button>
          ))}
        </div>
      </div>

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <div className="px-4 space-y-4">
          {/* Today's plan */}
          {weekPlan[todayDow()]?.planned_exercises?.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-widest mb-3" style={{ color }}>
                TODAY — {weekPlan[todayDow()].label?.toUpperCase()}
              </p>
              <div className="flex flex-wrap gap-2">
                {weekPlan[todayDow()].planned_exercises.map((name,i) => {
                  const ex = exercises.find(e => e.name === name);
                  return (
                    <button key={i} onClick={() => { if(ex){ setLogEx(ex.id); setLogReps(Array(ex.target_sets).fill('')); setShowLog(true); } }}
                      className="text-xs bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 px-3 py-1.5 rounded-full transition">
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date + Log button */}
          <div className="flex items-center gap-3">
            <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
              className="flex-1 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none" />
            <button onClick={() => { setLogEx(''); setLogWt(''); setLogReps(['','','','']); setShowLog(true); }}
              className="font-bold px-5 py-2.5 rounded-xl text-black text-sm whitespace-nowrap"
              style={{ background: color, boxShadow: `0 0 16px ${color}50` }}>
              + Log Lift
            </button>
          </div>

          {/* Today's lifts */}
          {todayLogs.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-8 text-center">
              <p className="text-3xl mb-2">🏋️</p>
              <p className="text-gray-500 text-sm">No lifts logged today</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">TODAY'S LIFTS</p>
              {Array.from(new Set(todayLogs.map(l => l.exercise_name))).map(exName => {
                const exLogs = todayLogs.filter(l => l.exercise_name === exName);
                const ex = exercises.find(e => e.name === exName);
                return (
                  <div key={exName} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-4 mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-white font-bold">{exName}</p>
                        {ex && <p className="text-gray-600 text-xs">{ex.target_sets}×{ex.rep_min}–{ex.rep_max}</p>}
                      </div>
                      <button onClick={() => { if(ex){ setLogEx(ex.id); setLogReps(Array(ex.target_sets).fill('')); setShowLog(true); } }}
                        className="text-xs px-3 py-1.5 rounded-lg font-bold text-black" style={{ background: color }}>
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {exLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between bg-[#1A1A1A] rounded-xl px-3 py-2.5">
                          <span className="font-bold text-sm w-16" style={{ color }}>{log.weight}kg</span>
                          <span className="text-gray-200 font-mono text-sm flex-1 text-center">{log.reps}</span>
                          <button onClick={() => deleteLog(log.id)} className="text-gray-600 hover:text-red-400 transition text-base">🗑</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="px-4 space-y-3">
          <input placeholder="🔍 Search exercises…" value={histSearch} onChange={e => setHistSearch(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl px-4 py-3 text-white text-sm focus:outline-none" />

          {filteredEx.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">No exercises yet</p>
              <button onClick={() => setShowAddEx(true)} className="mt-2 font-bold text-sm" style={{ color }}>+ Add Exercise</button>
            </div>
          )}

          {filteredEx.map(ex => {
            const logs   = allLogs.filter(l => l.exercise_id === ex.id);
            const groups = groupByWeight(logs);
            const expanded = expandedEx === ex.id;
            const maxWt  = logs.length > 0 ? Math.max(...logs.map(l => l.weight)) : 0;
            const totalSessions = logs.length;

            return (
              <div key={ex.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <button onClick={() => setExpandedEx(expanded ? null : ex.id)} className="flex-1 text-left">
                    <p className="text-white font-bold">{ex.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-600">{ex.target_sets}×{ex.rep_min}–{ex.rep_max}</span>
                      {maxWt > 0 && <span className="text-xs font-bold" style={{ color }}>🔥 {maxWt}kg PR</span>}
                      <span className="text-xs text-gray-600">{totalSessions} sessions</span>
                    </div>
                  </button>
                  <button onClick={() => { setLogEx(ex.id); setLogReps(Array(ex.target_sets).fill('')); setShowLog(true); setTab('log'); }}
                    className="text-xs px-3 py-1.5 rounded-lg font-bold text-black flex-shrink-0" style={{ background: color }}>
                    + Log
                  </button>
                  <button onClick={() => deleteExercise(ex.id)} className="text-gray-700 hover:text-red-400 transition text-base">🗑</button>
                  <span className="text-gray-600 text-sm">{expanded ? '↑' : '↓'}</span>
                </div>

                {/* Progressive overload history */}
                {expanded && (
                  <div className="border-t border-[#1A1A1A] px-4 py-4">
                    {logs.length === 0 ? (
                      <p className="text-gray-600 text-sm text-center py-2">No logs yet</p>
                    ) : (
                      <>
                        {/* Column headers */}
                        <div className="flex gap-4 text-xs text-gray-600 px-1 mb-3">
                          <span className="w-20 flex-shrink-0">WEIGHT</span>
                          <span>SESSIONS — {ex.rep_min}–{ex.rep_max} rep target</span>
                        </div>

                        {/* Grouped rows — matches user's example format exactly */}
                        <div className="space-y-2">
                          {groups.map((group, gi) => {
                            const prevWeights = groups.slice(0, gi).map(g => g.weight);
                            const isPR     = maxWt === group.weight && gi === groups.map(g=>g.weight).lastIndexOf(maxWt);
                            const isDeload = gi > 0 && group.weight < groups[gi - 1].weight;
                            const isProgr  = gi > 0 && group.weight > groups[gi - 1].weight;
                            const wtColor  = isDeload ? '#FFE66D' : isProgr ? color : '#e5e7eb';

                            return (
                              <div key={gi} className="flex items-start gap-4 py-2 border-b border-[#141414]">
                                {/* Weight label */}
                                <div className="w-20 flex-shrink-0 flex items-center gap-1.5 pt-1">
                                  <span className="font-bold text-sm" style={{ color: wtColor }}>
                                    {group.weight}kg
                                  </span>
                                  {isProgr  && <span className="text-xs" style={{ color }}>↑</span>}
                                  {isDeload && <span className="text-xs text-yellow-400">↓</span>}
                                  {isPR     && <span className="text-xs">🔥</span>}
                                </div>

                                {/* Session bubbles */}
                                <div className="flex flex-wrap gap-2 flex-1">
                                  {group.sessions.map((log) => {
                                    // Check if all sets hit target
                                    const repsArr = log.reps.split('/').map(Number);
                                    const allHit  = repsArr.every(r => r >= ex.rep_max);
                                    const anyMiss = repsArr.some(r => r < ex.rep_min);
                                    const bubbleColor = allHit ? `${color}25` : anyMiss ? '#ff3b3b18' : '#1A1A1A';
                                    const textColor   = allHit ? color : anyMiss ? '#ff6b6b' : '#d1d5db';
                                    return (
                                      <div key={log.id} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                                        style={{ background: bubbleColor }}>
                                        <span className="font-mono text-sm font-medium" style={{ color: textColor }}>
                                          {log.reps}
                                        </span>
                                        <span className="text-gray-600 text-xs">
                                          {new Date(log.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                                        </span>
                                        <button onClick={() => deleteLog(log.id)}
                                          className="text-gray-700 hover:text-red-400 transition text-xs ml-0.5">×</button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 mt-3 text-xs text-gray-600">
                          <span style={{ color }} className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ background: `${color}30` }} /> All sets hit</span>
                          <span className="text-red-400 flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-900" /> Below target</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={() => setShowAddEx(true)}
            className="w-full border border-dashed border-[#1A1A1A] rounded-2xl py-4 text-gray-600 text-sm transition"
            onMouseEnter={e => e.currentTarget.style.color = color}
            onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
            + Add Exercise to Library
          </button>
        </div>
      )}

      {/* ── PLAN TAB ── */}
      {tab === 'plan' && (
        <div className="px-4 space-y-3">
          <p className="text-gray-500 text-xs">Set your weekly training schedule. Tap Edit to configure each day.</p>
          {DAYS.map((day, i) => {
            const plan    = weekPlan[i];
            const isToday = i === todayDow();
            const editing = editingDay === i;
            return (
              <div key={i} className="bg-[#0D0D0D] border rounded-2xl overflow-hidden transition"
                style={{ borderColor: isToday ? `${color}50` : '#1A1A1A' }}>
                {/* Row */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold w-8" style={{ color: isToday ? color : '#6b7280' }}>{day}</span>
                    {isToday && <span className="text-xs px-2 py-0.5 rounded-full text-black font-bold" style={{ background: color }}>Today</span>}
                    <span className="text-white text-sm">{plan.label || 'Rest'}</span>
                  </div>
                  <button onClick={() => setEditingDay(editing ? null : i)}
                    className="text-gray-600 hover:text-white text-xs bg-[#1A1A1A] hover:bg-[#252525] px-3 py-1 rounded-lg transition">
                    {editing ? 'Done ✓' : 'Edit'}
                  </button>
                </div>

                {/* Chips when not editing */}
                {!editing && plan.planned_exercises?.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {plan.planned_exercises.map((n,j) => (
                      <span key={j} className="text-xs bg-[#1A1A1A] text-gray-500 px-2.5 py-1 rounded-full">{n}</span>
                    ))}
                    {plan.notes ? <span className="text-xs text-gray-600 italic px-2">{plan.notes}</span> : null}
                  </div>
                )}

                {/* Edit panel */}
                {editing && (
                  <div className="border-t border-[#1A1A1A] px-4 py-4 space-y-4">
                    {/* Day type */}
                    <div>
                      <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">DAY TYPE</p>
                      <div className="flex flex-wrap gap-2">
                        {DAY_LABELS.map(label => (
                          <button key={label} onClick={() => savePlan(i,{label})}
                            className="text-xs px-3 py-1.5 rounded-full transition"
                            style={{ background: plan.label===label ? color : '#1A1A1A', color: plan.label===label ? '#000' : '#9ca3af' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exercises */}
                    <div>
                      <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">EXERCISES</p>
                      {plan.planned_exercises?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {plan.planned_exercises.map((n,j) => (
                            <span key={j} className="text-xs bg-[#1A1A1A] text-gray-300 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                              {n}
                              <button onClick={() => savePlan(i,{planned_exercises: plan.planned_exercises.filter((_,idx) => idx!==j)})}
                                className="text-gray-600 hover:text-red-400">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1 max-h-44 overflow-y-auto">
                        {exercises.filter(e => !plan.planned_exercises?.includes(e.name)).map(ex => (
                          <button key={ex.id} onClick={() => savePlan(i,{planned_exercises:[...(plan.planned_exercises||[]),ex.name]})}
                            className="w-full text-left text-xs bg-[#141414] hover:bg-[#1A1A1A] text-gray-400 px-3 py-2 rounded-lg transition">
                            + {ex.name} <span className="text-gray-600">{ex.target_sets}×{ex.rep_min}–{ex.rep_max}</span>
                          </button>
                        ))}
                        {exercises.length === 0 && <p className="text-gray-600 text-xs">Add exercises in Progress tab first</p>}
                      </div>
                    </div>

                    {/* Notes */}
                    <input placeholder="Notes e.g. Zone 2 cardio 40min" value={plan.notes||''}
                      onChange={e => savePlan(i,{notes:e.target.value})}
                      className="w-full bg-[#141414] rounded-xl px-3 py-2 text-white text-xs focus:outline-none" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOG FORM MODAL ── */}
      {showLog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-t-3xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Log a Lift</h3>
              <button onClick={() => setShowLog(false)} className="text-gray-500 text-2xl w-8 h-8">×</button>
            </div>

            {/* Exercise selector */}
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">EXERCISE</p>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-4">
              {exercises.map(ex => (
                <button key={ex.id} onClick={() => { setLogEx(ex.id); setLogReps(Array(ex.target_sets).fill('')); }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm flex justify-between items-center transition"
                  style={{ background: logEx===ex.id ? `${color}20` : '#1A1A1A', borderLeft: `3px solid ${logEx===ex.id ? color : 'transparent'}` }}>
                  <span className="text-white">{ex.name}</span>
                  <span className="text-gray-600 text-xs">{ex.target_sets}×{ex.rep_min}–{ex.rep_max}</span>
                </button>
              ))}
              {exercises.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-3">No exercises — add them in Progress tab</p>
              )}
            </div>

            {selectedEx && (
              <>
                {/* Date */}
                <div className="mb-4">
                  <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">DATE</p>
                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none" />
                </div>

                {/* Weight */}
                <div className="mb-4">
                  <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">WEIGHT (kg)</p>
                  <input type="number" step="0.5" placeholder="e.g. 20" value={logWt}
                    onChange={e => setLogWt(e.target.value)} autoFocus
                    className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-white text-2xl font-bold text-center focus:outline-none"
                    style={{ caretColor: color }} />
                </div>

                {/* Reps per set */}
                <div className="mb-5">
                  <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">
                    REPS PER SET — target {selectedEx.rep_min}–{selectedEx.rep_max}
                  </p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedEx.target_sets}, 1fr)` }}>
                    {logReps.map((r, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-gray-600 text-xs">Set {i+1}</span>
                        <input type="number" placeholder={selectedEx.rep_max.toString()} value={r}
                          onChange={e => { const n=[...logReps]; n[i]=e.target.value; setLogReps(n); }}
                          className="w-full bg-[#1A1A1A] rounded-xl py-3 text-white text-xl font-bold text-center focus:outline-none"
                          style={{ caretColor: color }} />
                      </div>
                    ))}
                  </div>

                  {/* Live preview — exactly in the user's format */}
                  {logWt && logReps.some(r=>r) && (
                    <div className="mt-3 bg-[#141414] rounded-xl px-4 py-3 text-center">
                      <span className="font-bold text-lg" style={{ color }}>{logWt}kg</span>
                      <span className="text-gray-200 font-mono text-lg ml-3">
                        {logReps.filter(r=>r).join('/')}
                      </span>
                    </div>
                  )}
                </div>

                <button onClick={saveLog} disabled={saving}
                  className="w-full font-bold py-4 rounded-xl text-black text-base"
                  style={{ background: color, boxShadow: `0 0 20px ${color}50` }}>
                  {saving ? 'Saving…' : 'Save Lift ✓'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADD EXERCISE MODAL ── */}
      {showAddEx && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-t-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Add to Library</h3>
              <button onClick={() => setShowAddEx(false)} className="text-gray-500 text-2xl">×</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {CATS.map(cat => (
                <button key={cat} onClick={() => setExCat(cat)}
                  className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition"
                  style={{ background: exCat===cat ? color : '#1A1A1A', color: exCat===cat ? '#000' : '#9ca3af' }}>
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">PRESETS</p>
            <div className="space-y-1 mb-5">
              {(PRESETS[exCat]||[]).filter(n => !exercises.find(e=>e.name===n)).map(name => (
                <button key={name} onClick={() => { setNewEx(p=>({...p,name})); addExercise(name); }}
                  className="w-full text-left bg-[#1A1A1A] hover:bg-[#1F1F1F] rounded-xl px-4 py-2.5 text-white text-sm transition">
                  {name}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs font-semibold tracking-widest mb-2">CUSTOM</p>
            <div className="space-y-3">
              <input placeholder="Exercise name" value={newEx.name} onChange={e => setNewEx(p=>({...p,name:e.target.value}))} className={ic} />
              <div className="grid grid-cols-3 gap-2">
                <div><p className="text-gray-600 text-xs mb-1">Sets</p>
                  <input type="number" value={newEx.target_sets} onChange={e=>setNewEx(p=>({...p,target_sets:parseInt(e.target.value)||4}))} className={ic} /></div>
                <div><p className="text-gray-600 text-xs mb-1">Rep Min</p>
                  <input type="number" value={newEx.rep_min} onChange={e=>setNewEx(p=>({...p,rep_min:parseInt(e.target.value)||5}))} className={ic} /></div>
                <div><p className="text-gray-600 text-xs mb-1">Rep Max</p>
                  <input type="number" value={newEx.rep_max} onChange={e=>setNewEx(p=>({...p,rep_max:parseInt(e.target.value)||8}))} className={ic} /></div>
              </div>
              <button onClick={() => addExercise(newEx.name)} disabled={!newEx.name}
                className="w-full font-bold py-3 rounded-xl text-black" style={{ background: color }}>
                Add to Library
              </button>
            </div>
          </div>
        </div>
      )}
      <Nav />
    </main>
  );
}