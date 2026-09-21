import type {
  AgentRun,
  Candidate,
  Draft,
  EngagementMetrics,
  ProviderUsage,
  PublishedPost,
  Review,
  ScheduledPost,
  Source,
  UserSettings,
} from "@/lib/types";

/**
 * Fixture data for the demo UI. Every shape mirrors a column set from
 * supabase/migrations/202609200001_initial_schema.sql, so these values can be swapped for real
 * queries without changing the components. Replace with the data layer in phase B of the handoff.
 *
 * Candidate totals are the real weighted result of the default scoring weights
 * (relevance 30 / freshness 20 / value 20 / discussion 15 / credibility 15).
 */

export const mockSources: Source[] = [
  { id: "s1", name: "The Pragmatic Engineer", url: "https://newsletter.pragmaticengineer.com/feed", kind: "rss", enabled: true, credibilityScore: 88 },
  { id: "s2", name: "Google Online Security", url: "https://security.googleblog.com/feeds/posts/default", kind: "blog", enabled: true, credibilityScore: 92 },
  { id: "s3", name: "Hacker News", url: "https://hn.algolia.com/api/v1/search", kind: "hn", enabled: true, credibilityScore: 76 },
  { id: "s4", name: "dev.to", url: "https://dev.to/api/articles", kind: "devto", enabled: true, credibilityScore: 72 },
  { id: "s5", name: "OWASP Blog", url: "https://owasp.org/blog/feed.xml", kind: "blog", enabled: true, credibilityScore: 98 },
  { id: "s6", name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", kind: "rss", enabled: false, credibilityScore: 95 },
];

export const mockCandidates: Candidate[] = [
  { id: "c1", title: "The new OWASP Top 10 for LLM applications", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/", source: "OWASP Blog", publishedAt: "2026-09-20T07:30:00Z", topic: "Cybersecurity", status: "new", scores: { relevance: 96, freshness: 88, value: 94, discussion: 72, credibility: 98 }, totalScore: 91, excerpt: "A practical overview of the most common risks in large language model applications, including prompt injection, excessive agency, and insecure output handling." },
  { id: "c2", title: "How a small team cut TypeScript build times by 60%", url: "https://dev.to/example/cut-typescript-build-times", source: "dev.to", publishedAt: "2026-09-20T05:10:00Z", topic: "Full-stack development", status: "new", scores: { relevance: 88, freshness: 92, value: 86, discussion: 68, credibility: 74 }, totalScore: 83, excerpt: "A focused account of profiling, project references, and incremental builds, with the before-and-after numbers they measured." },
  { id: "c3", title: "Hacker News discussion: secure defaults for APIs", url: "https://news.ycombinator.com/item?id=41234567", source: "Hacker News", publishedAt: "2026-09-19T18:00:00Z", topic: "Cybersecurity", status: "selected", scores: { relevance: 90, freshness: 84, value: 88, discussion: 92, credibility: 78 }, totalScore: 87, excerpt: "412 points and 180 comments on making authorization failures fail closed by default instead of silently allowing access." },
  { id: "c4", title: "Shipping a RAG feature without leaking tenant data", url: "https://newsletter.pragmaticengineer.com/p/rag-tenant-isolation", source: "The Pragmatic Engineer", publishedAt: "2026-09-19T09:45:00Z", topic: "AI tooling", status: "new", scores: { relevance: 82, freshness: 96, value: 78, discussion: 84, credibility: 70 }, totalScore: 83, excerpt: "How one team separated retrieval indexes per tenant and what broke first when they did not." },
  { id: "c5", title: "What changed in the latest Node.js LTS release", url: "https://dev.to/example/node-lts-changes", source: "dev.to", publishedAt: "2026-09-18T14:20:00Z", topic: "Full-stack development", status: "duplicate", scores: { relevance: 74, freshness: 90, value: 80, discussion: 62, credibility: 88 }, totalScore: 79, excerpt: "Release notes summary covering the new permission model, test runner updates, and the deprecations worth acting on." },
  { id: "c6", title: "Postmortem: a supply-chain compromise in a popular npm package", url: "https://security.googleblog.com/2026/09/npm-supply-chain-postmortem.html", source: "Google Online Security", publishedAt: "2026-09-14T11:00:00Z", topic: "Cybersecurity", status: "new", scores: { relevance: 92, freshness: 52, value: 90, discussion: 76, credibility: 96 }, totalScore: 82, excerpt: "A detailed timeline of how a maintainer account was taken over and which controls would have detected it earlier." },
  { id: "c7", title: "Junior developers and the AI tooling learning curve", url: "https://news.ycombinator.com/item?id=41234500", source: "Hacker News", publishedAt: "2026-09-20T02:15:00Z", topic: "Career learning", status: "new", scores: { relevance: 68, freshness: 94, value: 72, discussion: 88, credibility: 64 }, totalScore: 76, excerpt: "Commenters disagree on whether AI assistants accelerate fundamentals or hide the gaps that matter later." },
  { id: "c8", title: "Clickbait listicle: 10 AI tools that will replace your job", url: "https://content-farm.example/ai-tools-replace-jobs", source: "Unknown", publishedAt: "2026-09-17T16:40:00Z", topic: "AI tooling", status: "blocked", scores: { relevance: 86, freshness: 76, value: 84, discussion: 58, credibility: 82 }, totalScore: 79, excerpt: "Blocked by the domain rules below: no named sources, no methodology, and a headline that overstates what the tools do." },
];

export const mockDrafts: Draft[] = [
  {
    id: "d1", candidateId: "c1", title: "What the LLM security guidance actually asks of builders", status: "awaiting_review", qualityScore: 91,
    warnings: ["Verify the prompt-injection claim against your own stack before publishing."],
    sourceTitle: "The new OWASP Top 10 for LLM applications", sourceUrl: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
    provider: "gemini", model: "gemini-3.5-flash", createdAt: "2026-09-20T09:00:00Z",
    versions: [
      { versionType: "educational", content: "LLM security stops being a model-only problem once you read the OWASP Top 10 for LLM applications.\n\nThree entries reframed how I look at it:\n\n• prompt injection is an input validation problem\n• excessive agency is a permissions problem\n• insecure output handling is an encoding problem\n\nIf you build full-stack products, most of these risks map onto controls you already know, applied to a new boundary. A model that can call your tools is an untrusted client holding valid credentials.\n\nWhich of these would you test first?" },
      { versionType: "opinion", content: "I am skeptical of treating LLM security as a separate discipline.\n\nReading the OWASP Top 10 for LLM applications, the entries keep landing on familiar ground: validate inputs at boundaries, grant tools the minimum permissions they need, and never treat generated output as trusted code or markup.\n\nWhat is genuinely new is the failure mode, not the control.\n\nThat makes this a permissions design conversation rather than a prompt engineering one, which is a much better place for it to live." },
      { versionType: "discussion", content: "Where should LLM risk live inside a team's process?\n\nThe OWASP Top 10 for LLM applications lists prompt injection, excessive agency, and insecure output handling as distinct risks. As a builder, that raises a practical question: do these get reviewed as part of normal threat modeling, or do they become a prompt-only checklist that nobody owns?\n\nI lean toward folding them into the existing boundary review, because the mitigations overlap heavily with input validation and least privilege.\n\nHow does your team handle it?" },
    ],
  },
  {
    id: "d2", candidateId: "c3", title: "A loud 403 is a bug report. A quiet 200 is a breach.", status: "approved", qualityScore: 88,
    warnings: [],
    sourceTitle: "Hacker News discussion: secure defaults for APIs", sourceUrl: "https://news.ycombinator.com/item?id=41234567",
    provider: "gemini", model: "gemini-3.5-flash", createdAt: "2026-09-19T19:30:00Z", scheduledFor: "2026-09-21T04:15:00Z",
    versions: [
      { versionType: "educational", content: "\"Fail closed\" sounds obvious until you notice how often authorization defaults to allow.\n\nA discussion on secure defaults for APIs made a point worth repeating: when the policy check throws, times out, or returns an unexpected shape, the request should be denied rather than permitted.\n\nThe uncomfortable part is that failing closed breaks things loudly in staging, which is exactly why teams are tempted to fail open.\n\nA loud 403 is a bug report. A quiet 200 is a breach." },
      { versionType: "opinion", content: "Secure defaults are a design decision, not a configuration one.\n\nThe thread on API authorization kept circling one root cause: the default path was allow, and every guard was an exception layered on top of it.\n\nInverting that is cheap early and expensive later, because failing closed surfaces gaps immediately instead of at the worst possible moment.\n\nMy takeaway is that the loud failure is the feature. It is the only signal that your policy layer is actually load-bearing." },
      { versionType: "discussion", content: "If an authorization check fails unexpectedly, should the request be denied or allowed and logged?\n\nA Hacker News thread on secure defaults argued firmly for denying, since a silent allow turns a misconfiguration into a data exposure while a deny turns it into a bug report.\n\nThe counterpoint is reliability: a flaky policy service that fails closed takes the whole product down.\n\nCaching, circuit breakers, and a documented blast radius all came up as middle ground.\n\nHow do you balance the two?" },
    ],
  },
  {
    id: "d3", candidateId: "c4", title: "Your vector store has an authorization model too", status: "scheduled", qualityScore: 85,
    warnings: ["The team's specific index topology is paraphrased; keep the claim general if you publish."],
    sourceTitle: "Shipping a RAG feature without leaking tenant data", sourceUrl: "https://newsletter.pragmaticengineer.com/p/rag-tenant-isolation",
    provider: "gemini", model: "gemini-3.5-flash", createdAt: "2026-09-19T10:15:00Z", scheduledFor: "2026-09-22T04:15:00Z",
    versions: [
      { versionType: "educational", content: "Retrieval augmented generation has a multi-tenancy problem that never shows up in a demo.\n\nA write-up on shipping RAG without leaking tenant data described separating indexes per tenant, then finding that the first thing to break was not retrieval quality but access control on the index itself.\n\nIt is a reminder that adding a vector store adds a datastore with its own authorization model, not just a library.\n\nThe failure is invisible when you test with a single tenant." },
      { versionType: "opinion", content: "The most underrated RAG design decision is where the tenant boundary sits.\n\nReading a team's account of separating retrieval indexes per tenant, the interesting part was not the vector database choice. It was that their first production issue came from index access control, not from relevance.\n\nA vector store is a datastore. It deserves the same tenant isolation review as your primary database.\n\nTreating it as a library is how one customer's text ends up in another customer's prompt." },
      { versionType: "discussion", content: "Does tenant isolation belong in the retrieval layer, the vector store, or the prompt?\n\nA team that shipped RAG described splitting indexes per tenant after finding cross-tenant leakage in their first design, and noted the fix was an access-control change rather than a retrieval-quality one.\n\nThat raises an architectural question: is filtering at query time enough, or does each tenant need a physically separate index?\n\nThe trade-off looks like cost and operational overhead against how much you trust the filter.\n\nWhere do you draw the line?" },
    ],
  },
  {
    id: "d4", candidateId: "c6", title: "What the npm postmortem says about detection, not prevention", status: "awaiting_review", qualityScore: 79,
    warnings: ["Source is older than the freshness window; confirm the details before publishing.", "No direct quote is used, so avoid attributing specific wording to the vendor."],
    sourceTitle: "Postmortem: a supply-chain compromise in a popular npm package", sourceUrl: "https://security.googleblog.com/2026/09/npm-supply-chain-postmortem.html",
    provider: "openrouter", model: "google/gemma-4-31b-it:free", createdAt: "2026-09-14T12:40:00Z",
    versions: [
      { versionType: "educational", content: "The most useful part of a supply-chain postmortem is usually the detection timeline, not the prevention advice.\n\nA published account of an npm package compromise walked through how a maintainer account was taken over and which controls would have caught it earlier.\n\nThe pattern that stood out: publishing credentials outlived the person's involvement in the project, and nothing alerting on an unusual publish looked at behaviour rather than identity.\n\nPrevention advice ages quickly. Detection gaps age slowly." },
      { versionType: "opinion", content: "Supply-chain security advice tends to over-invest in prevention and under-invest in detection.\n\nA postmortem on an npm compromise is a good example. The prevention list is familiar and mostly unimplemented in small projects: pinned versions, provenance, scoped tokens.\n\nWhat actually shortened the exposure window in their account was noticing an anomalous publish, not blocking it up front.\n\nFor a solo developer, the realistic move is to make the noisy thing visible rather than build a fortress nobody maintains." },
      { versionType: "discussion", content: "For a small team, is supply-chain effort better spent on prevention or detection?\n\nA postmortem on an npm package compromise listed the usual preventive controls, but the part that changed the outcome was noticing an unusual publish early.\n\nThat suggests a different allocation: fewer controls, more alerting on behaviour that deviates from the norm.\n\nThe counterargument is that detection without prevention only shortens how long you are compromised.\n\nIf you had one afternoon to spend, which would you pick?" },
    ],
  },
  {
    id: "d5", candidateId: "c2", title: "Build times are a product decision, not a chore", status: "published", qualityScore: 90,
    warnings: [],
    sourceTitle: "How a small team cut TypeScript build times by 60%", sourceUrl: "https://dev.to/example/cut-typescript-build-times",
    provider: "gemini", model: "gemini-3.5-flash", createdAt: "2026-09-18T06:20:00Z",
    versions: [
      { versionType: "educational", content: "A small team documented cutting TypeScript build times by 60%, and the sequence matters more than the techniques.\n\nThey profiled first, then found the cost was concentrated in a handful of large modules, then introduced project references so incremental builds could reuse work.\n\nThe order is the lesson: profile before optimising, and measure again after each change rather than shipping every technique at once.\n\nWhat is your current build time, and when did you last measure it?" },
      { versionType: "opinion", content: "Slow builds are a product decision that most teams never make deliberately.\n\nA write-up from a small team that cut TypeScript build times by 60% showed how much of the win came from profiling rather than from a clever configuration.\n\nThe real cost of a 40-second build is not the 40 seconds. It is how many times a day someone chooses not to run the check.\n\nThat makes build time a proxy for how much verification actually happens on a team." },
      { versionType: "discussion", content: "How much does build time quietly shape your engineering decisions?\n\nA team that cut TypeScript build times by 60% described profiling, finding the cost concentrated in a few large modules, and using project references for incremental builds.\n\nThe interesting question is where the threshold sits: at what build time do people stop running checks locally and start relying on CI?\n\nMy suspicion is that the threshold is lower than most teams assume.\n\nWhat is your number?" },
    ],
  },
  {
    id: "d6", candidateId: "c7", title: "What junior developers actually ask about AI tooling", status: "published", qualityScore: 84,
    warnings: ["The comment count in the source moves; avoid quoting a specific number."],
    sourceTitle: "Junior developers and the AI tooling learning curve", sourceUrl: "https://news.ycombinator.com/item?id=41234500",
    provider: "openrouter", model: "qwen/qwen3.8-27b:free", createdAt: "2026-09-17T03:30:00Z",
    versions: [
      { versionType: "educational", content: "A long comment thread on AI tooling and junior developers kept splitting along the same line.\n\nOne camp argues assistants remove the repetitive work that used to build fluency. The other argues that reading generated code and judging it is itself a skill, and one that older developers had less practice with.\n\nWhat I found useful was the middle position: the tool changes which fundamentals get exercised, not whether they matter.\n\nWhich fundamental do you think it protects, and which does it quietly skip?" },
      { versionType: "opinion", content: "Debates about AI tooling and junior developers usually assume the tooling is uniform, and it is not.\n\nOne comment argued assistants remove the repetition that builds fluency. A reply pointed out that code review is also repetition, and that reviewing generated code exercises it harder.\n\nBoth are describing the same thing from different angles: what changes is which fundamentals stay in daily use.\n\nThat is a curriculum question, not a tooling question, and it is worth answering deliberately." },
      { versionType: "discussion", content: "Which fundamentals does AI tooling protect, and which does it quietly skip?\n\nA comment thread on junior developers and the AI learning curve split into two camps: one that says the repetitive work building fluency is gone, and one that says judging generated code is harder repetition than writing it.\n\nThe middle position was the most interesting to me, because it reframes the debate as a change in emphasis rather than a loss or a gain.\n\nIf you mentor juniors, which skill have you had to teach explicitly that used to be picked up by accident?" },
    ],
  },
];

/** Keyed by draft id. Only drafts that have been through the review pass appear here. */
export const mockReviews: Record<string, Review> = {
  d1: {
    overallScore: 91, factualSupport: 94, originality: 95, tone: 92, readability: 90, recommendation: "approve",
    warnings: ["One sentence generalises the guidance to \"all full-stack products\"; keep the scope narrow when you publish."],
    claims: [
      { text: "prompt injection is an input validation problem", state: "supported", evidence: "The source lists prompt injection as the first risk and frames mitigation as boundary validation." },
      { text: "excessive agency is a permissions problem", state: "supported", evidence: "The source covers excessive agency and least privilege for tool access." },
      { text: "a model that can call your tools is an untrusted client", state: "personal_claim", evidence: "Framing is the author's own; no source wording supports it." },
    ],
  },
  d3: {
    overallScore: 85, factualSupport: 88, originality: 86, tone: 90, readability: 84, recommendation: "edit",
    warnings: ["The word \"never\" in the opening line is stronger than the source supports.", "Recommend naming the source's practice as one approach rather than the approach."],
    claims: [
      { text: "a team separated indexes per tenant", state: "supported", evidence: "The source describes per-tenant index separation." },
      { text: "the first production issue was index access control", state: "needs_review", evidence: "The source describes an access-control fix but does not state it was the first production issue." },
      { text: "a vector store is a datastore with its own authorization model", state: "personal_claim", evidence: "Analytical framing added by the author." },
    ],
  },
  d4: {
    overallScore: 79, factualSupport: 74, originality: 82, tone: 88, readability: 86, recommendation: "edit",
    warnings: ["Source is 6 days old, which sits at the edge of the freshness window.", "The claim about alerting behaviour is a generalisation beyond the described timeline."],
    claims: [
      { text: "a maintainer account was taken over", state: "supported", evidence: "The source timeline describes the account takeover." },
      { text: "publishing credentials outlived the person's involvement", state: "needs_review", evidence: "Implied by the timeline but not stated directly in the source." },
      { text: "nothing alerting looked at behaviour rather than identity", state: "needs_review", evidence: "The source notes absent anomaly alerting but does not describe the identity-versus-behaviour distinction." },
      { text: "detection gaps age slowly", state: "personal_claim", evidence: "Author's own conclusion." },
    ],
  },
};

// ---------- scheduling & publishing ----------

export const mockSchedules: ScheduledPost[] = [
  { id: "sc1", draftId: "d2", draftTitle: "A loud 403 is a bug report. A quiet 200 is a breach.", scheduledFor: "2026-09-21T04:15:00Z", timezone: "Asia/Kathmandu", status: "pending" },
  { id: "sc2", draftId: "d3", draftTitle: "Your vector store has an authorization model too", scheduledFor: "2026-09-22T04:15:00Z", timezone: "Asia/Kathmandu", status: "pending" },
  { id: "sc3", draftId: "d1", draftTitle: "What the LLM security guidance actually asks of builders", scheduledFor: "2026-09-23T04:15:00Z", timezone: "Asia/Kathmandu", status: "pending" },
  { id: "sc4", draftId: "d4", draftTitle: "What the npm postmortem says about detection, not prevention", scheduledFor: "2026-09-15T04:15:00Z", timezone: "Asia/Kathmandu", status: "failed" },
  { id: "sc5", draftId: "d5", draftTitle: "Build times are a product decision, not a chore", scheduledFor: "2026-09-18T04:15:00Z", timezone: "Asia/Kathmandu", status: "published" },
];

export const mockPublished: PublishedPost[] = [
  {
    id: "p1", draftId: "d5", title: "Build times are a product decision, not a chore", method: "manual", status: "published", publishedAt: "2026-09-18T05:10:00Z",
    finalText: "Build times are a product decision that most teams never make deliberately.\n\nA small team documented cutting their TypeScript build times by 60%. What stood out was the order: profile first, then find where the cost is actually concentrated, then use project references so incremental builds can reuse work.\n\nThe real cost of a 40-second build is not the 40 seconds. It is how many times a day someone decides not to run the check.\n\nWhat is your build time, and when did you last measure it?\n\n#TypeScript #WebDevelopment",
  },
  {
    id: "p2", draftId: "d6", title: "What junior developers actually ask about AI tooling", method: "linkedin_api", status: "published",
    linkedinPostId: "urn:li:share:7284910223344", linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:share:7284910223344",
    publishedAt: "2026-09-17T05:05:00Z",
    finalText: "A comment thread on AI tooling and junior developers split neatly in two.\n\nOne side argues assistants remove the repetition that used to build fluency. The other argues that reviewing generated code is harder repetition than writing it.\n\nThe position I found most useful is that the tool changes which fundamentals stay in daily use, rather than removing them.\n\nIf you mentor juniors, which skill have you had to teach explicitly that used to be picked up by accident?\n\n#AIEngineering #CareerGrowth",
  },
];

export const mockMetrics: EngagementMetrics[] = [
  { id: "m1", publishedPostId: "p1", impressions: 1840, reactions: 96, comments: 23, reposts: 11, recordedAt: "2026-09-20T12:00:00Z" },
  { id: "m2", publishedPostId: "p2", impressions: 1120, reactions: 54, comments: 17, reposts: 6, recordedAt: "2026-09-20T12:00:00Z" },
];

export const mockProviderUsage: ProviderUsage[] = [
  { id: "u1", provider: "gemini", model: "gemini-3.5-flash", operation: "generate", latencyMs: 2180, inputTokens: 812, outputTokens: 604, retryCount: 0, createdAt: "2026-09-20T09:00:00Z" },
  { id: "u2", provider: "gemini", model: "gemini-3.5-flash", operation: "generate", latencyMs: 2490, inputTokens: 800, outputTokens: 588, retryCount: 0, createdAt: "2026-09-19T19:30:00Z" },
  { id: "u3", provider: "gemini", model: "gemini-3.5-flash", operation: "review", latencyMs: 1560, inputTokens: 1240, outputTokens: 410, retryCount: 0, createdAt: "2026-09-19T19:31:00Z" },
  { id: "u4", provider: "gemini", model: "gemini-3.5-flash", operation: "generate", latencyMs: 3100, inputTokens: 795, outputTokens: 601, retryCount: 1, errorType: "HTTP 429", createdAt: "2026-09-19T10:15:00Z" },
  { id: "u5", provider: "openrouter", model: "google/gemma-4-31b-it:free", operation: "generate", latencyMs: 4470, inputTokens: 812, outputTokens: 522, retryCount: 0, createdAt: "2026-09-14T12:40:00Z" },
  { id: "u6", provider: "openrouter", model: "qwen/qwen3.8-27b:free", operation: "generate", latencyMs: 5230, inputTokens: 806, outputTokens: 498, retryCount: 2, errorType: "Invalid structured output", createdAt: "2026-09-17T03:30:00Z" },
  { id: "u7", provider: "openrouter", model: "nvidia/nemotron-3-ultra-550b-a55b:free", operation: "generate", latencyMs: 980, inputTokens: 806, outputTokens: 0, retryCount: 0, errorType: "HTTP 503", createdAt: "2026-09-17T03:31:00Z" },
  { id: "u8", provider: "gemini", model: "gemini-3.5-flash", operation: "review", latencyMs: 1720, inputTokens: 1188, outputTokens: 466, retryCount: 0, createdAt: "2026-09-20T09:02:00Z" },
];

export const mockAgentRuns: AgentRun[] = [
  { id: "r1", jobType: "daily_discovery", status: "completed", candidatesFound: 12, draftsCreated: 3, startedAt: "2026-09-20T09:00:00Z", completedAt: "2026-09-20T09:03:12Z" },
  { id: "r2", jobType: "daily_discovery", status: "completed", candidatesFound: 9, draftsCreated: 2, startedAt: "2026-09-19T09:00:00Z", completedAt: "2026-09-19T09:02:41Z" },
  { id: "r3", jobType: "publish_due", status: "failed", candidatesFound: 0, draftsCreated: 0, startedAt: "2026-09-15T04:15:00Z", completedAt: "2026-09-15T04:15:38Z", errorMessage: "Schedule sc4 exceeded the 30s provider timeout." },
  { id: "r4", jobType: "daily_discovery", status: "skipped", candidatesFound: 0, draftsCreated: 0, startedAt: "2026-09-16T09:00:00Z", completedAt: "2026-09-16T09:00:01Z", errorMessage: "Agent paused in settings." },
  { id: "r5", jobType: "daily_discovery", status: "running", candidatesFound: 4, draftsCreated: 0, startedAt: "2026-09-21T09:00:00Z" },
];

/** Mirrors one row of user_settings. */
export const mockSettings: UserSettings = {
  topics: ["full-stack development", "cybersecurity", "AI tooling", "career learning"],
  pillarWeights: { projects: 35, education: 30, industry: 20, career: 15 },
  scoringWeights: { relevance: 30, freshness: 20, value: 20, discussion: 15, credibility: 15 },
  blockedDomains: ["content-farm.example", "aggregator-spam.example"],
  allowedDomains: ["owasp.org", "security.googleblog.com", "newsletter.pragmaticengineer.com"],
  maxArticleAgeDays: 7,
  timezone: "Asia/Kathmandu",
  tone: "thoughtful and practical",
  postLength: "medium",
  hashtagCount: 2,
  emojiLevel: 0,
  approvalRequired: true,
  paused: false,
  providerOrder: ["gemini", "openrouter"],
};






