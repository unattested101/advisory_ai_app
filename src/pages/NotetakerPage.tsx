import { useState, useEffect, useCallback } from 'react';
import { MeetingInput } from '../components/MeetingInput';
import { TranscriptPanel } from '../components/TranscriptPanel';
import { QuestionChecklist } from '../components/QuestionChecklist';
import { CoverageStatus } from '../components/CoverageStatus';
import { useTranscriptStream } from '../hooks/useTranscriptStream';
import { inviteBot, checkCoverage, getQuestionTemplates, getAdvisoryClients } from '../services/api';
import type { CoverageQuestion, Client, QuestionTemplate } from '../services/api';
import { RefreshCw } from 'lucide-react';

export function NotetakerPage() {
  // Bot state
  const [botId, setBotId] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Client state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  // Question templates + editable per-call questions
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);

  // Coverage state
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [allCovered, setAllCovered] = useState(false);
  const [coveredQuestions, setCoveredQuestions] = useState<CoverageQuestion[]>([]);
  const [missingQuestions, setMissingQuestions] = useState<CoverageQuestion[]>([]);

  // Transcript stream
  const {
    transcript,
    botStatus,
    isConnected,
    meetingEnded,
    error: streamError,
    connect,
    clearTranscript,
  } = useTranscriptStream();

  // Load templates and clients on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getQuestionTemplates();
        setTemplates(data.templates);
      } catch (err) {
        console.error('Failed to load question templates:', err);
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getAdvisoryClients();
        setClients(data.clients);
      } catch (err) {
        console.error('Failed to load clients:', err);
      }
    };
    loadClients();
  }, []);

  // When a template is selected, pre-fill questions
  const handleTemplateChange = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      if (!templateId) {
        setCustomQuestions([]);
        return;
      }
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl) {
        setCustomQuestions([...tpl.questions]);
      }
    },
    [templates],
  );

  const handleAddQuestion = useCallback((question: string) => {
    setCustomQuestions((prev) => [...prev, question]);
  }, []);

  const handleRemoveQuestion = useCallback((index: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle bot invite -- pass custom questions to backend
  const handleInviteBot = useCallback(
    async (meetingUrl: string) => {
      setIsInviting(true);
      setInviteError(null);

      try {
        const response = await inviteBot(
          meetingUrl,
          selectedClientId || undefined,
          customQuestions.length > 0 ? customQuestions : undefined,
        );
        setBotId(response.botId);
        connect(response.botId);
      } catch (err) {
        setInviteError(err instanceof Error ? err.message : 'Failed to invite bot');
        throw err;
      } finally {
        setIsInviting(false);
      }
    },
    [connect, selectedClientId, customQuestions],
  );

  // Handle coverage check
  const handleCheckCoverage = useCallback(async () => {
    if (!botId) return;

    setIsChecking(true);
    try {
      const result = await checkCoverage(botId);
      setHasChecked(true);
      setAllCovered(result.allCovered);
      setCoveredQuestions(result.coveredQuestions);
      setMissingQuestions(result.missingQuestions);
    } catch (err) {
      console.error('Coverage check failed:', err);
      setHasChecked(true);
      setAllCovered(false);
    } finally {
      setIsChecking(false);
    }
  }, [botId]);

  // Reset everything for a new meeting
  const handleReset = useCallback(() => {
    setBotId(null);
    setInviteError(null);
    setSelectedClientId('');
    setSelectedTemplateId('');
    setCustomQuestions([]);
    setHasChecked(false);
    setAllCovered(false);
    setCoveredQuestions([]);
    setMissingQuestions([]);
    clearTranscript();
  }, [clearTranscript]);

  // Prepare client options for the dropdown
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notetaker</h1>
          <p className="mt-1 text-sm text-gray-500">
            Meeting notetaker with question tracking
          </p>
        </div>
        {botId && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            New Meeting
          </button>
        )}
      </div>

      {/* Error display */}
      {(inviteError || streamError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{inviteError || streamError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <MeetingInput
            onSubmit={handleInviteBot}
            isLoading={isInviting}
            disabled={!!botId}
            clients={clientOptions}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
          <TranscriptPanel
            transcript={transcript}
            isConnected={isConnected}
            botStatus={botStatus}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuestionChecklist
            questions={customQuestions}
            coveredQuestions={coveredQuestions}
            missingQuestions={missingQuestions}
            hasChecked={hasChecked}
            editable={!botId}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
            onAddQuestion={handleAddQuestion}
            onRemoveQuestion={handleRemoveQuestion}
          />
          <CoverageStatus
            onCheck={handleCheckCoverage}
            isChecking={isChecking}
            hasChecked={hasChecked}
            allCovered={allCovered}
            missingQuestions={missingQuestions}
            disabled={!botId || transcript.length === 0}
          />
        </div>
      </div>

      {/* Meeting status indicator */}
      {meetingEnded && (
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-700 text-sm">
            Meeting has ended. You can still check coverage for the recorded transcript.
          </p>
        </div>
      )}
    </div>
  );
}
