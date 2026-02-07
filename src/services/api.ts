const API_URL = "https://advisoryaibe-production.up.railway.app";

export interface BotInviteResponse {
  success: boolean;
  botId: string;
  status: string;
  message: string;
}

export interface BotStatusResponse {
  botId: string;
  status: string;
  meetingUrl: string;
}

export interface CoverageQuestion {
  question: string;
  evidence?: string;
  suggestion?: string;
}

export interface CoverageResponse {
  allCovered: boolean;
  coveredQuestions: CoverageQuestion[];
  missingQuestions: CoverageQuestion[];
  error?: string;
}

export interface QuestionsResponse {
  questions: string[];
}

export interface QuestionTemplate {
  id: string;
  name: string;
  questions: string[];
}

/**
 * Send a bot to join a meeting
 */
export async function inviteBot(
  meetingUrl: string,
  clientId?: string,
  questions?: string[],
  botName?: string,
): Promise<BotInviteResponse> {
  const response = await fetch(`${API_URL}/api/bot/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ meetingUrl, clientId, questions, botName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to invite bot");
  }

  return response.json();
}

/**
 * Get bot status
 */
export async function getBotStatus(botId: string): Promise<BotStatusResponse> {
  const response = await fetch(`${API_URL}/api/bot/${botId}/status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get bot status");
  }

  return response.json();
}

/**
 * Check question coverage
 */
export async function checkCoverage(botId: string): Promise<CoverageResponse> {
  const response = await fetch(`${API_URL}/api/bot/${botId}/check-coverage`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to check coverage");
  }

  return response.json();
}

/**
 * Get predefined questions
 */
export async function getQuestions(): Promise<QuestionsResponse> {
  const response = await fetch(`${API_URL}/api/questions`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get questions");
  }

  return response.json();
}

/**
 * Get all question templates
 */
export async function getQuestionTemplates(): Promise<{
  templates: QuestionTemplate[];
}> {
  const response = await fetch(`${API_URL}/api/questions/templates`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get question templates");
  }

  return response.json();
}

/**
 * Remove bot from meeting
 */
export async function leaveBot(botId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/bot/${botId}/leave`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove bot");
  }
}

/**
 * Get SSE events URL for a bot
 */
export function getEventsUrl(botId: string): string {
  return `${API_URL}/api/bot/${botId}/events`;
}

// ──────────────────────────────────────────
// Advisory API
// ──────────────────────────────────────────

export interface Holding {
  asset: string;
  type: string;
  value: number;
  allocation: number;
}

export interface Portfolio {
  totalValue: number;
  currency: string;
  holdings: Holding[];
}

export interface Goal {
  id: string;
  title: string;
  type: string;
  targetAmount: number;
  currentSavings: number;
  targetDate: string;
  area?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  riskProfile: string;
  portfolio: Portfolio;
  goals: Goal[];
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  date: string;
  category: string;
  relevantAreas: string[];
}

export interface Suggestion {
  type: "investment" | "property" | "rebalance" | "risk_alert" | "opportunity";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  relatedGoal: string | null;
  relatedNews: string;
  relatedHoldings: string[];
}

export interface ClientSuggestions {
  clientId: string;
  clientName: string;
  suggestions: Suggestion[];
}

/**
 * Get all advisory clients
 */
export async function getAdvisoryClients(): Promise<{ clients: Client[] }> {
  const response = await fetch(`${API_URL}/api/advisory/clients`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch clients");
  }
  return response.json();
}

/**
 * Get a single client by ID
 */
export async function getAdvisoryClient(
  clientId: string,
): Promise<{ client: Client }> {
  const response = await fetch(`${API_URL}/api/advisory/clients/${clientId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch client");
  }
  return response.json();
}

/**
 * Get all news items
 */
export async function getAdvisoryNews(): Promise<{ news: NewsItem[] }> {
  const response = await fetch(`${API_URL}/api/advisory/news`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch news");
  }
  return response.json();
}

