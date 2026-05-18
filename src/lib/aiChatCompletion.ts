type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type ProviderConfig = {
  endpoint: string;
  apiKey: string;
  model: string;
  headers: Record<string, string>;
};

function resolveProviderConfig(): ProviderConfig {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const deepSeekKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (openRouterKey) {
    const siteUrl = process.env.OPENROUTER_SITE_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'http://localhost:3000';
    const appName = process.env.OPENROUTER_APP_NAME?.trim() || 'ATSCURRICULOR';

    return {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: openRouterKey,
      model: process.env.OPENROUTER_MODEL?.trim() || process.env.DEEPSEEK_MODEL?.trim() || 'deepseek/deepseek-v4-flash',
      headers: {
        'HTTP-Referer': siteUrl,
        'X-Title': appName,
      },
    };
  }

  if (deepSeekKey) {
    return {
      endpoint: 'https://api.deepseek.com/chat/completions',
      apiKey: deepSeekKey,
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash',
      headers: {},
    };
  }

  throw new Error('Configure OPENROUTER_API_KEY ou DEEPSEEK_API_KEY no ambiente.');
}

export async function requestChatCompletion(prompt: string): Promise<string> {
  const { endpoint, apiKey, model, headers } = resolveProviderConfig();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Falha ao consultar o provedor de IA (${response.status}). ${errorBody || 'Sem detalhes adicionais.'}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Resposta inesperada do provedor de IA.');
  }

  return text.trim();
}