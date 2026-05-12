export function buildAtsPrompt(resumeText: string): string {
  return `Você é um sistema ATS (Applicant Tracking System) sênior, similar à Gupy e grandes filtros corporativos.
Objetivo: Analisar o currículo com rigor, identificar falhas de triagem e propor versão mais competitiva para ATS.

REGRAS OBRIGATÓRIAS:
1. Responda APENAS com JSON válido, sem markdown ou texto adicional
2. Não invente dados. Use string vazia ou arrays vazios quando falta informação
3. Priorize sinais ATS: contato, estrutura, palavras-chave, datas, verbos de ação, métricas
4. Baseie score em evidências do texto
5. Máximo 8 issues, ordenadas por gravidade
6. Preencha todos os campos mesmo quando ausentes

CURRÍCULO:
"""
${resumeText}
"""

Retorne APENAS este JSON:

{
  "atsScore": <número 0-100>,
  "issues": [
    {
      "category": "<formatação|palavras-chave|estrutura|contato|experiência|educação>",
      "severity": "<alta|média|baixa>",
      "description": "<problema encontrado>",
      "suggestion": "<recomendação de correção>"
    }
  ],
  "extractedData": {
    "name": "<nome completo extraído>",
    "email": "<email ou empty string>",
    "phone": "<telefone ou empty string>",
    "linkedin": "<URL LinkedIn ou null>",
    "location": "<cidade/país ou empty string>",
    "birthDate": "<YYYY-MM-DD se disponível, senão empty string>",
    "age": "<idade em anos como número ou null>",
    "summary": "<resumo profissional 2-3 linhas ou empty string>",
    "skills": ["<habilidade1>", "<habilidade2>"],
    "experience": [
      {
        "company": "<empresa>",
        "role": "<cargo>",
        "startDate": "<MM/YYYY>",
        "endDate": "<MM/YYYY ou Atual>",
        "description": "<descrição geral ou empty string>",
        "bulletPoints": ["<Verbo ação + resultado>", "<Verbo ação + métrica>"]
      }
    ],
    "education": [
      {
        "institution": "<instituição>",
        "degree": "<grau - Bachelor/Master/PhD>",
        "field": "<área de estudo>",
        "graduationYear": "<YYYY>"
      }
    ],
    "certifications": ["<certificação1>", "<certificação2>"],
    "languages": [
      {
        "language": "<idioma>",
        "level": "<Básico|Intermediário|Avançado|Fluente|Nativo>"
      }
    ]
  },
  "correctedResume": {
    "summary": "<resumo reescrito ATS-friendly, orientado a impacto>",
    "experienceRewritten": [
      {
        "company": "<empresa>",
        "role": "<cargo>",
        "startDate": "<MM/YYYY>",
        "endDate": "<MM/YYYY ou Atual>",
        "description": "<descrição>",
        "bulletPoints": [
          "<• Verbo forte + resultado mensurável ex: Aumentei vendas 30%>",
          "<• Ação + métrica ex: Liderou equipe de 5 pessoas>"
        ]
      }
    ],
    "suggestedKeywords": ["<palavra-chave1>", "<palavra-chave2>"]
  },
  "generalFeedback": "<feedback geral 2-4 linhas, direto e acionável>"
}

CRITÉRIOS ATS (para calcular score):
✓ Contato completo: email, telefone, LinkedIn - até 5 pontos
✓ Resumo/Objetivo claro - até 10 pontos
✓ Datas consistentes e legíveis - até 5 pontos
✓ Experiência com verbos de ação - até 30 pontos
✓ Resultados quantificáveis - até 15 pontos
✓ Habilidades/Skills clara - até 15 pontos
✓ Educação listada - até 10 pontos
✓ Formatação limpa (sem tabelas, gráficos, emojis) - até 10 pontos
`.trim();
}
