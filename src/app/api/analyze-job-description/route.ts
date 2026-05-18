import { NextRequest, NextResponse } from 'next/server';
import { analyzeJobDescriptionWithDeepSeek } from '@/lib/analyzeJobDescriptionWithDeepSeek';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description = typeof body?.description === 'string' ? body.description.trim() : '';

    if (!description) {
      return NextResponse.json({ error: 'Cole a descrição da vaga para continuar.' }, { status: 400 });
    }

    const analysis = await analyzeJobDescriptionWithDeepSeek(description);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('Erro ao analisar vaga:', error);

    const message = error instanceof Error ? error.message : 'Erro desconhecido ao analisar a vaga.';

    if (message.includes('DEEPSEEK_API_KEY')) {
      return NextResponse.json(
        { error: 'A integração com a IA não está configurada. Defina DEEPSEEK_API_KEY no .env.local.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'Não foi possível extrair os requisitos da vaga.' },
      { status: 500 },
    );
  }
}