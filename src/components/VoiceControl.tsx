
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceControlProps {
  onSpeechResult: (text: string) => void;
  className?: string;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ onSpeechResult, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check if browser supports SpeechRecognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!('webkitSpeechRecognition' in window) && 
        !('SpeechRecognition' in window)) {
      setIsSupported(false);
      toast({
        title: "Voice Control Unavailable",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const startListening = () => {
    if (!isSupported) return;
    
    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Set up event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setTranscript(currentTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: "Voice Recognition Error",
          description: event.error,
          variant: "destructive"
        });
        stopListening();
      };
      
      // Start listening
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Voice Control Error",
        description: "Failed to start voice recognition",
        variant: "destructive"
      });
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Process final transcript
      if (transcript.trim()) {
        onSpeechResult(transcript.trim());
      }
    }
  };

  // Handle press and hold
  const handleMouseDown = () => {
    startListening();
  };
  
  const handleMouseUp = () => {
    stopListening();
  };
  
  const handleTouchStart = () => {
    startListening();
  };
  
  const handleTouchEnd = () => {
    stopListening();
  };

  return (
    <div className={`flex flex-col ${className || ''}`}>
      <div className="border-b border-cyber-blue pb-2 mb-2">
        <h3 className="font-cyber text-cyber-blue">VOICE CONTROL</h3>
      </div>
      
      <div className="flex-1 flex flex-col items-center">
        <Button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={!isSupported}
          className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-200 ${
            isListening 
              ? 'bg-cyber-pink text-white animate-pulse scale-110' 
              : 'bg-cyber-dark text-cyber-blue hover:bg-cyber-blue hover:text-cyber-dark'
          }`}
        >
          {isListening ? (
            <Mic className="w-12 h-12" />
          ) : (
            <MicOff className="w-12 h-12" />
          )}
        </Button>
        
        <p className="text-xs text-center text-gray-400 mb-2">
          {isSupported 
            ? (isListening 
                ? "I'm listening... Release when done." 
                : "Press & hold to speak")
            : "Voice control not supported in your browser"}
        </p>
        
        <div className={`w-full p-2 bg-cyber-dark border ${
          isListening ? 'border-cyber-pink' : 'border-cyber-blue'
        } rounded text-sm min-h-14 max-h-28 overflow-auto`}>
          {transcript || (isListening ? "Listening..." : "Spoken commands will appear here")}
        </div>
      </div>
    </div>
  );
};

// Add this for TypeScript to recognize the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default VoiceControl;
