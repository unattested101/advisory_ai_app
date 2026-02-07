import { useState, useEffect, useCallback, useRef } from 'react';
import { getEventsUrl } from '../services/api';
import type { TranscriptSegment } from '../components/TranscriptPanel';

interface SSEEvent {
  type: 'connected' | 'transcript' | 'history' | 'status' | 'meeting_ended' | 'error';
  botId?: string;
  segment?: TranscriptSegment;
  transcript?: TranscriptSegment[];
  status?: {
    code: string;
    message: string;
    timestamp: string;
  };
  message?: string;
}

interface UseTranscriptStreamReturn {
  transcript: TranscriptSegment[];
  botStatus: string | undefined;
  isConnected: boolean;
  meetingEnded: boolean;
  error: string | null;
  connect: (botId: string) => void;
  disconnect: () => void;
  clearTranscript: () => void;
}

export function useTranscriptStream(): UseTranscriptStreamReturn {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [botStatus, setBotStatus] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentBotIdRef = useRef<string | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    currentBotIdRef.current = null;
  }, []);

  const connect = useCallback((botId: string) => {
    // Disconnect existing connection if any
    disconnect();

    setError(null);
    setMeetingEnded(false);
    currentBotIdRef.current = botId;

    const url = getEventsUrl(botId);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened for bot:', botId);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        console.log('SSE event received:', data);

        switch (data.type) {
          case 'connected':
            setIsConnected(true);
            break;

          case 'transcript':
            if (data.segment) {
              setTranscript(prev => [...prev, data.segment!]);
            }
            break;

          case 'history':
            if (data.transcript && Array.isArray(data.transcript)) {
              setTranscript(data.transcript);
            }
            break;

          case 'status':
            if (data.status?.code) {
              setBotStatus(data.status.code);
            }
            break;

          case 'meeting_ended':
            setMeetingEnded(true);
            setBotStatus('done');
            break;

          case 'error':
            setError(data.message || 'An error occurred');
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      
      // Only set error if we haven't ended the meeting normally
      if (!meetingEnded) {
        setError('Connection lost. Please try again.');
      }
    };
  }, [disconnect, meetingEnded]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setBotStatus(undefined);
    setMeetingEnded(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    transcript,
    botStatus,
    isConnected,
    meetingEnded,
    error,
    connect,
    disconnect,
    clearTranscript
  };
}
