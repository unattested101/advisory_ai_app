import { useEffect, useRef } from 'react';
import { FileText, User } from 'lucide-react';

export interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface TranscriptPanelProps {
  transcript: TranscriptSegment[];
  isConnected: boolean;
  botStatus?: string;
}

export function TranscriptPanel({ transcript, isConnected, botStatus }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'in_call_recording':
      case 'in_call_not_recording':
        return 'bg-green-100 text-green-700';
      case 'joining_call':
      case 'in_waiting_room':
        return 'bg-yellow-100 text-yellow-700';
      case 'done':
      case 'call_ended':
        return 'bg-gray-100 text-gray-700';
      case 'fatal':
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'in_call_recording':
        return 'Recording';
      case 'in_call_not_recording':
        return 'In Call';
      case 'joining_call':
        return 'Joining...';
      case 'in_waiting_room':
        return 'In Waiting Room';
      case 'done':
      case 'call_ended':
        return 'Meeting Ended';
      case 'fatal':
      case 'error':
        return 'Error';
      default:
        return status || 'Connecting...';
    }
  };

  // Group consecutive messages from the same speaker
  const groupedTranscript = transcript.reduce<TranscriptSegment[][]>((groups, segment) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].speaker === segment.speaker) {
      lastGroup.push(segment);
    } else {
      groups.push([segment]);
    }
    return groups;
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Live Transcript</h2>
            <p className="text-sm text-gray-500">Real-time meeting transcription</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-500">Live</span>
            </span>
          )}
          {botStatus && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(botStatus)}`}>
              {getStatusText(botStatus)}
            </span>
          )}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]"
      >
        {groupedTranscript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-center">
              {isConnected 
                ? 'Waiting for transcript...\nSpeak in the meeting to see transcription here.'
                : 'Connect to a meeting to see the transcript'}
            </p>
          </div>
        ) : (
          groupedTranscript.map((group, groupIndex) => (
            <div key={groupIndex} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{group[0].speaker}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(group[0].timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {group.map((seg, i) => (
                    <span 
                      key={i} 
                      className={seg.isFinal ? '' : 'text-gray-400 italic'}
                    >
                      {seg.text}{' '}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
