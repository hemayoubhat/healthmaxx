import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '../../../lib/prompts';
import { calculateTDEE, getMacros } from '../../../lib/tdee';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();

    const tdee = calculateTDEE(form);
    const macros = getMacros(tdee, form.goal, parseFloat(form.weight));
    const prompt = buildPrompt({ ...form, macros });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    const text = completion.choices[0]?.message?.content || 'No plan generated';

    return NextResponse.json({ plan: text, macros });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}