
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import DigitalRain from '@/components/DigitalRain';
import LoginScreen from '@/components/LoginScreen';
import ElevatorVisualization from '@/components/ElevatorVisualization';
import StatusPanel from '@/components/StatusPanel';
import ControlPanel from '@/components/ControlPanel';
import AlertsPanel from '@/components/AlertsPanel';
import LogsPanel from '@/components/LogsPanel';
import TerminalPanel from '@/components/TerminalPanel';
import VoiceControl from '@/components/VoiceControl';
import { useMqtt, useSimulatedElevator } from '@/services/mqttService';
import { 
  ArrowLeftRight,
  LayoutDashboard,
  ListChecks,
  Bell,
  TerminalSquare,
  LogOut,
  Mic,
  Command
} from 'lucide-react';
import { parseCommand } from '@/services/commandParser';

// Default MQTT credentials from Arduino sketch
const DEFAULT_MQTT_USER = "hivemq.webclient.1741534338297";
const DEFAULT_MQTT_PASSWORD = "oU0N>eu5g<c;pV9AE$4F";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mqttUsername, setMqttUsername] = useState(DEFAULT_MQTT_USER);
  const [mqttPassword, setMqttPassword] = useState(DEFAULT_MQTT_PASSWORD);
  const { toast } = useToast();
  
  // Use real MQTT connection with prefilled credentials from Arduino sketch
  const { 
    connected, 
    elevatorStatus, 
    alerts, 
    logs, 
    publishCommand, 
    error: mqttError 
  } = useMqtt({
    username: mqttUsername,
    password: mqttPassword,
    onConnect: () => {
      toast({
        title: "MQTT Connected",
        description: "Successfully connected to elevator MQTT broker",
      });
    },
    onDisconnect: () => {
      toast({
        title: "MQTT Disconnected",
        description: "Connection to elevator MQTT broker lost",
        variant: "destructive"
      });
    },
    onError: (error) => {
      toast({
        title: "MQTT Error",
        description: error.message,
        variant: "destructive"
      });
      setAuthError(error.message);
    }
  });
  
  // Auto-update status indicator
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Update the last updated timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Show MQTT errors
  useEffect(() => {
    if (mqttError) {
      console.error("MQTT Error:", mqttError);
      setAuthError(mqttError.message);
    }
  }, [mqttError]);

  const handleLogin = (username: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    // Update MQTT credentials
    setMqttUsername(username || DEFAULT_MQTT_USER);
    setMqttPassword(password || DEFAULT_MQTT_PASSWORD);
    
    // Simulate authentication with MQTT broker
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
      
      toast({
        title: "Authentication Successful",
        description: "Connected to elevator control system",
      });
    }, 1500);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "Disconnected from elevator control system",
    });
  };

  // Handle voice commands
  const handleVoiceCommand = useCallback((text: string) => {
    if (!text.trim()) return;
    
    try {
      // Try to parse the voice command
      const command = parseCommand(text);
      
      if (command) {
        // Execute the command
        publishCommand(command);
        
        toast({
          title: "Voice Command Executed",
          description: `Command: ${command.action}${command.floor ? ` to floor ${command.floor}` : ''}`,
        });
      } else {
        toast({
          title: "Unrecognized Command",
          description: "Sorry, I couldn't understand that command",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Voice Command Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  }, [publishCommand, toast]);
  
  // Handle terminal commands
  const handleTerminalCommand = useCallback((text: string) => {
    try {
      // Try to send the command directly
      // First check if it's raw JSON
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        try {
          const jsonCommand = JSON.parse(text);
          publishCommand(jsonCommand);
          return;
        } catch (e) {
          // Not valid JSON, continue with parsing
        }
      }
      
      // Try to parse as natural language
      const command = parseCommand(text);
      
      if (command) {
        publishCommand(command);
      } else {
        throw new Error("Unknown command format");
      }
    } catch (error) {
      console.error("Command error:", error);
      throw error;
    }
  }, [publishCommand]);
  
  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <>
        <DigitalRain />
        <div className="scanline"></div>
        <LoginScreen 
          onLogin={handleLogin} 
          isLoading={isAuthenticating}
          error={authError}
          defaultUsername={DEFAULT_MQTT_USER}
          defaultPassword={DEFAULT_MQTT_PASSWORD}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black">
      <DigitalRain />
      <div className="scanline"></div>
      
      {/* Main Layout */}
      <div className="flex flex-col md:flex-row h-screen">
        {/* Sidebar */}
        <div className="w-full md:w-16 md:min-h-screen bg-cyber-dark border-r border-cyber-blue flex md:flex-col justify-between p-2">
          <div className="flex md:flex-col items-center space-x-2 md:space-x-0 md:space-y-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`p-3 rounded-md transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-cyber-blue text-cyber-dark' 
                  : 'text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setActiveTab('control')}
              className={`p-3 rounded-md transition-all duration-200 ${
                activeTab === 'control' 
                  ? 'bg-cyber-blue text-cyber-dark' 
                  : 'text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20'
              }`}
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setActiveTab('alerts')}
              className={`p-3 rounded-md transition-all duration-200 ${
                activeTab === 'alerts' 
                  ? 'bg-cyber-blue text-cyber-dark' 
                  : 'text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20'
              }`}
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-0 right-0 bg-cyber-pink text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('logs')}
              className={`p-3 rounded-md transition-all duration-200 ${
                activeTab === 'logs' 
                  ? 'bg-cyber-blue text-cyber-dark' 
                  : 'text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20'
              }`}
            >
              <ListChecks className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setActiveTab('terminal')}
              className={`p-3 rounded-md transition-all duration-200 ${
                activeTab === 'terminal' 
                  ? 'bg-cyber-blue text-cyber-dark' 
                  : 'text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20'
              }`}
            >
              <Command className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setActiveTab('voice')}
              className={`p-3 rounded-md transition-all duration-200 ${
                activeTab === 'voice' 
                  ? 'bg-cyber-blue text-cyber-dark' 
                  : 'text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-3 text-cyber-pink hover:bg-cyber-pink hover:bg-opacity-20 rounded-md transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header - Fixed to avoid overlapping text issues */}
          <header className="bg-cyber-dark border-b border-cyber-blue py-3 px-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-cyber">
                  <span className="text-cyber-blue">Neon</span>
                  <span className="text-cyber-pink">Elevate</span>
                  <span className="text-cyber-blue ml-2 text-sm md:text-base">v2.0</span>
                </h1>
                
                {/* Status indicators in a cleaner layout */}
                <div className="flex flex-wrap items-center text-xs text-gray-400 mt-1 gap-x-4">
                  <div className="flex items-center">
                    <span className="mr-1">Status:</span>
                    <span className={`${
                      elevatorStatus?.systemState === 'NORMAL' ? 'text-cyber-green' :
                      elevatorStatus?.systemState === 'MAINTENANCE' ? 'text-cyber-yellow' :
                      elevatorStatus?.systemState === 'EMERGENCY' ? 'text-cyber-pink' : 'text-gray-400'
                    }`}>
                      {elevatorStatus?.systemState || 'UNKNOWN'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="mr-1">System:</span>
                    <span className={elevatorStatus ? 'text-cyber-green' : 'text-cyber-pink'}>
                      {elevatorStatus ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-pink'} mr-2`}></div>
                  <span className="text-xs text-gray-300">
                    {connected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                
                <div className="text-cyber-yellow text-xs bg-cyber-dark px-3 py-1 rounded-full border border-cyber-yellow">
                  LIVE SYSTEM
                </div>
                
                {/* Battery display */}
                {elevatorStatus && (
                  <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-cyber-dark bg-opacity-50 rounded">
                    <span className={`text-xs ${
                      elevatorStatus.batteryLevel < 30 ? 'text-cyber-pink' : 
                      elevatorStatus.batteryLevel < 60 ? 'text-cyber-yellow' : 
                      'text-cyber-green'
                    }`}>
                      {elevatorStatus.batteryLevel}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>
          
          {/* Content Area */}
          <main className="flex-1 overflow-auto p-4">
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min">
                {/* 3D Visualization - spans 2 columns */}
                <div className="lg:col-span-2 h-[300px] md:h-[400px]">
                  <ElevatorVisualization status={elevatorStatus} />
                </div>
                
                {/* Status Panel */}
                <div>
                  <StatusPanel status={elevatorStatus} />
                </div>
                
                {/* Control Panel - spans 2 columns on larger screens */}
                <div className="lg:col-span-2">
                  <ControlPanel 
                    status={elevatorStatus} 
                    onCommand={publishCommand}
                  />
                </div>
                
                {/* Alerts Panel */}
                <div>
                  <AlertsPanel alerts={alerts} />
                </div>
              </div>
            )}
            
            {/* Control View */}
            {activeTab === 'control' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 h-[300px] md:h-[400px]">
                  <ElevatorVisualization status={elevatorStatus} />
                </div>
                
                <div>
                  <ControlPanel 
                    status={elevatorStatus} 
                    onCommand={publishCommand}
                  />
                </div>
                
                <div>
                  <StatusPanel status={elevatorStatus} />
                </div>
              </div>
            )}
            
            {/* Alerts View */}
            {activeTab === 'alerts' && (
              <div className="grid grid-cols-1 gap-4">
                <AlertsPanel alerts={alerts} />
              </div>
            )}
            
            {/* Logs View */}
            {activeTab === 'logs' && (
              <div className="grid grid-cols-1 gap-4">
                <LogsPanel logs={logs} />
              </div>
            )}
            
            {/* Terminal View */}
            {activeTab === 'terminal' && (
              <div className="grid grid-cols-1 gap-4">
                <TerminalPanel onSendCommand={handleTerminalCommand} />
              </div>
            )}
            
            {/* Voice Control View */}
            {activeTab === 'voice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <VoiceControl onSpeechResult={handleVoiceCommand} />
                </div>
                <div>
                  <TerminalPanel onSendCommand={handleTerminalCommand} />
                </div>
              </div>
            )}
          </main>
          
          {/* Footer */}
          <footer className="bg-cyber-dark border-t border-cyber-blue py-2 px-4">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>NeonElevate Control Interface</span>
              <span>Last update: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
