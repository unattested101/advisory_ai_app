import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Check, Mail } from 'lucide-react';
import { sendActionItemEmail } from '../services/api';

interface ActionItemEmailModalProps {
  clientId: string;
  clientName: string;
  actionItemText: string;
  onClose: () => void;
}

// Generate a draft email message based on the action item text
function generateEmailDraft(clientName: string, actionItemText: string): string {
  const firstName = clientName.split(' ')[0];
  const lowerText = actionItemText.toLowerCase();

  // Document-related action items
  if (lowerText.includes('document') || lowerText.includes('paperwork') || lowerText.includes('form')) {
    return `Hi ${firstName},\n\nFollowing up on our recent meeting, I wanted to remind you about the documentation we discussed: ${actionItemText}\n\nPlease let me know if you need any assistance gathering these documents or have any questions.\n\nBest regards`;
  }

  // Review-related action items
  if (lowerText.includes('review') || lowerText.includes('check') || lowerText.includes('assess')) {
    return `Hi ${firstName},\n\nI hope this email finds you well. As discussed in our meeting, I wanted to follow up regarding: ${actionItemText}\n\nI'll be working on this and will share my findings with you shortly. In the meantime, please feel free to reach out if you have any questions.\n\nBest regards`;
  }

  // Meeting or call related
  if (lowerText.includes('meeting') || lowerText.includes('call') || lowerText.includes('schedule') || lowerText.includes('appointment')) {
    return `Hi ${firstName},\n\nI wanted to follow up on scheduling our discussion regarding: ${actionItemText}\n\nPlease let me know your availability and I'll coordinate accordingly.\n\nBest regards`;
  }

  // Financial planning related
  if (lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('portfolio') || lowerText.includes('investment')) {
    return `Hi ${firstName},\n\nFollowing our recent conversation, I wanted to touch base about: ${actionItemText}\n\nI'm currently working on the analysis and will have recommendations ready for our next discussion. Please don't hesitate to reach out if you have any questions in the meantime.\n\nBest regards`;
  }

  // Payment or transfer related
  if (lowerText.includes('payment') || lowerText.includes('transfer') || lowerText.includes('contribution') || lowerText.includes('deposit')) {
    return `Hi ${firstName},\n\nI'm writing to follow up on the action item from our meeting: ${actionItemText}\n\nPlease let me know once this has been completed, or if you need any assistance with the process.\n\nBest regards`;
  }

  // Sign or approval related
  if (lowerText.includes('sign') || lowerText.includes('approve') || lowerText.includes('confirm') || lowerText.includes('authorise') || lowerText.includes('authorize')) {
    return `Hi ${firstName},\n\nI wanted to remind you about the following item that requires your attention: ${actionItemText}\n\nIf you have any questions before proceeding, please don't hesitate to get in touch.\n\nBest regards`;
  }

  // Default general follow-up
  return `Hi ${firstName},\n\nI hope you're doing well. I wanted to follow up on the action item from our recent meeting: ${actionItemText}\n\nPlease let me know if you have any questions or need any assistance.\n\nBest regards`;
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

  // Auto-generate email draft based on action item type
  useEffect(() => {
    const draft = generateEmailDraft(clientName, actionItemText);
    setMessage(draft);
  }, [clientName, actionItemText]);

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
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="email-message"
                className="block text-sm font-medium text-gray-700"
              >
                Email message
              </label>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                Draft ready
              </span>
            </div>
            <textarea
              ref={textareaRef}
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write what you'd like to communicate to the client about this action item..."
              rows={8}
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">
            Email will be sent to {clientName}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || sent || !message.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-sm disabled:cursor-not-allowed ${
                sent
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md disabled:opacity-50'
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
    </div>
  );
}
