# ATSCURRICULOR

ATS Resume Analyzer em Next.js para analisar currículos em PDF, extrair dados com Google Gemini, gerar um currículo corrigido e exportar um PDF ATS-friendly.

## Status do projeto

O projeto já está funcional e com a base principal pronta:

- Upload de currículo em PDF.
- Extração de texto do PDF no backend.
- Análise com Google Gemini.
- Score ATS com lista de problemas e sugestões.
- Geração de currículo corrigido.
- Preview do resultado na interface.
- Download do PDF final.
- Comparação com vagas por skills, experiência e faixa etária quando esses dados existirem.

### Validação atual

- `npm run type-check` ok.
- `npm run build` ok.
- `npm run lint` ok.

## Funcionalidades

- Upload de arquivos `.pdf` com validação de tipo e tamanho.
- Extração de texto com `pdf-parse`.
- Análise estruturada com Google Gemini.
- Normalização dos dados retornados pela IA.
- Score ATS de 0 a 100.
- Lista de issues por categoria e severidade.
- Currículo corrigido com resumo, experiências reescritas e palavras-chave sugeridas.
- Geração de PDF ATS-friendly com HTML simples e Puppeteer.
- Compatibilidade com vagas baseada em:
	- skills obrigatórias
	- experiência mínima
	- formação
	- idiomas
	- faixa etária, quando informada na vaga e nos dados extraídos

## Stack

- Next.js 14 com App Router
- TypeScript
- React 18
- Tailwind CSS
- Google Gemini (`@google/genai`)
- `pdf-parse`
- `puppeteer`
- `react-dropzone`

## Como funciona

1. O usuário envia um PDF na página inicial.
2. A rota `/api/analyze` extrai o texto do arquivo.
3. O texto é enviado ao Gemini com um prompt estruturado.
4. A resposta é normalizada para o formato interno do projeto.
5. A tela de resultado mostra score, issues, resumo corrigido e preview.
6. O botão de download chama `/api/generate-pdf` para gerar o PDF final.
7. O usuário também pode testar compatibilidade com vagas usando o comparador interno.

## Rotas da aplicação

### `POST /api/analyze`

Recebe um `FormData` com o arquivo `resume` em PDF.

Responsabilidades:
- validar tipo e tamanho do arquivo
- extrair texto do PDF
- chamar o Gemini
- retornar o `AnalysisResult`

### `POST /api/generate-pdf`

Recebe o `AnalysisResult` em JSON e gera um PDF ATS-friendly com Puppeteer.

## Estrutura principal

```text
src/
	app/
		api/
			analyze/route.ts
			generate-pdf/route.ts
		result/page.tsx
		page.tsx
	components/
		UploadZone.tsx
		ScoreCard.tsx
		IssuesList.tsx
		CorrectedResume.tsx
		DownloadButton.tsx
		JobMatchAnalyzer.tsx
	lib/
		extractPdfText.ts
		analyzeWithGemini.ts
		atsPrompt.ts
		generatePdf.ts
		jobMatcher.ts
		atsValidator.ts
	types/
		resume.ts
```

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz com:

```env
GEMINI_API_KEY=sua_chave_aqui
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Instalação e execução

```bash
npm install
npm run dev
```

Depois acesse `http://localhost:3000`.

## Scripts disponíveis

- `npm run dev` - inicia o servidor de desenvolvimento.
- `npm run build` - gera a build de produção.
- `npm run start` - inicia a aplicação em modo produção.
- `npm run lint` - executa o ESLint.
- `npm run type-check` - executa o TypeScript sem gerar saída.

## Observações importantes

- O projeto usa Google Gemini, não Anthropic Claude.
- O PDF final é gerado com HTML simples para manter legibilidade por ATS.
- O componente de compatibilidade com vagas usa os dados extraídos do currículo e os requisitos informados manualmente.
- A comparação por idade depende de a idade ou data de nascimento estar disponível no currículo e de a vaga informar faixa etária.
- Em ambientes Linux, o Puppeteer pode precisar de dependências do sistema para funcionar corretamente.

## Requisitos do sistema para PDF

Em Ubuntu 24.04, pode ser necessário instalar bibliotecas como:

- `libatk1.0-0t64`
- `libgtk-3-0t64`
- `libx11-xcb1`
- `libxcomposite1`
- `libxdamage1`
- `libxfixes3`
- `libxrandr2`
- `libgbm1`

## Próximos passos sugeridos

- Adicionar exemplos reais de currículo e vaga para teste.
- Criar testes automatizados para o matcher de vagas.
- Melhorar a interface com indicadores de compatibilidade mais visuais.
- Adicionar suporte opcional para outros formatos de arquivo no futuro.