/**
 * Generate AI suggestions for all clients (or a specific one)
 */
export async function getAdvisorySuggestions(
  clientId?: string,
): Promise<{ results: ClientSuggestions[] }> {
  const response = await fetch(`${API_URL}/api/advisory/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clientId ? { clientId } : {}),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate suggestions");
  }
  return response.json();
}

// ──────────────────────────────────────────
// News Impact API
// ──────────────────────────────────────────

export interface NewsImpact {
  clientId: string;
  clientName: string;
  impact: string;
  actionItem: string;
  priority: "high" | "medium" | "low";
  relatedHoldings: string[];
  relatedGoal: string | null;
}

export interface NewsImpactResponse {
  newsId: string;
  headline: string;
  impacts: NewsImpact[];
}

/**
 * Analyse the impact of a specific news article across all clients
 */
export async function getNewsImpact(
  newsId: string,
): Promise<NewsImpactResponse> {
  const response = await fetch(
    `${API_URL}/api/advisory/news/${newsId}/impact`,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyse news impact");
  }
  return response.json();
}

// ──────────────────────────────────────────
// Email API
// ──────────────────────────────────────────

export interface SendEmailPayload {
  clientId: string;
  clientName: string;
  newsArticle: {
    headline: string;
    summary: string;
    source: string;
    date: string;
    category: string;
  };
  impact: string;
  actionItem: string;
  relatedHoldings: string[];
  relatedGoal: string | null;
}

export interface BulkEmailPayload {
  newsArticle: {
    headline: string;
    summary: string;
    source: string;
    date: string;
    category: string;
  };
  impacts: {
    clientId: string;
    clientName: string;
    impact: string;
    actionItem: string;
    relatedHoldings: string[];
    relatedGoal: string | null;
  }[];
}

/**
 * Send a news impact email to a single client
 */
export async function sendImpactEmail(
  data: SendEmailPayload,
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/api/advisory/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send email");
  }
  return response.json();
}

/**
 * Send news impact emails to all affected clients
 */
export async function sendBulkImpactEmail(
  data: BulkEmailPayload,
): Promise<{ success: boolean; sent: number }> {
  const response = await fetch(`${API_URL}/api/advisory/email/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send emails");
  }
  return response.json();
}

// ──────────────────────────────────────────
// Action Items API
// ──────────────────────────────────────────

export interface ActionItem {
  id: string;
  text: string;
  assignee: string | null;
  done: boolean;
  dueDate: string;
}

export interface UpcomingActionItem extends ActionItem {
  clientId: string;
  clientName: string;
  meetingId: string;
  meetingDate: string;
}

export interface MeetingActionItems {
  id: string;
  clientId: string;
  botId: string;
  meetingDate: string;
  actionItems: ActionItem[];
}

/**
 * Get all meeting action items for a specific client
 */
export async function getClientActionItems(
  clientId: string,
): Promise<{ meetings: MeetingActionItems[] }> {
  const response = await fetch(
    `${API_URL}/api/advisory/clients/${clientId}/action-items`,
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch action items");
  }
  return response.json();
}

/**
 * Toggle the done status of an action item
 */
export async function toggleActionItem(
  meetingId: string,
  itemId: string,
): Promise<{ item: ActionItem }> {
  const response = await fetch(
    `${API_URL}/api/advisory/action-items/${meetingId}/${itemId}/toggle`,
    {
      method: "PATCH",
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to toggle action item");
  }
  return response.json();
}

/**
 * Get all pending action items across all clients, sorted by deadline (most urgent first)
 */
export async function getUpcomingActionItems(): Promise<{
  items: UpcomingActionItem[];
}> {
  const response = await fetch(`${API_URL}/api/advisory/action-items/upcoming`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch upcoming action items");
  }
  return response.json();
}

/**
 * Send an action item follow-up email to a client
 */
export async function sendActionItemEmail(payload: {
  clientId: string;
  actionItemText: string;
  message: string;
}): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/api/advisory/action-items/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send email");
  }
  return response.json();
}
