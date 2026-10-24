import { diffLines, createTwoFilesPatch } from 'diff';

/**
 * Constructs targeted system and user prompts for academic LaTeX editing
 */
function buildPrompt({ action, selectedText, contextText, errorDetails, userPrompt }) {
  const baseInstruction = `You are an expert scientific manuscript editor and LaTeX specialist for academic publications (IEEE, Nature, ACM, Elsevier).
CRITICAL RULES:
1. PRESERVE all LaTeX commands, math notation ($...$, $$...$$, \\begin{equation}...), labels, citations (\\cite{...}), and cross-references (\\ref{...}).
2. NEVER hallucinate or invent new empirical results, data, or citations.
3. Return ONLY the revised replacement LaTeX text. Do NOT wrap in markdown code blocks (\`\`\`latex) unless specifically asked. Do not add introductory conversational filler like "Here is your text:". Return the exact text that should replace the input.`;

  switch (action) {
    case 'proofread':
      return {
        system: baseInstruction,
        user: `Carefully proofread the following LaTeX passage for grammatical accuracy, spelling, typography, and punctuation. Maintain academic rigor and leave mathematical formulas and citations strictly intact:\n\n${selectedText}`
      };

    case 'polish':
      return {
        system: baseInstruction,
        user: `Revise the following LaTeX passage to improve academic tone, conciseness, flow, and scholarly vocabulary while keeping the scientific meaning, equations, and citations 100% intact:\n\n${selectedText}`
      };

    case 'shorten':
      return {
        system: baseInstruction,
        user: `Make the following LaTeX passage significantly more concise, removing redundancy and passive verbosity without removing any substantive scientific claims or equations:\n\n${selectedText}`
      };

    case 'explain_error':
      return {
        system: `You are an expert LaTeX debugger. Analyze the compilation error and suggest a minimal, safe patch.
Return a structured response:
1. Cause of the error in 1-2 clear sentences.
2. The exact corrected LaTeX snippet to replace the erroneous code.`,
        user: `Compiler Error:
${errorDetails || 'LaTeX compilation error'}

Surrounding LaTeX Source:
${contextText || selectedText}`
      };

    case 'expand':
      return {
        system: baseInstruction,
        user: `Elaborate and provide deeper scientific explanation for this passage, maintaining standard academic publication style and existing equations:\n\n${selectedText}\n\nAdditional instructions: ${userPrompt || 'Provide clear methodological detail.'}`
      };

    case 'custom':
    default:
      return {
        system: baseInstruction,
        user: `Context / Source:\n${selectedText || contextText}\n\nUser Instruction: ${userPrompt}`
      };
  }
}

/**
 * Request completion from OpenRouter / OpenAI API
 */
export async function requestAiAssistance({
  action,
  selectedText = '',
  contextText = '',
  errorDetails = '',
  userPrompt = '',
  apiKey,
  baseUrl = 'https://openrouter.ai/api/v1',
  model = 'openai/gpt-6-luna'
}) {
  if (!apiKey) {
    throw new Error('API Key is missing. Please configure your OpenRouter / OpenAI API key in Settings.');
  }

  const { system, user } = buildPrompt({ action, selectedText, contextText, errorDetails, userPrompt });

  const endpoint = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;

  const requestBody = {
    model: model || 'openai/gpt-6-luna',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.3
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:4000',
      'X-Title': 'PrismForge LaTeX Studio'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(errorText);
    } catch {
      parsed = { error: { message: errorText } };
    }

    if (response.status === 402) {
      throw new Error(`OpenRouter Credit Insufficient (402 Payment Required). Model '${model}' requires deposited credits. Please top up your OpenRouter account or switch to another model in Settings.`);
    }

    if (response.status === 429) {
      throw new Error(`Rate limit exceeded (429). Please wait a few moments before trying again.`);
    }

    throw new Error(`AI API Error (${response.status}): ${parsed.error?.message || errorText}`);
  }

  const data = await response.json();
  let aiText = data.choices?.[0]?.message?.content || '';

  // Clean markdown fences if the model wrapped it anyway
  if (aiText.startsWith('```latex') && aiText.endsWith('```')) {
    aiText = aiText.slice(8, -3).trim();
  } else if (aiText.startsWith('```') && aiText.endsWith('```')) {
    aiText = aiText.slice(3, -3).trim();
  }

  // Generate line-by-line diff
  const original = selectedText || contextText;
  const lineDiff = diffLines(original, aiText);

  return {
    action,
    originalText: original,
    proposedText: aiText,
    diff: lineDiff,
    model: data.model || model,
    usage: data.usage || null
  };
}
