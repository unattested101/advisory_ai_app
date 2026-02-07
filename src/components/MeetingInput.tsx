import { useState } from 'react';
import { Video, Loader2, Users } from 'lucide-react';

interface ClientOption {
  id: string;
  name: string;
}

interface MeetingInputProps {
  onSubmit: (meetingUrl: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  clients: ClientOption[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
}

export function MeetingInput({ onSubmit, isLoading, disabled, clients, selectedClientId, onClientChange }: MeetingInputProps) {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    if (!meetingUrl.trim()) {
      setError('Please enter a meeting URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(meetingUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    try {
      await onSubmit(meetingUrl.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send bot');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Video className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Join Meeting</h2>
          <p className="text-sm text-gray-500">Select a client and enter a meeting URL to send the notetaker bot</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client dropdown */}
        <div>
          <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Select Client
            </span>
          </label>
          <select
            id="client-select"
            value={selectedClientId}
            onChange={(e) => onClientChange(e.target.value)}
            disabled={isLoading || disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Choose a client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Meeting URL input */}
        <div>
          <input
            type="text"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            disabled={isLoading || disabled}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || disabled || !meetingUrl.trim() || !selectedClientId}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending Bot...
            </>
          ) : (
            'Send Bot to Meeting'
          )}
        </button>
      </form>
    </div>
  );
}
