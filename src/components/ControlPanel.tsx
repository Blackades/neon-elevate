
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ElevatorStatus, ElevatorCommand } from '../services/mqttService';
import {
  ArrowUp,
  ArrowDown,
  DoorOpen,
  DoorClosed,
  AlertOctagon,
  Settings,
  PowerOff,
  Lock,
  RefreshCw,
  Wifi,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface ControlPanelProps {
  status: ElevatorStatus | null;
  onCommand: (command: ElevatorCommand) => void;
  className?: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ status, onCommand, className }) => {
  const [confirmingEmergency, setConfirmingEmergency] = useState(false);
  const [displayMessage, setDisplayMessage] = useState('');
  const { toast } = useToast();

  if (!status) {
    return (
      <div className={`cyber-panel ${className || ''}`}>
        <div className="text-center py-4">
          <p className="text-cyber-blue">Connecting to elevator controls...</p>
        </div>
      </div>
    );
  }

  const totalFloors = 3; // Hard-coded to 3 floors to match the Arduino sketch
  const currentFloor = status.floor;
  
  const handleFloorSelect = (floor: number) => {
    if (floor === currentFloor) {
      toast({
        title: "Already on floor",
        description: `Elevator is already at floor ${floor}`,
      });
      return;
    }
    
    if (status.systemState === 'MAINTENANCE') {
      toast({
        title: "Maintenance Mode Active",
        description: "Elevator movement is disabled during maintenance",
        variant: "destructive"
      });
      return;
    }
    
    onCommand({
      action: 'move',
      floor
    });
    
    toast({
      title: "Command Sent",
      description: `Moving to floor ${floor}`,
    });
  };
  
  const handleDoorControl = (action: 'open' | 'close') => {
    if (status.systemState === 'MAINTENANCE') {
      toast({
        title: "Maintenance Mode Active",
        description: "Door control is disabled during maintenance",
        variant: "destructive"
      });
      return;
    }
    
    if (action === 'open' && status.doorOpen) {
      toast({
        title: "Door already open",
        description: "The elevator doors are already open",
      });
      return;
    }
    
    if (action === 'close' && !status.doorOpen) {
      toast({
        title: "Door already closed",
        description: "The elevator doors are already closed",
      });
      return;
    }
    
    onCommand({
      action
    });
    
    toast({
      title: "Command Sent",
      description: `${action === 'open' ? 'Opening' : 'Closing'} elevator doors`,
    });
  };
  
  const handleEmergency = () => {
    if (confirmingEmergency) {
      onCommand({
        action: 'emergency',
        override: true
      });
      
      toast({
        title: "EMERGENCY STOP ACTIVATED",
        description: "Emergency protocols engaged, elevator stopped",
        variant: "destructive"
      });
      
      setConfirmingEmergency(false);
    } else {
      setConfirmingEmergency(true);
      
      // Auto-cancel after 3 seconds
      setTimeout(() => {
        setConfirmingEmergency(false);
      }, 3000);
    }
  };
  
  const handleMaintenanceToggle = () => {
    onCommand({
      action: 'maintenance'
    });
    
    toast({
      title: `Maintenance Mode ${status.systemState === 'MAINTENANCE' ? 'Deactivated' : 'Activated'}`,
      description: `System ${status.systemState === 'MAINTENANCE' ? 'returned to' : 'entering'} maintenance state`,
    });
  };

  const handleDisplayMessage = () => {
    if (!displayMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to display",
        variant: "destructive"
      });
      return;
    }
    
    onCommand({
      action: 'display_message',
      message: displayMessage
    });
    
    toast({
      title: "Message Sent",
      description: "Message sent to ESP display",
    });
    
    setDisplayMessage('');
  };

  const handleEspRestart = () => {
    if (window.confirm("Are you sure you want to restart the ESP8266?")) {
      onCommand({
        action: 'restart_esp'
      });
      
      toast({
        title: "Restart Command Sent",
        description: "ESP8266 is restarting, connection will be lost temporarily",
      });
    }
  };

  const handleWifiScan = () => {
    onCommand({
      action: 'wifi_scan'
    });
    
    toast({
      title: "WiFi Scan Requested",
      description: "Scanning for nearby networks...",
    });
  };

  // Calculate grid layout based on number of floors
  const getGridCols = () => {
    if (totalFloors <= 5) return 'grid-cols-1';
    if (totalFloors <= 10) return 'grid-cols-2';
    if (totalFloors <= 21) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`cyber-panel ${className || ''}`}>
      <div className="border-b border-cyber-blue pb-2 mb-4">
        <h3 className="font-cyber text-cyber-blue">ELEVATOR CONTROL</h3>
      </div>
      
      <div className="space-y-6">
        {/* Floor Selection Grid */}
        <div>
          <h4 className="text-sm font-cyber text-gray-400 mb-2">FLOOR SELECTION</h4>
          <div className={`grid ${getGridCols()} gap-2`}>
            {Array.from({ length: totalFloors }, (_, i) => i + 1).map((floor) => (
              <button
                key={floor}
                onClick={() => handleFloorSelect(floor)}
                disabled={status.systemState === 'MAINTENANCE'}
                className={`
                  py-3 rounded font-cyber border 
                  ${floor === currentFloor 
                    ? 'bg-cyber-blue text-cyber-dark border-cyber-blue' 
                    : 'bg-cyber-dark text-cyber-blue border-cyber-blue bg-opacity-60 hover:bg-opacity-80'}
                  transition-all duration-200
                  ${status.systemState === 'MAINTENANCE' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {floor}
              </button>
            ))}
          </div>
        </div>
        
        {/* Door Control & Emergency */}
        <div>
          <h4 className="text-sm font-cyber text-gray-400 mb-2">DOOR CONTROL</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleDoorControl('open')}
              disabled={status.systemState === 'MAINTENANCE'}
              variant="outline"
              className={`
                bg-cyber-dark border-cyber-blue hover:bg-cyber-blue hover:text-cyber-dark
                ${status.doorOpen ? 'bg-cyber-blue bg-opacity-20' : ''}
                ${status.systemState === 'MAINTENANCE' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <DoorOpen className="w-4 h-4 mr-2" />
              Open Door
            </Button>
            
            <Button
              onClick={() => handleDoorControl('close')}
              disabled={status.systemState === 'MAINTENANCE'}
              variant="outline"
              className={`
                bg-cyber-dark border-cyber-blue hover:bg-cyber-blue hover:text-cyber-dark
                ${!status.doorOpen ? 'bg-cyber-blue bg-opacity-20' : ''}
                ${status.systemState === 'MAINTENANCE' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <DoorClosed className="w-4 h-4 mr-2" />
              Close Door
            </Button>
          </div>
        </div>
        
        {/* Emergency Stop */}
        <div>
          <h4 className="text-sm font-cyber text-gray-400 mb-2">EMERGENCY CONTROLS</h4>
          <Button
            onClick={handleEmergency}
            variant="outline"
            className={`
              w-full py-6 border-2
              ${confirmingEmergency 
                ? 'bg-cyber-pink text-white border-cyber-pink animate-pulse' 
                : 'bg-cyber-dark border-cyber-pink text-cyber-pink hover:bg-cyber-pink hover:text-white'}
            `}
          >
            <AlertOctagon className={`w-5 h-5 mr-2 ${confirmingEmergency ? 'animate-spin' : ''}`} />
            {confirmingEmergency ? 'CONFIRM EMERGENCY STOP' : 'EMERGENCY STOP'}
          </Button>
        </div>
        
        {/* Maintenance Mode */}
        <div>
          <h4 className="text-sm font-cyber text-gray-400 mb-2">SYSTEM CONTROLS</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleMaintenanceToggle}
              variant="outline"
              className={`
                border
                ${status.systemState === 'MAINTENANCE'
                  ? 'bg-cyber-yellow text-cyber-dark border-cyber-yellow' 
                  : 'bg-cyber-dark border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow hover:text-cyber-dark'}
              `}
            >
              <Settings className={`w-4 h-4 mr-2 ${status.systemState === 'MAINTENANCE' ? 'animate-spin' : ''}`} />
              {status.systemState === 'MAINTENANCE' ? 'Exit Maintenance' : 'Maintenance Mode'}
            </Button>
            
            <Button
              onClick={handleEspRestart}
              variant="outline"
              className="bg-cyber-dark border-cyber-pink text-cyber-pink hover:bg-cyber-pink hover:text-cyber-dark"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart ESP
            </Button>
          </div>
        </div>
        
        {/* ESP Display Message */}
        <div>
          <h4 className="text-sm font-cyber text-gray-400 mb-2">ESP DISPLAY MESSAGE</h4>
          <div className="flex space-x-2">
            <Input 
              type="text" 
              placeholder="Enter message for LCD display..." 
              value={displayMessage}
              onChange={(e) => setDisplayMessage(e.target.value)}
              className="bg-cyber-dark border-cyber-blue text-cyber-blue"
              maxLength={16}
            />
            <Button
              onClick={handleDisplayMessage}
              variant="outline"
              className="bg-cyber-dark border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-cyber-dark whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Max 16 characters for best display
          </div>
        </div>
        
        {/* Advanced Controls */}
        <div>
          <h4 className="text-sm font-cyber text-gray-400 mb-2">DIAGNOSTIC TOOLS</h4>
          <Button
            onClick={handleWifiScan}
            variant="outline"
            className="w-full bg-cyber-dark border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-cyber-dark"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Run WiFi Scanner
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
