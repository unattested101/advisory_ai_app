import { useState, useEffect } from 'react';
import {
  Newspaper,
  Sparkles,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Home,
  PiggyBank,
  BarChart3,
  ChevronDown,
  Users,
  ArrowRight,
  RefreshCw,
  Mail,
  Check,
  Send,
  Clock,
  CircleAlert,
  Circle,
  ChevronRight,
} from 'lucide-react';
import {
  getAdvisoryNews,
  getNewsImpact,
  sendImpactEmail,
  sendBulkImpactEmail,
  getUpcomingActionItems,
  toggleActionItem,
} from '../services/api';
import type { NewsItem, NewsImpact, UpcomingActionItem } from '../services/api';
import { ActionItemEmailModal } from '../components/ActionItemEmailModal';

// ── Style maps ──────────────────────────────

const categoryIcon: Record<string, typeof TrendingUp> = {
  equities: TrendingUp,
  property: Home,
  bonds: PiggyBank,
  interest_rates: BarChart3,
};

const categoryColor: Record<string, string> = {
  equities: 'bg-sky-50 text-sky-700 border-sky-200',
  property: 'bg-violet-50 text-violet-700 border-violet-200',
  bonds: 'bg-amber-50 text-amber-700 border-amber-200',
  interest_rates: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const categoryLabel: Record<string, string> = {
  equities: 'Equities',
  property: 'Property',
  bonds: 'Bonds',
  interest_rates: 'Interest Rates',
};

const priorityStyle: Record<string, string> = {
  high: 'border-l-red-400',
  medium: 'border-l-amber-400',
  low: 'border-l-gray-300',
};

const priorityBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

// ── Time helpers ────────────────────────────

function getTimeRemaining(dueDate: string): { label: string; urgent: boolean; overdue: boolean } {
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const diff = due - now;

  if (diff <= 0) {
    const ago = Math.abs(diff);
    const hours = Math.floor(ago / (1000 * 60 * 60));
    if (hours < 1) return { label: 'Just overdue', urgent: true, overdue: true };
    if (hours < 24) return { label: `${hours}h overdue`, urgent: true, overdue: true };
    const days = Math.floor(hours / 24);
    return { label: `${days}d overdue`, urgent: true, overdue: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return { label: `${mins}m left`, urgent: true, overdue: false };
  if (hours < 6) return { label: `${hours}h left`, urgent: true, overdue: false };
  if (hours < 24) return { label: `${hours}h left`, urgent: false, overdue: false };
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return { label: `${days}d ${remHours}h left`, urgent: false, overdue: false };
}

// ── Impact Card Component ───────────────────

function ImpactCard({
  impact,
  article,
}: {
  impact: NewsImpact;
  article: NewsItem;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSendEmail = async () => {
    setSending(true);
    setEmailError(null);
    try {
      await sendImpactEmail({
        clientId: impact.clientId,
        clientName: impact.clientName,
        newsArticle: {
          headline: article.headline,
          summary: article.summary,
          source: article.source,
          date: article.date,
          category: article.category,
        },
        impact: impact.impact,
        actionItem: impact.actionItem,
        relatedHoldings: impact.relatedHoldings,
        relatedGoal: impact.relatedGoal,
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send');
      setTimeout(() => setEmailError(null), 4000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`border-l-4 ${priorityStyle[impact.priority]} bg-white rounded-lg border border-gray-200 p-4 transition-all`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
          {impact.clientName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{impact.clientName}</h4>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${priorityBadge[impact.priority]}`}
            >
              {impact.priority}
            </span>
            <button
              onClick={handleSendEmail}
              disabled={sending || sent}
              title={sent ? 'Email sent!' : 'Send email to client'}
              className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                sent
                  ? 'bg-emerald-50 text-emerald-600 cursor-default'
                  : emailError
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              } disabled:opacity-60`}
            >
              {sending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : sent ? (
                <Check className="w-3 h-3" />
              ) : (
                <Mail className="w-3 h-3" />
              )}
              {sending ? 'Sending...' : sent ? 'Sent' : emailError ? 'Failed' : 'Email'}
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{impact.impact}</p>

          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Action Item
              </span>
            </div>
            <p className="text-sm text-gray-700">{impact.actionItem}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            {impact.relatedHoldings.length > 0 && (
              <span>
                <span className="font-medium text-gray-500">Holdings:</span>{' '}
                {impact.relatedHoldings.join(', ')}
              </span>
            )}
            {impact.relatedGoal && (
              <span>
                <span className="font-medium text-gray-500">Goal:</span> {impact.relatedGoal}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expanded News Article ───────────────────

function ExpandedArticle({ article }: { article: NewsItem }) {
  const [impacts, setImpacts] = useState<NewsImpact[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysed, setAnalysed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bulkSending, setBulkSending] = useState(false);
  const [bulkSent, setBulkSent] = useState<number | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const handleAnalyse = async () => {
    setLoading(true);
    setError(null);
    setBulkSent(null);
    setBulkError(null);
    try {
      const data = await getNewsImpact(article.id);
      setImpacts(data.impacts);
      setAnalysed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse impact');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    setBulkSending(true);
    setBulkError(null);
    setBulkSent(null);
    try {
      const result = await sendBulkImpactEmail({
        newsArticle: {
          headline: article.headline,
          summary: article.summary,
          source: article.source,
          date: article.date,
          category: article.category,
        },
        impacts: impacts.map((imp) => ({
          clientId: imp.clientId,
          clientName: imp.clientName,
          impact: imp.impact,
          actionItem: imp.actionItem,
          relatedHoldings: imp.relatedHoldings,
          relatedGoal: imp.relatedGoal,
        })),
      });
      setBulkSent(result.sent);
      setTimeout(() => setBulkSent(null), 5000);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Failed to send emails');
      setTimeout(() => setBulkError(null), 5000);
    } finally {
      setBulkSending(false);
    }
  };

  const CatIcon = categoryIcon[article.category] || Newspaper;
  const catColor = categoryColor[article.category] || 'bg-gray-100 text-gray-600 border-gray-200';

  const sortedImpacts = [...impacts].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${catColor}`}
          >
            <CatIcon className="w-3 h-3" />
            {categoryLabel[article.category] || article.category}
          </span>
          <span className="text-xs text-gray-400">
            {article.source} &middot; {article.date}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{article.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {article.relevantAreas.map((area) => (
            <span
              key={area}
              className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {!analysed && (
        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysing client impact...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyse Client Impact
            </>
          )}
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {analysed && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              {impacts.length === 0
                ? 'No clients directly affected'
                : `${impacts.length} client${impacts.length !== 1 ? 's' : ''} affected`}
            </h3>
          </div>

          {impacts.length === 0 ? (
            <p className="text-sm text-gray-400 pl-6">
              This article does not have a direct impact on any current client portfolios or goals.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {sortedImpacts.map((impact) => (
                  <ImpactCard key={impact.clientId} impact={impact} article={article} />
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleBulkEmail}
                  disabled={bulkSending || bulkSent !== null}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    bulkSent !== null
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : bulkError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {bulkSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending {impacts.length} email{impacts.length !== 1 ? 's' : ''}...
                    </>
                  ) : bulkSent !== null ? (
                    <>
                      <Check className="w-4 h-4" />
                      {bulkSent} email{bulkSent !== 1 ? 's' : ''} sent
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Email All Clients ({impacts.length})
                    </>
                  )}
                </button>

                {bulkError && <span className="text-xs text-red-600">{bulkError}</span>}

                <button
                  onClick={handleAnalyse}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Re-analyse
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Upcoming Action Items ───────────────────

function UpcomingActions() {
  const [items, setItems] = useState<UpcomingActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [emailItem, setEmailItem] = useState<UpcomingActionItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getUpcomingActionItems();
        setItems(data.items);
      } catch (err) {
        console.error('Failed to load upcoming actions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = async (meetingId: string, itemId: string) => {
    setTogglingIds((prev) => new Set(prev).add(itemId));
    try {
      await toggleActionItem(meetingId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to toggle:', err);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-400" />
        <span className="text-sm text-gray-400">Loading action items...</span>
      </div>
    );
  }

  if (items.length === 0) return null;

  const overdueItems = items.filter((i) => getTimeRemaining(i.dueDate).overdue);
  const urgentItems = items.filter((i) => {
    const t = getTimeRemaining(i.dueDate);
    return !t.overdue && t.urgent;
  });
  const upcomingItems = items.filter((i) => {
    const t = getTimeRemaining(i.dueDate);
    return !t.overdue && !t.urgent;
  });

  const PREVIEW_LIMIT = 3;
  const visibleItems = showAll ? items : items.slice(0, PREVIEW_LIMIT);
  const hasMore = items.length > PREVIEW_LIMIT;

  return (
    <div className="space-y-4">
      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl border p-4 ${overdueItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <CircleAlert className={`w-4 h-4 ${overdueItems.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-xs font-medium uppercase tracking-wide ${overdueItems.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              Overdue
            </span>
          </div>
          <p className={`text-2xl font-bold ${overdueItems.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>
            {overdueItems.length}
          </p>
        </div>

        <div className={`rounded-xl border p-4 ${urgentItems.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`w-4 h-4 ${urgentItems.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className={`text-xs font-medium uppercase tracking-wide ${urgentItems.length > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
              Due Soon
            </span>
          </div>
          <p className={`text-2xl font-bold ${urgentItems.length > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
            {urgentItems.length}
          </p>
        </div>

        <div className="rounded-xl border p-4 bg-gray-50 border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Upcoming
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-600">
            {upcomingItems.length}
          </p>
        </div>
      </div>

      {/* Action items list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Action Items</h2>
          <span className="text-xs text-gray-400">{items.length} pending</span>
        </div>

        <div className="divide-y divide-gray-100">
          {visibleItems.map((item) => {
            const time = getTimeRemaining(item.dueDate);
            const toggling = togglingIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`px-5 py-3 flex items-center gap-3 transition-all hover:bg-gray-50/60 ${toggling ? 'opacity-40' : ''}`}
              >
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(item.meetingId, item.id)}
                  disabled={toggling}
                  className="shrink-0"
                  title="Mark as done"
                >
                  <Circle className="w-[18px] h-[18px] text-gray-300 hover:text-emerald-400 transition-colors" />
                </button>

                {/* Client avatar */}
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold shrink-0">
                  {item.clientName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{item.text}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {item.clientName}
                    {item.assignee ? ` \u00B7 ${item.assignee}` : ''}
                  </p>
                </div>

                {/* Email button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmailItem(item);
                  }}
                  className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Send email to client"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>

                {/* Time badge */}
                <span
                  className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    time.overdue
                      ? 'bg-red-50 text-red-600'
                      : time.urgent
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {time.overdue ? (
                    <CircleAlert className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {time.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Show more / less */}
        {hasMore && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full px-5 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1 transition-colors"
          >
            {showAll ? 'Show less' : `Show all ${items.length} items`}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Email modal */}
      {emailItem && (
        <ActionItemEmailModal
          clientId={emailItem.clientId}
          clientName={emailItem.clientName}
          actionItemText={emailItem.text}
          onClose={() => setEmailItem(null)}
        />
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────

export function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdvisoryNews();
        setNews(data.news);
      } catch (err) {
        console.error('Failed to load news:', err);
      } finally {
        setNewsLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advisory Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track urgent tasks and stay on top of market-moving news for your clients.
        </p>
      </div>

      {/* Action Items Section */}
      <UpcomingActions />

      {/* News Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Newspaper className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Market News</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Click an article to analyse impact on your clients
            </p>
          </div>
        </div>

        {newsLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading news feed...
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((article) => {
              const isExpanded = expandedId === article.id;
              const CatIcon = categoryIcon[article.category] || Newspaper;
              const catColor =
                categoryColor[article.category] || 'bg-gray-100 text-gray-600 border-gray-200';

              return (
                <div
                  key={article.id}
                  className={`bg-white rounded-xl border shadow-sm transition-all ${
                    isExpanded
                      ? 'border-gray-300 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => handleToggle(article.id)}
                    className="w-full text-left p-5 flex items-start gap-4"
                  >
                    <span
                      className={`inline-flex p-2.5 rounded-lg shrink-0 ${catColor.split(' border')[0]}`}
                    >
                      <CatIcon className="w-5 h-5" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                        {article.headline}
                      </h3>
                      {!isExpanded && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                        <span>{article.source}</span>
                        <span>&middot;</span>
                        <span>{article.date}</span>
                        <span>&middot;</span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${catColor.split(' border')[0]}`}
                        >
                          {categoryLabel[article.category] || article.category}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <ExpandedArticle article={article} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
