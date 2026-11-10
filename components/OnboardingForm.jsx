'use client';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

const inputClass = "w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition";
const labelClass = "block text-xs font-semibold tracking-widest text-gray-500 mb-1.5";

export default function OnboardingForm({ onSubmit }) {
  const { color } = useTheme();
  const [form, setForm] = useState({
    age: '', weight: '', height: '', sex: 'male',
    activityLevel: 'moderate', goal: 'cut', restrictions: '', equipment: 'full gym'
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={submit} className="space-y-4 w-full max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>AGE</label>
          <input name="age" type="number" placeholder="25" onChange={handle}
            className={inputClass} style={{ caretColor: color }} required />
        </div>
        <div>
          <label className={labelClass}>WEIGHT (KG)</label>
          <input name="weight" type="number" placeholder="75" onChange={handle}
            className={inputClass} style={{ caretColor: color }} required />
        </div>
        <div>
          <label className={labelClass}>HEIGHT (CM)</label>
          <input name="height" type="number" placeholder="175" onChange={handle}
            className={inputClass} style={{ caretColor: color }} required />
        </div>
        <div>
          <label className={labelClass}>SEX</label>
          <select name="sex" onChange={handle} className={inputClass}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>ACTIVITY LEVEL</label>
        <select name="activityLevel" onChange={handle} defaultValue="moderate" className={inputClass}>
          <option value="sedentary">Sedentary (desk job, no exercise)</option>
          <option value="light">Light (1–3x/week)</option>
          <option value="moderate">Moderate (3–5x/week)</option>
          <option value="active">Active (6–7x/week)</option>
          <option value="veryActive">Very Active (athlete/physical job)</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>GOAL</label>
        <select name="goal" onChange={handle} className={inputClass}>
          <option value="cut">Cut (lose fat)</option>
          <option value="bulk">Bulk (gain muscle)</option>
          <option value="recomp">Recomp (maintain weight)</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>DIETARY RESTRICTIONS</label>
        <input name="restrictions" placeholder="e.g. vegetarian, no dairy"
          onChange={handle} className={inputClass} style={{ caretColor: color }} />
      </div>

      <div>
        <label className={labelClass}>EQUIPMENT ACCESS</label>
        <select name="equipment" onChange={handle} className={inputClass}>
          <option value="full gym">Full Gym</option>
          <option value="home with dumbbells">Home + Dumbbells</option>
          <option value="bodyweight only">Bodyweight Only</option>
        </select>
      </div>

      <button type="submit"
        className="w-full font-bold py-3.5 rounded-xl text-black transition mb-8"
        style={{ background: color, boxShadow: `0 0 20px ${color}40` }}>
        Calculate & Generate Plan →
      </button>
    </form>
  );
}