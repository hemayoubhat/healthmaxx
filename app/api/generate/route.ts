import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '../../../lib/prompts';
import { calculateTDEE, getMacros } from '../../../lib/tdee';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();
    
    const tdee = calculateTDEE(form);
    const macros = getMacros(tdee, form.goal, parseFloat(form.weight));
    const prompt = buildPrompt({ ...form, macros });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ plan: text, macros });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}