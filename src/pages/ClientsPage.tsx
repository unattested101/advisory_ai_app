import { useState, useEffect } from 'react';
import {
  Search,
  Mail,
  Phone,
  Target,
  PiggyBank,
  TrendingUp,
  ArrowLeft,
  Shield,
  ChevronRight,
  Loader2,
  Home,
  GraduationCap,
  Briefcase,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Circle,
  Video,
  Clock,
  CircleAlert,
} from 'lucide-react';
import { getAdvisoryClients, getClientActionItems, toggleActionItem } from '../services/api';
import type { Client, Goal, Holding, MeetingActionItems } from '../services/api';
import { ActionItemEmailModal } from '../components/ActionItemEmailModal';

// ── Helpers ─────────────────────────────────

const riskColor: Record<string, string> = {
  conservative: 'bg-emerald-50 text-emerald-700',
  moderate: 'bg-amber-50 text-amber-700',
  aggressive: 'bg-red-50 text-red-700',
};

const goalIcon: Record<string, typeof Target> = {
  property_purchase: Home,
  retirement: PiggyBank,
  investment_growth: TrendingUp,
  education: GraduationCap,
  business: Briefcase,
};

function formatCurrency(value: number) {
  return '£' + value.toLocaleString('en-GB');
}

function progressPercent(current: number, target: number) {
  return Math.min(Math.round((current / target) * 100), 100);
}

// ── Sub-components ──────────────────────────

