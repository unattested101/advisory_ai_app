import { CheckCircle2, AlertTriangle, Loader2, Search } from 'lucide-react';
import type { CoverageQuestion } from '../services/api';

interface CoverageStatusProps {
  onCheck: () => Promise<void>;
  isChecking: boolean;
  hasChecked: boolean;
  allCovered: boolean;
  missingQuestions: CoverageQuestion[];
  disabled?: boolean;
}

export function CoverageStatus({
  onCheck,
  isChecking,
  hasChecked,
  allCovered,
  missingQuestions,
  disabled
}: CoverageStatusProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Search className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Coverage Check</h2>
          <p className="text-sm text-gray-500">Verify all questions have been addressed</p>
        </div>
      </div>

      <button
        onClick={onCheck}
        disabled={isChecking || disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
      >
        {isChecking ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing Transcript...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Check Coverage
          </>
        )}
      </button>

      {hasChecked && (
        <div className={`p-4 rounded-lg ${
          allCovered 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {allCovered ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">All Questions Covered!</h3>
                  <p className="text-sm text-green-600">
                    Great job! All checklist items have been addressed in the meeting.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">
                    {missingQuestions.length} Question{missingQuestions.length > 1 ? 's' : ''} Missing
                  </h3>
                  <p className="text-sm text-amber-600">
                    Some questions haven't been addressed yet. Check the checklist for details.
                  </p>
                </div>
              </>
            )}
          </div>

          {!allCovered && missingQuestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-amber-800">Missing Questions:</p>
              <ul className="space-y-2">
                {missingQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <div>
                      <span>{q.question}</span>
                      {q.suggestion && (
                        <p className="text-xs text-amber-600 mt-0.5 italic">
                          Try: "{q.suggestion}"
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
