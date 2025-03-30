
import React from 'react';
import { ElevatorStatus } from '../services/mqttService';
import { Progress } from '@/components/ui/progress';
import { 
  Thermometer, 
  Battery, 
  Weight, 
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Clock,
  Cpu,
  Signal,
  Database,
  Server
} from 'lucide-react';

interface StatusPanelProps {
  status: ElevatorStatus | null;
  className?: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ status, className }) => {
  if (!status) {
    return (
      <div className={`cyber-panel ${className || ''}`}>
        <div className="text-center py-4">
          <p className="text-cyber-blue">Connecting to elevator system...</p>
        </div>
      </div>
    );
  }

  // Format date for display
  const lastUpdated = new Date(status.lastUpdated);
  const timeString = lastUpdated.toLocaleTimeString();
  
  // Determine status color based on overall health
  const getHealthStatus = () => {
    if (status.systemState === 'MAINTENANCE') return "text-cyber-yellow";
    if (status.batteryLevel < 30 || status.temperature > 35) return "text-cyber-pink";
    return "text-cyber-green";
  };

  // Convert battery percentage to voltage (approximation)
  const batteryVoltage = ((status.batteryLevel / 100) * 12.6).toFixed(1);

  return (
    <div className={`cyber-panel ${className || ''}`}>
      <div className="border-b border-cyber-blue pb-2 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-cyber text-cyber-blue">SYSTEM STATUS</h3>
          <div className={`flex items-center ${getHealthStatus()}`}>
            <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
            <span className="text-xs uppercase">
              {status.systemState === 'MAINTENANCE' ? "MAINTENANCE" : 
                (getHealthStatus() === "text-cyber-pink" ? "WARNING" : "NOMINAL")}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Temperature Status */}
        <div className="bg-cyber-dark bg-opacity-50 p-3 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Thermometer className="w-4 h-4 text-cyber-blue mr-2" />
              <span className="text-sm text-gray-300">Temperature</span>
            </div>
            <span className={`font-mono ${status.temperature > 35 ? 'text-cyber-pink' : 
              status.temperature > 30 ? 'text-cyber-yellow' : 'text-cyber-blue'}`}>
              {status.temperature.toFixed(1)}°C
            </span>
          </div>
          <Progress value={status.temperature * 2} 
            className="h-1 bg-gray-700" 
            indicatorClassName={
              status.temperature > 35 ? 'bg-cyber-pink' : 
              status.temperature > 30 ? 'bg-cyber-yellow' : 'bg-cyber-blue'
            } />
        </div>
        
        {/* Battery Status */}
        <div className="bg-cyber-dark bg-opacity-50 p-3 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Battery className="w-4 h-4 text-cyber-blue mr-2" />
              <span className="text-sm text-gray-300">Battery</span>
            </div>
            <span className={`font-mono ${status.batteryLevel < 30 ? 'text-cyber-pink' : 
              status.batteryLevel < 50 ? 'text-cyber-yellow' : 'text-cyber-blue'}`}>
              {status.batteryLevel}% ({batteryVoltage}V)
            </span>
          </div>
          <Progress value={status.batteryLevel} 
            className="h-1 bg-gray-700" 
            indicatorClassName={
              status.batteryLevel < 30 ? 'bg-cyber-pink' : 
              status.batteryLevel < 50 ? 'bg-cyber-yellow' : 'bg-cyber-blue'
            } />
        </div>
        
        {/* Weight Status */}
        <div className="bg-cyber-dark bg-opacity-50 p-3 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Weight className="w-4 h-4 text-cyber-blue mr-2" />
              <span className="text-sm text-gray-300">Weight</span>
            </div>
            <span className="font-mono text-cyber-blue">
              {status.weight} kg
            </span>
          </div>
          <Progress value={(status.weight / 1000) * 100} 
            className="h-1 bg-gray-700" 
            indicatorClassName="bg-cyber-blue" />
        </div>
        
        {/* Direction & Speed */}
        <div className="bg-cyber-dark bg-opacity-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {status.direction === 'up' ? (
                <ArrowUp className="w-4 h-4 text-cyber-green mr-2" />
              ) : status.direction === 'down' ? (
                <ArrowDown className="w-4 h-4 text-cyber-pink mr-2" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center text-cyber-yellow mr-2">∞</span>
              )}
              <span className="text-sm text-gray-300">Direction</span>
            </div>
            <span className={`font-mono uppercase ${
              status.direction === 'up' ? 'text-cyber-green' : 
              status.direction === 'down' ? 'text-cyber-pink' : 
              'text-cyber-yellow'
            }`}>
              {status.direction}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-300">Target Floor</span>
            <span className="font-mono text-cyber-blue">
              {status.target || 'None'}
            </span>
          </div>
        </div>
        
        {/* System State */}
        <div className="bg-cyber-dark bg-opacity-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">System State</span>
            <span className={`font-mono ${
              status.systemState === 'NORMAL' ? 'text-cyber-green' : 
              status.systemState === 'MAINTENANCE' ? 'text-cyber-yellow' : 
              status.systemState === 'EMERGENCY' ? 'text-cyber-pink' : 
              'text-cyber-blue'
            }`}>
              {status.systemState}
            </span>
          </div>
        </div>
        
        {/* Door Status */}
        <div className="bg-cyber-dark bg-opacity-50 p-3 rounded flex justify-between items-center">
          <span className="text-sm text-gray-300">Door Status</span>
          <span className={`font-mono ${status.doorOpen ? 'text-cyber-green' : 'text-cyber-pink'}`}>
            {status.doorOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        
        {/* ESP Stats - Only if available */}
        {(status.esp_heap || status.esp_uptime || status.wifi_rssi) && (
          <div className="bg-cyber-dark bg-opacity-50 p-3 rounded">
            <div className="text-xs text-cyber-blue mb-2 uppercase">ESP8266 Stats</div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {status.esp_heap && (
                <div className="flex items-center">
                  <Database className="w-3 h-3 mr-1 text-cyber-yellow" />
                  <span className="text-gray-300">Heap: </span>
                  <span className="ml-1 text-cyber-yellow">{status.esp_heap} bytes</span>
                </div>
              )}
              
              {status.esp_uptime && (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-cyber-blue" />
                  <span className="text-gray-300">Up: </span>
                  <span className="ml-1 text-cyber-blue">
                    {Math.floor(status.esp_uptime / 3600)}h {Math.floor((status.esp_uptime % 3600) / 60)}m
                  </span>
                </div>
              )}
              
              {status.wifi_rssi && (
                <div className="flex items-center">
                  <Signal className="w-3 h-3 mr-1 text-cyber-green" />
                  <span className="text-gray-300">RSSI: </span>
                  <span className="ml-1 text-cyber-green">{status.wifi_rssi} dBm</span>
                </div>
              )}
              
              {status.mega_connected !== undefined && (
                <div className="flex items-center">
                  <Server className="w-3 h-3 mr-1 text-cyber-blue" />
                  <span className="text-gray-300">Mega: </span>
                  <span className={`ml-1 ${status.mega_connected ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                    {status.mega_connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Last updated timestamp */}
        <div className="text-xs text-gray-500 flex items-center mt-2">
          <Clock className="w-3 h-3 mr-1" />
          <span>Last updated: {timeString}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
