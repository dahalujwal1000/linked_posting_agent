import type { ScoreWeights } from "@/lib/scoring";

export type CandidateStatus = "new" | "selected" | "dismissed" | "duplicate" | "blocked";
export type DraftStatus = "awaiting_review" | "approved" | "rejected" | "scheduled" | "published";
export type Pillar = "projects" | "education" | "industry" | "career";
export type DraftVersionType = "educational" | "opinion" | "discussion";

/** Mirrors the candidate_scores columns so the UI can show the weighted breakdown. */
export interface CandidateScores { relevance: number; freshness: number; value: number; discussion: number; credibility: number; }

export interface Candidate { id: string; title: string; url: string; source: string; publishedAt: string; topic: string; status: CandidateStatus; scores: CandidateScores; totalScore: number; excerpt: string; }

/** Mirrors one row of draft_versions. */
export interface DraftVersion { versionType: DraftVersionType; content: string; }

export interface Draft { id: string; candidateId: string; title: string; status: DraftStatus; qualityScore: number; warnings: string[]; sourceTitle: string; sourceUrl: string; provider: string; model: string; createdAt: string; scheduledFor?: string; versions: DraftVersion[]; }

export interface Review { overallScore: number; factualSupport: number; originality: number; tone: number; readability: number; warnings: string[]; claims: { text: string; state: "supported" | "needs_review" | "personal_claim"; evidence?: string }[]; recommendation: "approve" | "edit"; }

export type SourceKind = "rss" | "hn" | "devto" | "blog";
export interface Source { id: string; name: string; url: string; kind: SourceKind; enabled: boolean; credibilityScore: number; }

export type ScheduleStatus = "pending" | "processing" | "published" | "failed" | "cancelled";
export interface ScheduledPost { id: string; draftId: string; draftTitle: string; scheduledFor: string; timezone: string; status: ScheduleStatus; }

export type PublishMethod = "manual" | "linkedin_api";
export interface PublishedPost { id: string; draftId: string; title: string; finalText: string; method: PublishMethod; status: string; linkedinPostId?: string; linkedinUrl?: string; publishedAt: string; }

export interface EngagementMetrics { id: string; publishedPostId: string; impressions: number; reactions: number; comments: number; reposts: number; recordedAt: string; }

export interface ProviderUsage { id: string; provider: string; model: string; operation: string; latencyMs: number; inputTokens: number; outputTokens: number; retryCount: number; errorType?: string; createdAt: string; }

export interface AgentRun { id: string; jobType: string; status: "running" | "completed" | "failed" | "skipped"; candidatesFound: number; draftsCreated: number; startedAt: string; completedAt?: string; errorMessage?: string; }

export interface UserSettings {
  topics: string[];
  pillarWeights: Record<Pillar, number>;
  scoringWeights: ScoreWeights;
  blockedDomains: string[];
  allowedDomains: string[];
  maxArticleAgeDays: number;
  timezone: string;
  tone: string;
  postLength: "short" | "medium" | "long";
  hashtagCount: number;
  emojiLevel: number;
  approvalRequired: boolean;
  paused: boolean;
  providerOrder: string[];
}
