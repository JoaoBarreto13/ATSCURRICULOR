import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types/resume';
import { generatePdfBuffer } from '@/lib/generatePdf';

export async function POST(req: NextRequest) {
  try {
    const data: AnalysisResult = await req.json();

    const pdfBuffer = await generatePdfBuffer(data);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="curriculo-ats.pdf"',
      },
    });
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);

    const message = err instanceof Error ? err.message : 'Erro desconhecido ao gerar PDF.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
