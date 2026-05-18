export function buildAtsPrompt(resumeText: string): string {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  return `Você é um sistema ATS (Applicant Tracking System) sênior, similar à Gupy e grandes filtros corporativos.
Objetivo: Analisar o currículo com rigor, identificar falhas de triagem e propor versão mais competitiva para ATS.

⚠️ DATA DE REFERÊNCIA PARA VALIDAÇÃO: ${todayStr}

REGRAS OBRIGATÓRIAS:
1. Responda APENAS com JSON válido, sem markdown ou texto adicional.
2. Não invente dados. Use string vazia ("") ou arrays vazios ([]) quando falta informação.
3. Extraia TODO conteúdo presente no currículo, mesmo que o layout seja não linear, fragmentado ou incomum.
4. Priorize sinais ATS: contato, estrutura, palavras-chave, datas, verbos de ação, métricas.
5. Baseie score em evidências do texto.
6. Máximo 8 issues, ordenadas por gravidade (alta > média > baixa).
7. Preencha todos os campos do JSON mesmo quando ausentes (use string vazia, null ou array vazio conforme o tipo).
8. Para experiências em andamento/vigentes, use "Atual" ou "Presente" no campo 'endDate' — NUNCA use uma data futura.

🚨 VALIDAÇÃO RIGOROSA DE DATAS:
- Data atual de referência: ${todayStr} (equivalente a ${new Date().toLocaleDateString('pt-BR')})
- REJEITE qualquer data de término que seja posterior a HOJE. Se vir "09/2025", "10/2025" ou qualquer mês/ano no futuro, MARQUE como erro de triagem e USE A ALTERNATIVA:
  * Se estiver claro que é cargo vigente (descrição menciona "atualmente", "atualmente trabalho", presente simples), use "Atual"
  * Se houver ambiguidade ou erro óbvio de digitação, use a data de início + 1-2 anos como aproximação conservadora
  * Se for claramente erro (ex: 10/2025 quando hoje é mai/2026), não invente: deixe como "Atual" ou marque na issue
- Sempre valide que startDate <= endDate (ou endDate seja "Atual"/"Presente").
- Se datas forem invertidas, CORRIJA na issue.

INSTRUÇÕES DE EXTRAÇÃO:
- Leia o currículo integralmente, procurando por seções de:
  * Dados pessoais (nome, email, telefone, LinkedIn, localização)
  * Resumo profissional ou objetivo
  * Experiência profissional (empresa, cargo, datas, responsabilidades, conquistas)
  * Educação (instituição, grau, área, ano de conclusão)
  * Habilidades/skills (técnicas e comportamentais)
  * Certificações (cursos, diplomas especializados)
  * Idiomas (idioma e nível de proficiência)
- Se o layout for confuso, reconstrua a seção pelo contexto (ex: se vir empresa-cargo-datas juntos, é experiência).
- NÃO deixe campos vazios se houver conteúdo correspondente no currículo. Exemplo: se há "Experiência: Desenvolvedor na Empresa XYZ de 01/2020 a 12/2023", OBRIGATORIAMENTE extraia isso; não retorne experience: [].

CURRÍCULO:
"""
${resumeText}
"""

Retorne APENAS este JSON (formato exato):

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
        "endDate": "<MM/YYYY ou Atual ou Presente>",
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
        "endDate": "<MM/YYYY ou Atual ou Presente>",
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
✓ Datas consistentes, legíveis e válidas - até 5 pontos (pontos perdidos se houver datas futuras)
✓ Experiência com verbos de ação - até 30 pontos
✓ Resultados quantificáveis - até 15 pontos
✓ Habilidades/Skills clara - até 15 pontos
✓ Educação listada - até 10 pontos
✓ Formatação limpa (sem tabelas, gráficos, emojis) - até 10 pontos

IMPORTANTES:
- Qualquer data futura deve DIMINUIR o atsScore e gerar uma issue de severidade ALTA na categoria "experiência".
- Se o currículo for muito simples ou teste/exemplo, mesmo assim extraia e retorne corretamente — não assuma que é inválido.
- Sempre que não tiver certeza de uma data, use "Atual" para experiência em andamento ou deixe vazio em educação.
`.trim();
}

