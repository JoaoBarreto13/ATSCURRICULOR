import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/extractPdfText';
import { analyzeWithGemini } from '@/lib/analyzeWithGemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Por favor, envie um arquivo PDF válido.' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'O arquivo deve ter no máximo 5MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resumeText = await extractPdfText(buffer);

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do PDF. O arquivo pode ser um PDF de imagem (escaneado). Use um PDF com texto selecionável.' },
        { status: 422 }
      );
    }

    const analysis = await analyzeWithGemini(resumeText);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('Erro na análise:', error);

    const message = error instanceof Error ? error.message : 'Erro desconhecido durante a análise.';
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'A integração com a IA não está configurada. Defina GEMINI_API_KEY no .env.local.' },
        { status: 500 }
      );
    }

    if (message.includes('JSON válido')) {
      return NextResponse.json(
        { error: 'Não foi possível interpretar a resposta da IA. Tente novamente em instantes.' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar o currículo.' },
      { status: 500 }
    );
  }
}
