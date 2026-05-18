import pdfParse from 'pdf-parse';

/**
 * Pré-processa texto extraído do PDF para melhorar legibilidade
 * - Remove quebras de linha excessivas
 * - Reconstrói blocos fragmentados
 * - Limpa espaços em branco desnecessários
 */
function preprocessPdfText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  // 1. Normalizar quebras de linha (CRLF -> LF)
  let processed = rawText.replace(/\r\n/g, '\n');

  // 2. Remover linhas vazias excessivas (mais de 2 seguidas)
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // 3. Remover espaços em branco desnecessários no fim de linhas
  processed = processed
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // 4. Tentar reconstruir linhas quebradas aleatoriamente
  // Se uma linha termina com caractere que sugere continuação, junta com a próxima
  processed = processed
    .split('\n')
    .reduce((acc, line, idx, arr) => {
      if (acc.length === 0) {
        return [line];
      }

      const lastLine = acc[acc.length - 1];
      const currentLine = line.trim();

      // Se a linha anterior termina sem pontuação e a atual não começa com maiúscula,
      // ou se é claramente uma continuação (ex: números, datas), juntar
      const shouldJoin =
        (lastLine.length > 0 &&
          !lastLine.match(/[.!?:;,\-–—]$/) &&
          currentLine.length > 0 &&
          !currentLine.match(/^[A-Z]/)) ||
        currentLine.match(/^[0-9/•\-–—]/);

      if (shouldJoin && lastLine.length > 0) {
        acc[acc.length - 1] = lastLine + ' ' + currentLine;
      } else {
        acc.push(line);
      }

      return acc;
    }, [] as string[])
    .join('\n');

  // 5. Remover linhas que parecem ser artefatos de extração (muito curtas, repetidas)
  const lines = processed.split('\n');
  const seen = new Set<string>();
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return true; // Manter linhas vazias para estrutura
    if (trimmed.length < 2) return false; // Remover linhas muito curtas (ruído)
    if (seen.has(trimmed)) return false; // Remover duplicatas
    seen.add(trimmed);
    return true;
  });

  return filtered.join('\n').trim();
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer as any);
  const rawText = data.text || '';
  return preprocessPdfText(rawText);
}
