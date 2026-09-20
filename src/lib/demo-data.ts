import type { Candidate, Draft, Review } from "@/lib/types";

export const demoCandidates: Candidate[] = [
  { id: "c1", title: "The new OWASP Top 10 for LLM applications", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/", source: "OWASP", publishedAt: "2026-09-20T07:30:00Z", topic: "Cybersecurity", status: "new", relevanceScore: 96, credibilityScore: 98, totalScore: 92, excerpt: "A practical overview of the most common risks in large language model applications." },
  { id: "c2", title: "How a small team improved TypeScript build times", url: "https://dev.to/", source: "dev.to", publishedAt: "2026-09-20T05:10:00Z", topic: "Full-stack development", status: "new", relevanceScore: 88, credibilityScore: 72, totalScore: 81, excerpt: "A focused account of profiling, project references, and incremental builds." },
  { id: "c3", title: "Hacker News discussion: secure defaults for APIs", url: "https://news.ycombinator.com/", source: "Hacker News", publishedAt: "2026-09-19T18:00:00Z", topic: "API security", status: "selected", relevanceScore: 89, credibilityScore: 76, totalScore: 82, excerpt: "A practitioner discussion about making authorization failures safer by default." },
];

export const demoDrafts: Draft[] = [{ id: "d1", title: "What I’m taking from the latest LLM security guidance", version: "educational", status: "awaiting_review", qualityScore: 91, warnings: ["Verify any claim about implementation impact against your own project."], sourceTitle: demoCandidates[0].title, sourceUrl: demoCandidates[0].url, provider: "Demo provider", model: "local-fixture", createdAt: "2026-09-20T09:00:00Z", content: "LLM security gets more useful when we stop treating it as a model-only problem.\n\nThe guidance I’m reading keeps pointing back to familiar engineering habits:\n\n• validate inputs at boundaries\n• give tools the minimum permissions they need\n• log decisions without storing sensitive prompts\n\nThat is a helpful frame for someone building full-stack products: the model is one part of the trust boundary, not the entire boundary.\n\nWhat security control would you add first to an AI feature?\n\n#Cybersecurity #AIEngineering" }];

export const demoReview: Review = { overallScore: 91, factualSupport: 94, originality: 95, tone: 92, readability: 90, recommendation: "approve", warnings: ["The sentence about your own reading is safe; it does not claim project experience."], claims: [
  { text: "validate inputs at boundaries", state: "supported", evidence: "OWASP guidance discusses input validation and prompt injection mitigations." },
  { text: "give tools the minimum permissions they need", state: "supported", evidence: "OWASP guidance covers excessive agency and least privilege." },
  { text: "someone building full-stack products", state: "personal_claim" },
] };
