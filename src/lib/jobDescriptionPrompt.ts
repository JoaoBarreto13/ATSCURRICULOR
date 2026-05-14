import { JobRequirement } from '@/types/resume';

export function buildJobDescriptionPrompt(description: string): string {
  return `Você é um sistema de extração de requisitos de vagas.
Objetivo: transformar uma descrição de vaga em requisitos estruturados para compatibilidade com currículo.

REGRAS OBRIGATÓRIAS:
1. Responda apenas com JSON válido, sem markdown ou explicações
2. Não invente requisitos que não estejam explícitos ou muito bem inferidos
3. Se um campo não existir, use string vazia, null ou array vazio
4. Priorize skills, anos de experiência, formação e idiomas
5. Se a vaga indicar experiência atual/contínua, deixe isso refletido apenas no texto resumo, não em datas futuras

DESCRIÇÃO DA VAGA:
"""
${description}
"""

Retorne exatamente este JSON:

{
  "summary": "<resumo curto da vaga em 2-4 linhas>",
  "jobRequirement": {
    "title": "<título da vaga>",
    "requiredSkills": ["<skill1>", "<skill2>"],
    "preferredSkills": ["<skill1>", "<skill2>"],
    "minExperienceYears": <número ou null>,
    "minAge": <número ou null>,
    "maxAge": <número ou null>,
    "educationLevel": "<Técnico|Bachelor|Master|PhD ou empty string>",
    "requiredLanguages": [
      {"language": "<idioma>", "minLevel": "<Básico|Intermediário|Avançado|Fluente|Nativo>"}
    ]
  }
}

Critérios de extração:
- Título deve ser curto e direto
- Skills devem ser normalizadas e sem duplicatas
- Experiência mínima deve ser um número inteiro quando houver indicação clara
- Se a vaga não informar idade, deixe minAge/maxAge como null
- Se a vaga não informar idioma, retorne array vazio

`.trim();
}