function GoalCard({ goal }: { goal: Goal }) {
  const Icon = goalIcon[goal.type] || Target;
  const pct = progressPercent(goal.currentSavings, goal.targetAmount);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{goal.title}</h4>
          {goal.area && <p className="text-xs text-gray-500 mt-0.5">{goal.area}</p>}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
          <Calendar className="w-3 h-3" />
          {new Date(goal.targetDate).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">{formatCurrency(goal.currentSavings)} saved</span>
          <span className="font-medium text-gray-700">{formatCurrency(goal.targetAmount)} target</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className={`h-2 rounded-full transition-all ${
              pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-1">{pct}% of target</p>
      </div>

      {goal.notes && <p className="text-xs text-gray-500 italic">{goal.notes}</p>}
    </div>
  );
}

function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="pb-2 font-medium">Asset</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium text-right">Value</th>
            <th className="pb-2 font-medium text-right">Allocation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {holdings.map((h) => (
            <tr key={h.asset} className="hover:bg-gray-50/60">
              <td className="py-2.5 font-medium text-gray-900">{h.asset}</td>
              <td className="py-2.5">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                  {h.type.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="py-2.5 text-right text-gray-700">{formatCurrency(h.value)}</td>
              <td className="py-2.5 text-right">
                <div className="inline-flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full hidden sm:block">
                    <div
                      className="h-1.5 bg-gray-500 rounded-full"
                      style={{ width: `${h.allocation}%` }}
                    />
                  </div>
                  <span className="text-gray-600 text-xs font-medium w-10 text-right">
                    {h.allocation}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

// ── Action Items Tab ────────────────────────

function ActionItemsTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [meetings, setMeetings] = useState<MeetingActionItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [emailItemText, setEmailItemText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getClientActionItems(clientId);
        if (!cancelled) setMeetings(data.meetings);
      } catch (err) {
        console.error('Failed to load action items:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const handleToggle = async (meetingId: string, itemId: string) => {
    const key = `${meetingId}-${itemId}`;
    setTogglingIds((prev) => new Set(prev).add(key));

    try {
      const { item: updated } = await toggleActionItem(meetingId, itemId);
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                actionItems: m.actionItems.map((i) =>
                  i.id === itemId ? { ...i, done: updated.done } : i,
                ),
              }
            : m,
        ),
      );
    } catch (err) {
      console.error('Failed to toggle action item:', err);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading action items...
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
        <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No meeting action items yet.</p>
        <p className="text-gray-400 text-xs mt-1">
          Action items will appear here after meetings are completed via the Notetaker.
        </p>
      </div>
    );
  }

  // Show meetings in reverse chronological order
  const sorted = [...meetings].sort(
    (a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime(),
  );

  return (
    <div className="space-y-5">
      {sorted.map((meeting) => {
        const doneCount = meeting.actionItems.filter((i) => i.done).length;
        const totalCount = meeting.actionItems.length;
        return (
          <div
            key={meeting.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
          >
            {/* Meeting header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Meeting on{' '}
                    {new Date(meeting.meetingDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(meeting.meetingDate).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  doneCount === totalCount
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {doneCount}/{totalCount} done
              </span>
            </div>

            {/* Action items list */}
            <div className="space-y-2">
              {meeting.actionItems.map((item) => {
                const toggling = togglingIds.has(`${meeting.id}-${item.id}`);
                const time = item.dueDate && !item.done ? getTimeRemaining(item.dueDate) : null;
                return (
                  <div
                    key={item.id}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      item.done
                        ? 'bg-gray-50 border-gray-100'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    } ${toggling ? 'opacity-60' : ''}`}
                  >
                    {/* Toggle button */}
                    <button
                      onClick={() => handleToggle(meeting.id, item.id)}
                      disabled={toggling}
                      className="shrink-0 mt-0.5"
                    >
                      {item.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          item.done
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900 font-medium'
                        }`}
                      >
                        {item.text}
                      </p>
                      {item.assignee && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Assigned to: {item.assignee}
                        </p>
                      )}
                    </div>
                    {/* Email button (only for pending client-level items) */}
                    {!item.done && (
                      <button
                        onClick={() => setEmailItemText(item.text)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all text-xs font-medium"
                        title="Send email to client"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </button>
                    )}
                    {/* Time remaining badge */}
                    {time && (
                      <span
                        className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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
                    )}
                    {item.done && (
                      <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Done
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Email modal */}
      {emailItemText && (
        <ActionItemEmailModal
          clientId={clientId}
          clientName={clientName}
          actionItemText={emailItemText}
          onClose={() => setEmailItemText(null)}
        />
      )}
    </div>
  );
}

// ── Client Detail View ──────────────────────

type DetailTab = 'overview' | 'action-items';

function ClientDetail({ client, onBack }: { client: Client; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const tabs: { id: DetailTab; label: string; icon: typeof Target }[] = [
    { id: 'overview', label: 'Overview', icon: PiggyBank },
    { id: 'action-items', label: 'Action Items', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to clients
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-lg font-bold">
              {client.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {client.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {client.phone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${riskColor[client.riskProfile] || 'bg-gray-100 text-gray-600'}`}
            >
              <Shield className="w-3 h-3 inline mr-1" />
              {client.riskProfile} risk
            </span>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(client.portfolio.totalValue)}
              </p>
              <p className="text-xs text-gray-500">Total portfolio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <PiggyBank className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Investment Portfolio</h2>
                <p className="text-sm text-gray-500">
                  {client.portfolio.holdings.length} holdings
                </p>
              </div>
            </div>
            <HoldingsTable holdings={client.portfolio.holdings} />
          </div>

          {/* Goals */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
                <p className="text-sm text-gray-500">{client.goals.length} active goals</p>
              </div>
            </div>
            <div className="space-y-4">
              {client.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'action-items' && <ActionItemsTab clientId={client.id} clientName={client.name} />}
    </div>
  );
}

// ── Main Page ───────────────────────────────

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdvisoryClients();
        setClients(data.clients);
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  if (selectedClient) {
    return (
      <ClientDetail client={selectedClient} onBack={() => setSelectedClientId(null)} />
    );
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="mt-1 text-sm text-gray-500">
          View client portfolios, investment holdings, and financial goals.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading clients...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className="text-left bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">
                    {client.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(client.portfolio.totalValue)}
                  </p>
                  <p className="text-xs text-gray-500">Portfolio value</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-900">
                    {client.portfolio.holdings.length}
                  </p>
                  <p className="text-xs text-gray-500">Holdings</p>
                </div>
              </div>

              {/* Goals preview */}
              <div className="space-y-2">
                {client.goals.map((goal) => {
                  const Icon = goalIcon[goal.type] || Target;
                  const pct = progressPercent(goal.currentSavings, goal.targetAmount);
                  return (
                    <div key={goal.id} className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-600 truncate flex-1">{goal.title}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          pct >= 75
                            ? 'bg-emerald-50 text-emerald-600'
                            : pct >= 40
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Risk badge */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${riskColor[client.riskProfile] || 'bg-gray-100 text-gray-600'}`}
                >
                  {client.riskProfile} risk
                </span>
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 text-sm">
              No clients match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
