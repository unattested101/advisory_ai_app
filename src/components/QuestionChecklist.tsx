import { useState } from 'react';
import { ClipboardList, Check, Circle, AlertCircle, X, Plus, ListChecks } from 'lucide-react';
import type { CoverageQuestion, QuestionTemplate } from '../services/api';

interface QuestionChecklistProps {
  questions: string[];
  coveredQuestions: CoverageQuestion[];
  missingQuestions: CoverageQuestion[];
  hasChecked: boolean;
  // Editable mode props (when bot is not yet invited)
  editable?: boolean;
  templates?: QuestionTemplate[];
  selectedTemplateId?: string;
  onTemplateChange?: (templateId: string) => void;
  onAddQuestion?: (question: string) => void;
  onRemoveQuestion?: (index: number) => void;
}

export function QuestionChecklist({
  questions,
  coveredQuestions,
  missingQuestions,
  hasChecked,
  editable = false,
  templates = [],
  selectedTemplateId = '',
  onTemplateChange,
  onAddQuestion,
  onRemoveQuestion,
}: QuestionChecklistProps) {
  const [newQuestion, setNewQuestion] = useState('');

  const getQuestionStatus = (question: string) => {
    if (!hasChecked) return 'unchecked';

    const covered = coveredQuestions.find((q) => q.question === question);
    if (covered) return 'covered';

    const missing = missingQuestions.find((q) => q.question === question);
    if (missing) return 'missing';

    return 'unchecked';
  };

  const getEvidence = (question: string) => {
    const covered = coveredQuestions.find((q) => q.question === question);
    return covered?.evidence;
  };

  const getSuggestion = (question: string) => {
    const missing = missingQuestions.find((q) => q.question === question);
    return missing?.suggestion;
  };

  const handleAdd = () => {
    const trimmed = newQuestion.trim();
    if (trimmed && onAddQuestion) {
      onAddQuestion(trimmed);
      setNewQuestion('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          <ClipboardList className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Question Checklist</h2>
          <p className="text-sm text-gray-500">
            {editable ? 'Pick a template and customise your questions' : 'Questions to cover in the meeting'}
          </p>
        </div>
      </div>

      {/* Template dropdown (editable mode only) */}
      {editable && templates.length > 0 && (
        <div className="mb-4">
          <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" />
              Question Template
            </span>
          </label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={(e) => onTemplateChange?.(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
          >
            <option value="">-- Choose a template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.questions.length} questions)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-2">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question);
          const evidence = getEvidence(question);
          const suggestion = getSuggestion(question);

          return (
            <div
              key={`${index}-${question}`}
              className={`p-3 rounded-lg border transition-all ${
                status === 'covered'
                  ? 'bg-green-50 border-green-200'
                  : status === 'missing'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {status === 'covered' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : status === 'missing' ? (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      status === 'covered'
                        ? 'text-green-800'
                        : status === 'missing'
                          ? 'text-amber-800'
                          : 'text-gray-700'
                    }`}
                  >
                    {question}
                  </p>
                  {evidence && (
                    <p className="mt-1 text-xs text-green-600 italic">"{evidence}"</p>
                  )}
                  {suggestion && (
                    <p className="mt-1 text-xs text-amber-600">Suggestion: {suggestion}</p>
                  )}
                </div>
                {/* Remove button (editable mode only) */}
                {editable && (
                  <button
                    onClick={() => onRemoveQuestion?.(index)}
                    className="shrink-0 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove question"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {questions.length === 0 && (
          <div className="py-8 text-center text-gray-400 text-sm">
            {editable
              ? 'Select a template above or add questions manually.'
              : 'No questions configured for this call.'}
          </div>
        )}
      </div>

      {/* Add question input (editable mode only) */}
      {editable && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a custom question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newQuestion.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}
    </div>
  );
}
