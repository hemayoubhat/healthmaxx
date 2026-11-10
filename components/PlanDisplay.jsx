'use client';
import ReactMarkdown from 'react-markdown';
import { useTheme } from './ThemeProvider';

export default function PlanDisplay({ plan, macros, onReset }) {
  const { color } = useTheme();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Macros */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-6 mb-5">
        <p className="text-xs font-semibold tracking-widest mb-4" style={{ color }}>DAILY TARGETS</p>
        <div className="grid grid-cols-4 gap-3 text-center">
          <MacroCard label="Calories" value={macros.calories} unit="kcal" color={color} />
          <MacroCard label="Protein" value={macros.protein} unit="g" color={color} />
          <MacroCard label="Carbs" value={macros.carbs} unit="g" color={color} />
          <MacroCard label="Fat" value={macros.fat} unit="g" color={color} />
        </div>
      </div>

      {/* Plan */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-6 mb-5">
        <p className="text-xs font-semibold tracking-widest mb-4" style={{ color }}>YOUR 7-DAY PLAN</p>
        <div className="text-gray-300 text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              h2: ({ node, ...props }) => (
                <h2 className="font-bold text-base mt-6 mb-2 pb-1 border-b border-[#1A1A1A]" style={{ color }} {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-white font-semibold text-sm mt-4 mb-1" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-1 text-gray-300" {...props} />
              ),
              li: ({ node, ...props }) => <li className="text-gray-300 text-sm" {...props} />,
              p: ({ node, ...props }) => <p className="text-gray-300 text-sm mb-2" {...props} />,
              strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
            }}
          >
            {plan}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => window.print()}
          className="flex-1 bg-[#1A1A1A] hover:bg-[#252525] text-white py-3 rounded-xl transition font-medium text-sm">
          🖨 Print / Save PDF
        </button>
        <button onClick={onReset}
          className="flex-1 border py-3 rounded-xl transition text-sm font-medium"
          style={{ borderColor: color, color }}>
          ← New Plan
        </button>
      </div>
    </div>
  );
}

function MacroCard({ label, value, unit, color }) {
  return (
    <div className="bg-[#141414] rounded-2xl p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-gray-600 text-xs">{unit}</p>
    </div>
  );
}