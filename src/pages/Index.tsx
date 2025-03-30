
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import DigitalRain from '@/components/DigitalRain';
import LoginScreen from '@/components/LoginScreen';
import ElevatorVisualization from '@/components/ElevatorVisualization';
import StatusPanel from '@/components/StatusPanel';
import ControlPanel from '@/components/ControlPanel';
import AlertsPanel from '@/components/AlertsPanel';
import LogsPanel from '@/components/LogsPanel';
import { useSimulatedElevator } from '@/services/mqttService';
import { 
  ArrowLeftRight,
  LayoutDashboard,
  ListChecks,
  Bell,
  TerminalSquare,
  LogOut
} from 'lucide-react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();
  
  // For demo purposes, use the simulated elevator
  // In production, you would use the real MQTT connection with useMqtt hook
  const { 
    connected, 
    elevatorStatus, 
    alerts, 
    logs, 
    publishCommand 
  } = useSimulatedElevator();

  const handleLogin = (username: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    // Simulate authentication with MQTT broker
    setTimeout(() => {
      // For demo purposes, accept any credentials
      // In a real app, you would validate against the MQTT broker
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
              <TerminalSquare className="w-5 h-5" />
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
          {/* Header */}
          <header className="bg-cyber-dark border-b border-cyber-blue py-3 px-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl md:text-2xl font-cyber">
                <span className="text-cyber-blue">Neon</span>
                <span className="text-cyber-pink">Elevate</span>
                <span className="text-cyber-blue ml-2 text-sm md:text-base">v1.0</span>
              </h1>
              
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-pink'} mr-2`}></div>
                  <span className="text-xs text-gray-300">
                    {connected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                
                <div className="text-cyber-yellow text-xs bg-cyber-dark px-3 py-1 rounded-full border border-cyber-yellow">
                  CYBERDECK ACTIVE
                </div>
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
          </main>
          
          {/* Footer */}
          <footer className="bg-cyber-dark border-t border-cyber-blue py-2 px-4">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>NeonElevate Control Interface</span>
              <span>© 2023 CyberSystems Inc.</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
