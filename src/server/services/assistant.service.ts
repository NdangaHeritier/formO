import { faqs, type FaqAudience } from "@/lib/assistant/knowledge";

export type AssistantContext = {
  audience: FaqAudience;
  pathname: string;
};

export type AssistantReply = {
  text: string;
  suggestions: string[];
  href?: string;
  hrefLabel?: string;
};

/**
 * Deterministic responder. This is the only place that will be replaced when a
 * real LLM provider is introduced — the chat route and UI stay unchanged.
 */
export function answerQuestion(
  question: string,
  context: AssistantContext
): AssistantReply {
  const normalized = question.trim().toLowerCase();

  if (/^(hi|hello|hey|yo)\b/.test(normalized)) {
    return {
      text: "Hi — I can help with form submissions, SMTP verification, delivery timing, embedding a form on your site and workspace settings. What are you trying to do?",
      suggestions: [
        "Why are my submissions pending?",
        "How do I embed a form on my website?",
        "How do I verify SMTP?",
      ],
    };
  }

  if (!normalized) {
    return {
      text: "Ask me a question about FormO and I'll use the workspace documentation to answer it.",
      suggestions: faqs.slice(0, 3).map((faq) => faq.question),
    };
  }

  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const scored = faqs
    .map((faq) => {
      const haystack = `${faq.question} ${faq.answer} ${faq.keywords.join(" ")}`.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (word.length < 3) continue;
        if (faq.question.toLowerCase().includes(word)) score += 3;
        else if (faq.keywords.some((keyword) => keyword.includes(word))) score += 2;
        else if (haystack.includes(word)) score += 1;
      }
      if (faq.audiences.includes(context.audience)) score += 1;
      if (context.pathname !== "/" && faq.href === context.pathname) score += 2;
      return { faq, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) {
    return {
      text: "I don't have a specific answer for that yet. I can help with delivery timing, SMTP verification, form embedding, endpoints, audience setup and workspace settings.",
      suggestions: [
        "Why are my submissions pending?",
        "How do I embed a form on my website?",
        "What does 'Managed by your workspace' mean?",
      ],
    };
  }

  const suggestions = scored
    .slice(1, 4)
    .map((entry) => entry.faq.question);

  return {
    text: best.faq.answer,
    suggestions: suggestions.length > 0 ? suggestions : faqs.slice(0, 2).map((faq) => faq.question),
    ...(best.faq.href ? { href: best.faq.href, hrefLabel: best.faq.hrefLabel } : {}),
  };
}
