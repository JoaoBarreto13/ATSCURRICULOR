import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/extractPdfText';
import { analyzeWithDeepSeek } from '@/lib/analyzeWithDeepSeek';
import { validateATSCompatibility } from '@/lib/atsValidator';

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

    const analysis = await analyzeWithDeepSeek(resumeText);

    // ✅ Aplicar validação final antes de retornar
    const atsValidation = validateATSCompatibility(analysis);
    
    // Se houver problemas sérios de extração (todos os campos principais vazios),
    // retornar erro em vez de parecer que o currículo não tem conteúdo
    const hasExtractedContent = 
      (analysis.extractedData.name && analysis.extractedData.name.trim().length > 0) ||
      (analysis.extractedData.summary && analysis.extractedData.summary.trim().length > 0) ||
      (analysis.extractedData.experience && analysis.extractedData.experience.length > 0) ||
      (analysis.extractedData.education && analysis.extractedData.education.length > 0) ||
      (analysis.extractedData.skills && analysis.extractedData.skills.length > 0);

    if (!hasExtractedContent) {
      return NextResponse.json(
        { 
          error: 'Não foi possível extrair dados estruturados do currículo. O arquivo pode estar vazio, em branco, ou em um formato não suportado. Verifique se o PDF tem conteúdo de texto legível.',
          details: atsValidation.warnings,
        },
        { status: 422 }
      );
    }

    // Adicionar validação final aos warnings do resultado (sem bloquear)
    // Isso permite que o usuário veja o resultado, mas com alertas claros
    const enhancedAnalysis = {
      ...analysis,
      validationWarnings: atsValidation.warnings,
      validationRecommendations: atsValidation.recommendations,
    };

    return NextResponse.json(enhancedAnalysis, { status: 200 });
  } catch (error) {
    console.error('Erro na análise:', error);

    const message = error instanceof Error ? error.message : 'Erro desconhecido durante a análise.';
    if (message.includes('DEEPSEEK_API_KEY')) {
      return NextResponse.json(
        { error: 'A integração com a IA não está configurada. Defina DEEPSEEK_API_KEY no .env.local.' },
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
