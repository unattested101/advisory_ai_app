import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Check, Mail } from 'lucide-react';
import { sendActionItemEmail } from '../services/api';

interface ActionItemEmailModalProps {
  clientId: string;
  clientName: string;
  actionItemText: string;
  onClose: () => void;
}

export function ActionItemEmailModal({
  clientId,
  clientName,
  actionItemText,
  onClose,
}: ActionItemEmailModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when modal opens
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, sending]);

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please write a message before sending.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendActionItemEmail({
        clientId,
        actionItemText,
        message: message.trim(),
      });
      setSent(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!sending ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Send Email to Client</h3>
              <p className="text-xs text-gray-500 mt-0.5">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Action item display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Action Item
            </p>
            <p className="text-sm text-gray-900 font-medium leading-relaxed">
              {actionItemText}
            </p>
          </div>

          {/* Message textarea */}
          <div>
            <label
              htmlFor="email-message"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Your message
            </label>
            <textarea
              ref={textareaRef}
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write what you'd like to communicate to the client about this action item..."
              rows={5}
              disabled={sending || sent}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-gray-50"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || sent || !message.trim()}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all disabled:cursor-not-allowed ${
              sent
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50'
            }`}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : sent ? (
              <>
                <Check className="w-4 h-4" />
                Sent!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
