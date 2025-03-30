
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface VoiceControlProps {
  onSpeechResult: (text: string) => void;
}

// Handle browser compatibility for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Define the SpeechRecognition type
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

// Get the correct SpeechRecognition object based on browser
const SpeechRecognitionAPI: SpeechRecognitionConstructor | undefined = 
  (window as any).SpeechRecognition || 
  (window as any).webkitSpeechRecognition || 
  undefined;

const VoiceControl: React.FC<VoiceControlProps> = ({ onSpeechResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    // Check if speech recognition is supported
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    // Initialize speech recognition
    try {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        setTranscript(transcript);
        
        if (result.isFinal && !isMuted) {
          onSpeechResult(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error: ${event.error}`);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsSupported(false);
      setError('Failed to initialize speech recognition');
    }
    
    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onSpeechResult, isMuted]);
  
  const handleStartListening = () => {
    setError(null);
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition');
    }
  };
  
  const handleStopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
  };
  
  const handleMicMouseDown = () => {
    if (!isListening) {
      handleStartListening();
    }
  };
  
  const handleMicMouseUp = () => {
    if (isListening) {
      handleStopListening();
    }
  };
  
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };
  
  const handleClearTranscript = () => {
    setTranscript('');
  };
  
  const handleSendCommand = () => {
    if (transcript.trim()) {
      onSpeechResult(transcript);
      setTranscript('');
    }
  };

  return (
    <div className="cyber-panel h-full">
      <div className="border-b border-cyber-blue pb-2 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-cyber text-cyber-blue">VOICE CONTROL</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMuteToggle}
              className={`p-2 rounded ${isMuted ? 'text-cyber-pink bg-cyber-dark' : 'text-cyber-blue hover:bg-cyber-dark'}`}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      {!isSupported ? (
        <div className="bg-cyber-dark bg-opacity-50 p-4 rounded text-center">
          <p className="text-cyber-pink">Speech recognition is not supported in this browser</p>
          <p className="text-gray-400 text-sm mt-2">Try using Chrome or Edge for voice control</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="bg-cyber-dark bg-opacity-50 p-3 rounded-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Transcript</span>
                <button 
                  onClick={handleClearTranscript}
                  className="text-xs text-cyber-blue hover:text-cyber-pink"
                >
                  Clear
                </button>
              </div>
            </div>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="rounded-t-none border-t-0 bg-cyber-dark bg-opacity-30 text-cyber-blue resize-none h-32"
              placeholder="Voice transcript will appear here..."
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {isListening ? (
                <span className="text-cyber-green flex items-center">
                  <span className="w-2 h-2 rounded-full bg-cyber-green mr-2 animate-pulse"></span>
                  Listening...
                </span>
              ) : (
                <span>Press and hold to speak</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSendCommand}
                className="px-3 py-1 text-sm bg-cyber-blue text-cyber-dark rounded"
                disabled={!transcript.trim()}
              >
                Send
              </button>
              
              <button
                onMouseDown={handleMicMouseDown}
                onMouseUp={handleMicMouseUp}
                onTouchStart={handleMicMouseDown}
                onTouchEnd={handleMicMouseUp}
                onMouseLeave={isListening ? handleStopListening : undefined}
                className={`p-3 rounded-full ${
                  isListening 
                    ? 'bg-cyber-pink text-white animate-pulse' 
                    : 'bg-cyber-blue text-cyber-dark hover:bg-opacity-80'
                }`}
              >
                {isListening ? <Mic size={24} /> : <Mic size={24} />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 text-cyber-pink text-sm bg-cyber-dark bg-opacity-50 p-2 rounded">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VoiceControl;
