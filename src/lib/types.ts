export type CandidateStatus = "new" | "selected" | "dismissed" | "duplicate" | "blocked";
export type DraftStatus = "awaiting_review" | "approved" | "rejected" | "scheduled" | "published";
export type Pillar = "projects" | "education" | "industry" | "career";
export type DraftVersionType = "educational" | "opinion" | "discussion";

export interface Candidate { id: string; title: string; url: string; source: string; publishedAt: string; topic: string; status: CandidateStatus; relevanceScore: number; credibilityScore: number; totalScore: number; excerpt: string; }
export interface Draft { id: string; title: string; content: string; version: DraftVersionType; status: DraftStatus; qualityScore: number; warnings: string[]; sourceTitle: string; sourceUrl: string; provider: string; model: string; createdAt: string; scheduledFor?: string; }
export interface Review { overallScore: number; factualSupport: number; originality: number; tone: number; readability: number; warnings: string[]; claims: { text: string; state: "supported" | "needs_review" | "personal_claim"; evidence?: string }[]; recommendation: "approve" | "edit"; }
