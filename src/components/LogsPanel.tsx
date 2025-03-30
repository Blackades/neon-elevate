
import React, { useState, useEffect, useRef } from 'react';
import { ElevatorLog } from '../services/mqttService';
import { 
  Clock,
  Filter,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogsPanelProps {
  logs: ElevatorLog[];
  className?: string;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ logs, className }) => {
  const [filter, setFilter] = useState<string>('all');
  const [visibleLogs, setVisibleLogs] = useState<ElevatorLog[]>(logs);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };
  
  // Update visible logs when filter or logs change
  useEffect(() => {
    if (filter === 'all') {
      setVisibleLogs(logs);
    } else {
      setVisibleLogs(logs.filter(log => log.action.toLowerCase() === filter.toLowerCase()));
    }
  }, [logs, filter]);
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [visibleLogs]);
  
  // Get unique action types for filter
  const actionTypes = Array.from(new Set(logs.map(log => log.action.toLowerCase())));
  
  // Get style based on action type
  const getActionStyle = (action: string) => {
    const actionLower = action.toLowerCase();
    
    switch (actionLower) {
      case 'move':
        return 'text-cyber-blue';
      case 'stop':
        return 'text-cyber-yellow';
      case 'door':
        return 'text-cyber-green';
      case 'emergency':
        return 'text-cyber-pink';
      case 'maintenance':
        return 'text-cyber-yellow';
      case 'startup':
        return 'text-cyber-purple';
      default:
        return 'text-cyber-blue';
    }
  };

  return (
    <div className={`cyber-panel ${className || ''}`}>
      <div className="border-b border-cyber-blue pb-2 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-cyber text-cyber-blue">SYSTEM LOGS</h3>
          <div className="flex items-center space-x-2">
            <div className="relative inline-block text-left">
              <Button
                variant="outline"
                size="sm"
                className="bg-cyber-dark border-cyber-blue text-cyber-blue text-xs px-2 py-1 h-auto"
              >
                <Filter className="w-3 h-3 mr-1" />
                {filter === 'all' ? 'All Logs' : filter.toUpperCase()}
              </Button>
              <div className="absolute right-0 mt-1 w-36 rounded-md shadow-lg bg-cyber-dark z-10 border border-cyber-blue hidden group-hover:block">
                <div className="py-1">
                  <button
                    onClick={() => setFilter('all')}
                    className="block w-full text-left px-4 py-2 text-xs text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20"
                  >
                    All Logs
                  </button>
                  {actionTypes.map(action => (
                    <button
                      key={action}
                      onClick={() => setFilter(action)}
                      className="block w-full text-left px-4 py-2 text-xs text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20"
                    >
                      {action.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-cyber-dark border-cyber-blue text-cyber-blue text-xs px-2 py-1 h-auto"
              onClick={() => {
                if (logsContainerRef.current) {
                  logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
                }
              }}
            >
              <RefreshCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      <div 
        ref={logsContainerRef}
        className="space-y-2 max-h-[400px] overflow-y-auto pr-2 font-cyber-mono text-sm"
      >
        {visibleLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No logs available</p>
          </div>
        ) : (
          visibleLogs.map((log) => (
            <div 
              key={log.id} 
              className="bg-cyber-dark bg-opacity-30 p-2 rounded border-l-2 border-cyber-blue"
            >
              <div className="flex items-start">
                <div className="mr-2 flex items-center">
                  <Clock className="w-3 h-3 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-xs font-bold ${getActionStyle(log.action)}`}>
                      {log.action}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs mt-1 opacity-80">
                    {log.details}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-block bg-cyber-blue bg-opacity-10 rounded-full px-3 py-1 text-xs text-cyber-blue">
          {logs.length} log entries
        </div>
      </div>
    </div>
  );
};

export default LogsPanel;
