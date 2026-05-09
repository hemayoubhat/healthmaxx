'use client';
import ReactMarkdown from 'react-markdown';

export default function PlanDisplay({ plan, macros, onReset }) {
  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Macro Cards */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-green-400 mb-4">📊 Your Daily Targets</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <MacroCard label="Calories" value={macros.calories} unit="kcal" />
          <MacroCard label="Protein" value={macros.protein} unit="g" />
          <MacroCard label="Carbs" value={macros.carbs} unit="g" />
          <MacroCard label="Fat" value={macros.fat} unit="g" />
        </div>
      </div>

      {/* AI Plan */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6 prose-custom">
        <h2 className="text-lg font-bold text-green-400 mb-4">🗓 Your 7-Day Plan</h2>
        <div className="text-gray-300 text-sm leading-relaxed markdown-body">
          <ReactMarkdown
            components={{
              h2: ({node, ...props}) => (
                <h2 className="text-green-400 font-bold text-base mt-6 mb-2 border-b border-zinc-700 pb-1" {...props} />
              ),
              h3: ({node, ...props}) => (
                <h3 className="text-white font-semibold text-sm mt-4 mb-1" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="list-disc list-inside space-y-1 text-gray-300" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="text-gray-300 text-sm" {...props} />
              ),
              p: ({node, ...props}) => (
                <p className="text-gray-300 text-sm mb-2" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="text-white font-semibold" {...props} />
              ),
            }}
          >
            {plan}
          </ReactMarkdown>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl transition font-medium">
          🖨 Print / Save PDF
        </button>
        <button
          onClick={onReset}
          className="flex-1 border border-zinc-700 text-gray-400 hover:text-white py-3 rounded-xl transition">
          ← New Plan
        </button>
      </div>

    </div>
  );
}

function MacroCard({ label, value, unit }) {
  return (
    <div className="bg-zinc-800 rounded-xl p-3">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white text-lg font-bold">{value}</p>
      <p className="text-gray-500 text-xs">{unit}</p>
    </div>
  );
}