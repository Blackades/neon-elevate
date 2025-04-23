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
import { useMqtt, useSimulatedElevator, LCDMessage } from '@/services/mqttService';
import { 
  ArrowLeftRight,
  LayoutDashboard,
  ListChecks,
  Bell,
  TerminalSquare,
  LogOut,
  Mic,
  Command,
  MonitorSmartphone
} from 'lucide-react';
import { parseCommand } from '@/services/commandParser';
import Logo from '@/components/Logo';

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
  
  const [shownConnectNotification, setShownConnectNotification] = useState(false);
  const [shownDisconnectNotification, setShownDisconnectNotification] = useState(false);
  
  const [lcdMessage, setLcdMessage] = useState('');
  const [lcdMessageLine2, setLcdMessageLine2] = useState('');
  
  const { 
    connected, 
    elevatorStatus, 
    alerts, 
    logs, 
    publishCommand, 
    publishLCDMessage,
    error: mqttError 
  } = useMqtt({
    username: mqttUsername,
    password: mqttPassword,
    onConnect: () => {
      if (!shownConnectNotification) {
        toast({
          title: "MQTT Connected",
          description: "Successfully connected to elevator MQTT broker",
        });
        setShownConnectNotification(true);
        setShownDisconnectNotification(false);
      }
    },
    onDisconnect: () => {
      if (!shownDisconnectNotification) {
        toast({
          title: "MQTT Disconnected",
          description: "Connection to elevator MQTT broker lost",
          variant: "destructive"
        });
        setShownDisconnectNotification(true);
        setShownConnectNotification(false);
      }
    },
    onError: (error) => {
      if (!authError || authError !== error.message) {
        toast({
          title: "MQTT Error",
          description: error.message,
          variant: "destructive"
        });
        setAuthError(error.message);
      }
    }
  });
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (mqttError) {
      console.error("MQTT Error:", mqttError);
      setAuthError(mqttError.message);
    }
  }, [mqttError]);

  const handleLogin = (username: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    setShownConnectNotification(false);
    setShownDisconnectNotification(false);
    
    setMqttUsername(username || DEFAULT_MQTT_USER);
    setMqttPassword(password || DEFAULT_MQTT_PASSWORD);
    
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
    setShownConnectNotification(false);
    setShownDisconnectNotification(false);
    
    toast({
      title: "Logged Out",
      description: "Disconnected from elevator control system",
    });
  };

  const handleVoiceCommand = useCallback((text: string) => {
    if (!text.trim()) return;
    
    try {
      const command = parseCommand(text);
      
      if (command) {
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
  
  const handleTerminalCommand = useCallback((text: string) => {
    try {
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        try {
          const jsonCommand = JSON.parse(text);
          publishCommand(jsonCommand);
          return;
        } catch (e) {
          // Not valid JSON, continue with parsing
        }
      }
      
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
  
  const handleSendLCDMessage = useCallback(() => {
    if (!lcdMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to display on the LCD",
        variant: "destructive"
      });
      return;
    }
    
    const lcdMessageObj: LCDMessage = {
      message: lcdMessage.trim()
    };
    
    if (lcdMessageLine2.trim()) {
      lcdMessageObj.line2 = lcdMessageLine2.trim();
    }
    
    const success = publishLCDMessage(lcdMessageObj);
    
    if (success) {
      toast({
        title: "Message Sent",
        description: "LCD message sent to elevator display"
      });
      
      publishCommand({
        command: 'display_message',
        message: lcdMessage.trim(),
        line2: lcdMessageLine2.trim() || undefined
      });
      
      setLcdMessage('');
      setLcdMessageLine2('');
    } else {
      toast({
        title: "Send Failed",
        description: "Failed to send LCD message. Check connection.",
        variant: "destructive"
      });
    }
  }, [lcdMessage, lcdMessageLine2, publishLCDMessage, publishCommand, toast]);
  
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
      
      <div className="flex flex-col md:flex-row h-screen">
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
            
            <button 
              onClick={() => setActiveTab('lcd')}
              className={`p-3 rounded-md transition-all duration-200 ${
                activeTab === 'lcd' 
                  ? 'bg-cyber-blue text-cyber-dark' 
                  : 'text-cyber-blue hover:bg-cyber-blue hover:bg-opacity-20'
              }`}
            >
              <MonitorSmartphone className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-3 text-cyber-pink hover:bg-cyber-pink hover:bg-opacity-20 rounded-md transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <header className="bg-cyber-dark border-b border-cyber-blue py-3 px-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div className="flex items-center flex-shrink-0 space-x-4">
                <Logo />
                <div>
                  <h1 className="text-xl md:text-2xl font-cyber neon-text-multicolor">
                    NeonElevate
                    <span className="text-cyber-blue ml-2 text-sm md:text-base">v2.0</span>
                  </h1>
                </div>
              </div>
              
              <div className="bg-cyber-dark/50 border border-cyber-blue rounded-md py-1 px-3 mr-2">
                <div className="flex items-center space-x-2">
                  <span className="text-cyber-blue">Floor: </span>
                  <span className="text-cyber-pink font-bold">{elevatorStatus?.floor || '?'}</span>
                  
                  <span className="text-cyber-blue ml-2">Doors: </span>
                  <span className={elevatorStatus?.doorOpen ? "text-cyber-green" : "text-cyber-pink"}>
                    {elevatorStatus?.doorOpen ? "OPEN" : "CLOSED"}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-cyber-dark/50 border border-cyber-blue/30 rounded px-3 py-1">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Floor:</span>
                      <span className="text-cyber-pink font-bold">
                        {elevatorStatus?.floor || '?'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Status:</span>
                      <span className={`text-xs ${
                        elevatorStatus?.systemState === 'NORMAL' ? 'text-cyber-green' :
                        elevatorStatus?.systemState === 'MAINTENANCE' ? 'text-cyber-yellow' :
                        elevatorStatus?.systemState === 'EMERGENCY' ? 'text-cyber-pink' : 'text-gray-400'
                      }`}>
                        {elevatorStatus?.systemState || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-cyber-dark/50 border border-cyber-blue/30 rounded px-3 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">System:</span>
                    <span className={elevatorStatus ? 'text-cyber-green' : 'text-cyber-pink'}>
                      {elevatorStatus ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">MQTT:</span>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-pink'} mr-1`}></div>
                      <span className="text-xs text-gray-300">
                        {connected ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-cyber-yellow text-xs bg-cyber-dark px-3 py-1 rounded-full border border-cyber-yellow">
                  LIVE SYSTEM
                </div>
                
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
          
          <main className="flex-1 overflow-auto p-4">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min">
                <div className="lg:col-span-2 h-[300px] md:h-[400px]">
                  <ElevatorVisualization status={elevatorStatus} />
                </div>
                
                <div>
                  <StatusPanel status={elevatorStatus} />
                </div>
                
                <div className="lg:col-span-2">
                  <ControlPanel 
                    status={elevatorStatus} 
                    onCommand={publishCommand}
                  />
                </div>
                
                <div>
                  <AlertsPanel alerts={alerts} />
                </div>
              </div>
            )}
            
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
            
            {activeTab === 'alerts' && (
              <div className="grid grid-cols-1 gap-4">
                <AlertsPanel alerts={alerts} />
              </div>
            )}
            
            {activeTab === 'logs' && (
              <div className="grid grid-cols-1 gap-4">
                <LogsPanel logs={logs} />
              </div>
            )}
            
            {activeTab === 'terminal' && (
              <div className="grid grid-cols-1 gap-4">
                <TerminalPanel onSendCommand={handleTerminalCommand} />
              </div>
            )}
            
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
            
            {activeTab === 'lcd' && (
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-cyber-dark border border-cyber-blue rounded-md">
                  <h2 className="text-xl text-cyber-blue mb-4">LCD Display Control</h2>
                  <p className="text-gray-400 text-sm mb-4">
                    Send custom messages to be displayed on the elevator's LCD screen. The message will be displayed for approximately 3 seconds.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="line1" className="block text-sm text-cyber-green mb-2">Line 1 (16 chars max)</label>
                      <input 
                        id="line1"
                        type="text" 
                        value={lcdMessage}
                        onChange={(e) => setLcdMessage(e.target.value)}
                        maxLength={16}
                        placeholder="Enter message for line 1"
                        className="w-full bg-cyber-black border border-cyber-blue text-white px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyber-blue"
                      />
                      <div className="text-xs text-gray-500 mt-1">{lcdMessage.length}/16 characters</div>
                    </div>
                    
                    <div>
                      <label htmlFor="line2" className="block text-sm text-cyber-green mb-2">Line 2 (optional, 16 chars max)</label>
                      <input 
                        id="line2"
                        type="text" 
                        value={lcdMessageLine2}
                        onChange={(e) => setLcdMessageLine2(e.target.value)}
                        maxLength={16}
                        placeholder="Enter message for line 2 (optional)"
                        className="w-full bg-cyber-black border border-cyber-blue text-white px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-cyber-blue"
                      />
                      <div className="text-xs text-gray-500 mt-1">{lcdMessageLine2.length}/16 characters</div>
                    </div>
                    
                    <div className="pt-2">
                      <button
                        onClick={handleSendLCDMessage}
                        disabled={!connected}
                        className={`${
                          connected 
                            ? 'bg-cyber-blue hover:bg-cyber-blue-bright text-black' 
                            : 'bg-gray-700 text-gray-300 cursor-not-allowed'
                        } px-6 py-2 rounded-md transition-colors duration-200 flex items-center`}
                      >
                        <MonitorSmartphone className="w-4 h-4 mr-2" />
                        Send to LCD
                      </button>
                      
                      {!connected && (
                        <p className="text-cyber-pink text-sm mt-2">Connect to MQTT to send messages</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-cyber-yellow text-sm mb-2">LCD Preview:</h3>
                    <div className="border-2 border-cyber-blue bg-cyber-black p-4 rounded-md font-mono text-cyber-green">
                      <div className="h-6 overflow-hidden">
                        {lcdMessage || '[Line 1]'}
                      </div>
                      <div className="h-6 overflow-hidden">
                        {lcdMessageLine2 || '[Line 2]'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-cyber-dark border border-cyber-blue rounded-md">
                  <h3 className="text-cyber-blue mb-4">Recent LCD Messages</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {logs
                      .filter(log => log.action === 'LCD_MESSAGE_SENT' || log.action === 'LCD_MESSAGE')
                      .slice(0, 10)
                      .map(log => (
                        <div key={log.id} className="text-sm border-l-2 border-cyber-blue pl-2">
                          <p className="text-cyber-green">{log.details}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    
                    {logs.filter(log => log.action === 'LCD_MESSAGE_SENT' || log.action === 'LCD_MESSAGE').length === 0 && (
                      <p className="text-gray-500 text-sm">No LCD messages sent yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
          
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
