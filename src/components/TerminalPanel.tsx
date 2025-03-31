
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, TerminalSquare, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseCommand } from '../services/commandParser';

interface TerminalPanelProps {
  onSendCommand: (command: string) => void;
  className?: string;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ onSendCommand, className }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output', content: string, timestamp: Date }>>(
    [{ type: 'output', content: 'Terminal ready. Type a command and press Enter.', timestamp: new Date() }]
  );
  const terminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSendCommand = () => {
    if (!command.trim()) {
      toast({
        title: "Empty Command",
        description: "Please enter a command before sending",
        variant: "destructive"
      });
      return;
    }

    // Add command to history
    setHistory(prev => [...prev, { 
      type: 'input', 
      content: command, 
      timestamp: new Date() 
    }]);

    // Process command
    try {
      // Try to parse the command
      const parsedCommand = parseCommand(command);
      
      if (parsedCommand) {
        onSendCommand(command);
        
        // Add system response
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: `Command "${command}" sent to ESP.`, 
          timestamp: new Date() 
        }]);
      } else {
        // Command wasn't recognized
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: `Unrecognized command: "${command}"`, 
          timestamp: new Date() 
        }]);
      }
    } catch (error) {
      setHistory(prev => [...prev, { 
        type: 'output', 
        content: `Error: ${error instanceof Error ? error.message : String(error)}`, 
        timestamp: new Date() 
      }]);
    }

    // Clear input
    setCommand('');
  };

  const clearTerminal = () => {
    setHistory([{ 
      type: 'output', 
      content: 'Terminal cleared.', 
      timestamp: new Date() 
    }]);
  };

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className={`cyber-panel h-full flex flex-col ${className || ''}`}>
      <div className="border-b border-cyber-blue pb-2 mb-2 flex justify-between items-center">
        <h3 className="font-cyber text-cyber-blue flex items-center">
          <TerminalSquare className="w-4 h-4 mr-2" />
          COMMAND TERMINAL
        </h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={clearTerminal} 
          className="h-7 text-cyber-pink hover:text-white hover:bg-cyber-pink"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto bg-cyber-dark font-mono text-xs p-2 rounded border border-cyber-blue"
      >
        {history.map((entry, index) => (
          <div key={index} className={`mb-1 ${entry.type === 'input' ? 'text-cyber-pink' : 'text-cyber-blue'}`}>
            <span className="opacity-50 mr-2">
              [{entry.timestamp.toLocaleTimeString()}]
            </span>
            <span className="mr-1">
              {entry.type === 'input' ? '>' : '<'}
            </span>
            {entry.content}
          </div>
        ))}
      </div>
      
      <div className="mt-2 flex">
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendCommand();
            }
          }}
          placeholder="Type command and press Enter..."
          className="bg-cyber-dark border-cyber-blue text-cyber-blue font-mono"
        />
        <Button
          onClick={handleSendCommand}
          className="ml-2 bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/80"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TerminalPanel;
