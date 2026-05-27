import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types/resume';
import { generateDocxBuffer } from '@/lib/generateDocx';

export async function POST(req: NextRequest) {
  try {
    const data: AnalysisResult = await req.json();

    const docxBuffer = await generateDocxBuffer(data);

    return new NextResponse(docxBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="curriculo-ats.docx"',
      },
    });
  } catch (err) {
    console.error('Erro ao gerar DOCX:', err);

    const message = err instanceof Error ? err.message : 'Erro desconhecido ao gerar DOCX.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
