import { useEffect, useState, useRef, useCallback } from 'react';
import { Client, Message } from 'paho-mqtt';

// MQTT broker settings - using the one specified in the Arduino sketch
const BROKER_URL = 'db48b4ddcc1c4f92b6823370ed6af6ba.s1.eu.hivemq.cloud';
const BROKER_PORT = 8884; // Secure WebSocket port
const CLIENT_ID = `elevator_client_${Math.random().toString(16).substr(2, 8)}`;

// Topics to subscribe to - matching Arduino sketch
const TOPICS = {
  STATUS: 'elevator/status',
  ALERTS: 'elevator/alerts',
  LOGS: 'elevator/logs',
  CONNECTION: 'elevator/connection',
  COMMAND_ACK: 'elevator/commandack',
  LCD_MESSAGE: 'elevator/lcd_message' // Added new topic for LCD messages
};

// Topic for publishing commands
const COMMAND_TOPIC = 'elevator/commands';

// Interface for MQTT connection options
interface MqttConnectionOptions {
  username: string;
  password: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (topic: string, message: any) => void;
  onError?: (error: Error) => void;
}

// Interface for elevator data - enhanced to match Arduino data
export interface ElevatorStatus {
  floor: number;
  totalFloors: number;
  target?: number;
  direction: 'up' | 'down' | 'idle';
  doorOpen: boolean;
  speed: number;
  temperature: number;
  weight: number;
  batteryLevel: number;
  maintenance: boolean;
  systemState: string;
  esp_heap?: number;
  esp_uptime?: number;
  wifi_rssi?: number;
  mega_connected?: boolean;
  mqtt_connected?: boolean;
  lastUpdated: string;
}

export interface ElevatorAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  code?: number;
}

export interface ElevatorLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  event?: string;
}

export interface ElevatorCommand {
  command: 'move' | 'stop' | 'open' | 'close' | 'emergency' | 'reset' | 'maintenance' | 'display_message' | 'restart_esp' | 'wifi_scan';
  floor?: number;
  override?: boolean;
  message?: string;
  line2?: string;
  id?: string;
  [key: string]: any;
}

// Interface for LCD message
export interface LCDMessage {
  message: string;
  line2?: string;
}

// Hook for using MQTT in React components
export const useMqtt = (options: MqttConnectionOptions) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [elevatorStatus, setElevatorStatus] = useState<ElevatorStatus | null>(null);
  const [alerts, setAlerts] = useState<ElevatorAlert[]>([]);
  const [logs, setLogs] = useState<ElevatorLog[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [commandAcks, setCommandAcks] = useState<any[]>([]);
  
  const clientRef = useRef<Client | null>(null);
  const optionsRef = useRef(options);
  const connectionAttemptsRef = useRef(false);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Handle incoming messages
  const handleMessage = useCallback((message: Message) => {
    const topic = message.destinationName;
    const payload = JSON.parse(message.payloadString);
    
    console.log(`Received message on ${topic}:`, payload);
    
    if (optionsRef.current.onMessage) {
      optionsRef.current.onMessage(topic, payload);
    }
    
    // Update state based on topic
    switch (topic) {
      case TOPICS.STATUS:
        const newStatus: ElevatorStatus = {
          floor: payload.floor || 1,
          totalFloors: 3, // Hardcoded to 3 floors as per Arduino
          target: payload.target,
          direction: payload.movement || 'idle',
          doorOpen: payload.doors || false,
          speed: 0, // Not provided in Arduino data
          temperature: payload.temperature || 25,
          weight: payload.weight || 0,
          batteryLevel: payload.battery ? Math.round((payload.battery / 12.6) * 100) : 100, // Convert voltage to percentage
          maintenance: payload.state === 'MAINTENANCE',
          systemState: payload.state || 'NORMAL',
          esp_heap: payload.esp_heap,
          esp_uptime: payload.esp_uptime,
          wifi_rssi: payload.wifi_rssi,
          mega_connected: payload.mega_connected,
          mqtt_connected: payload.mqtt_connected,
          lastUpdated: new Date().toISOString()
        };
        setElevatorStatus(newStatus);
        break;
      case TOPICS.ALERTS:
        const newAlert: ElevatorAlert = {
          id: payload.id || Date.now().toString(),
          type: payload.code > 2 ? 'critical' : payload.code > 0 ? 'warning' : 'info',
          message: payload.message || 'System alert',
          timestamp: new Date().toISOString(),
          code: payload.code
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 100)); // Keep last 100 alerts
        break;
      case TOPICS.LOGS:
        const newLog: ElevatorLog = {
          id: payload.id || Date.now().toString(),
          action: payload.action || 'SYSTEM',
          details: payload.details || '',
          timestamp: new Date().toISOString(),
          event: payload.event
        };
        setLogs(prev => [newLog, ...prev].slice(0, 200)); // Keep last 200 logs
        break;
      case TOPICS.CONNECTION:
        setConnectionStatus(payload.status || 'unknown');
        break;
      case TOPICS.COMMAND_ACK:
        setCommandAcks(prev => [payload, ...prev].slice(0, 50)); // Keep last 50 command acks
        break;
    }
  }, []);

  // Connect to MQTT broker - This effect sets up the initial connection and cleanup
  useEffect(() => {
    // Only attempt connection once to prevent infinite loops
    if (connectionAttemptsRef.current) {
      return;
    }
    
    // Create a new client if one doesn't exist
    if (!clientRef.current) {
      console.log('Creating new MQTT client');
      const client = new Client(BROKER_URL, BROKER_PORT, CLIENT_ID);
      
      client.onConnectionLost = (responseObject) => {
        console.log('Connection lost:', responseObject.errorMessage);
        setConnected(false);
        setError(new Error(responseObject.errorMessage));
        
        if (optionsRef.current.onDisconnect) {
          optionsRef.current.onDisconnect();
        }
        
        // Try to reconnect after 5 seconds
        setTimeout(() => connect(), 5000);
      };
      
      client.onMessageArrived = handleMessage;
      clientRef.current = client;
    }
    
    const connect = () => {
      // Only attempt to connect if we're not already connected
      if (clientRef.current && !clientRef.current.isConnected()) {
        try {
          console.log('Connecting to MQTT broker');
          clientRef.current.connect({
            useSSL: true,
            userName: optionsRef.current.username,
            password: optionsRef.current.password,
            onSuccess: () => {
              console.log('Connected to MQTT broker');
              setConnected(true);
              setError(null);
              
              // Subscribe to topics
              Object.values(TOPICS).forEach(topic => {
                if (clientRef.current) {
                  clientRef.current.subscribe(topic);
                  console.log(`Subscribed to ${topic}`);
                }
              });
              
              if (optionsRef.current.onConnect) {
                optionsRef.current.onConnect();
              }
            },
            onFailure: (err) => {
              console.error('Failed to connect to MQTT broker:', err);
              setConnected(false);
              setError(new Error(err.errorMessage));
              
              if (optionsRef.current.onError) {
                optionsRef.current.onError(new Error(err.errorMessage));
              }
            }
          });
        } catch (err) {
          console.error('Error connecting to MQTT broker:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          
          if (optionsRef.current.onError) {
            optionsRef.current.onError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    };
    
    // Set connection attempt flag to true to avoid reconnection loops
    connectionAttemptsRef.current = true;
    
    // Connect once on component mount
    connect();
    
    // Cleanup function
    return () => {
      if (clientRef.current && clientRef.current.isConnected()) {
        Object.values(TOPICS).forEach(topic => {
          if (clientRef.current) {
            clientRef.current.unsubscribe(topic);
          }
        });
        clientRef.current.disconnect();
        console.log('Disconnected from MQTT broker during cleanup');
      }
    };
  }, []); // Empty dependency array to ensure this only runs once on mount
  
  // Effect for handling credential changes - only reconnect if credentials change
  useEffect(() => {
    // Skip if this is the initial render
    if (!connectionAttemptsRef.current) {
      return;
    }
    
    // Check if credentials changed and we need to reconnect
    if (clientRef.current) {
      if (clientRef.current.isConnected()) {
        // Disconnect current connection
        Object.values(TOPICS).forEach(topic => {
          if (clientRef.current) {
            clientRef.current.unsubscribe(topic);
          }
        });
        clientRef.current.disconnect();
        console.log('Disconnected due to credential change');
      }
      
      // Reconnect with new credentials after a short delay
      setTimeout(() => {
        if (clientRef.current) {
          console.log('Reconnecting with new credentials');
          clientRef.current.connect({
            useSSL: true,
            userName: options.username,
            password: options.password,
            onSuccess: () => {
              console.log('Reconnected to MQTT broker with new credentials');
              setConnected(true);
              setError(null);
              
              // Subscribe to topics
              Object.values(TOPICS).forEach(topic => {
                if (clientRef.current) {
                  clientRef.current.subscribe(topic);
                  console.log(`Subscribed to ${topic}`);
                }
              });
              
              if (options.onConnect) {
                options.onConnect();
              }
            },
            onFailure: (err) => {
              console.error('Failed to reconnect to MQTT broker:', err);
              setConnected(false);
              setError(new Error(err.errorMessage));
              
              if (options.onError) {
                options.onError(new Error(err.errorMessage));
              }
            }
          });
        }
      }, 500);
    }
  }, [options.username, options.password]); // Only react to credential changes

  // Function to publish a command
  const publishCommand = useCallback((command: ElevatorCommand) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      setError(new Error('Not connected to MQTT broker'));
      return false;
    }
    
    try {
      // Generate a command ID if not provided
      if (!command.id) {
        command.id = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      
      const message = new Message(JSON.stringify(command));
      message.destinationName = COMMAND_TOPIC;
      clientRef.current.send(message);
      console.log('Published command:', command);
      
      // Add to logs
      const newLog: ElevatorLog = {
        id: Date.now().toString(),
        action: 'COMMAND_SENT',
        details: `Command ${command.command} sent to elevator`,
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
      
      return true;
    } catch (err) {
      console.error('Error publishing command:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, []);

  // Function to publish a message to the LCD
  const publishLCDMessage = useCallback((lcdMessage: LCDMessage) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      setError(new Error('Not connected to MQTT broker'));
      return false;
    }
    
    try {
      const message = new Message(JSON.stringify(lcdMessage));
      message.destinationName = TOPICS.LCD_MESSAGE;
      clientRef.current.send(message);
      console.log('Published LCD message:', lcdMessage);
      
      // Add to logs
      const newLog: ElevatorLog = {
        id: Date.now().toString(),
        action: 'LCD_MESSAGE_SENT',
        details: `LCD message: ${lcdMessage.message}${lcdMessage.line2 ? ` (line 2: ${lcdMessage.line2})` : ''}`,
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
      
      return true;
    } catch (err) {
      console.error('Error publishing LCD message:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, []);

  return {
    connected,
    error,
    elevatorStatus,
    alerts,
    logs,
    connectionStatus,
    commandAcks,
    publishCommand,
    publishLCDMessage
  };
};

// For simulating elevator data without an actual MQTT connection
export const useSimulatedElevator = () => {
  const [elevatorStatus, setElevatorStatus] = useState<ElevatorStatus>({
    floor: 1,
    totalFloors: 20,
    direction: 'idle',
    doorOpen: false,
    speed: 0,
    temperature: 24.5,
    weight: 320,
    batteryLevel: 92,
    maintenance: false,
    systemState: 'NORMAL',
    lastUpdated: new Date().toISOString()
  });
  
  const [alerts, setAlerts] = useState<ElevatorAlert[]>([
    {
      id: '1',
      type: 'info',
      message: 'Daily system check completed successfully',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      type: 'warning',
      message: 'Battery level below 95%',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ]);
  
  const [logs, setLogs] = useState<ElevatorLog[]>([
    {
      id: '1',
      action: 'STARTUP',
      details: 'System initialized',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      action: 'MOVE',
      details: 'Moving from floor 1 to floor 5',
      timestamp: new Date(Date.now() - 3000000).toISOString()
    },
    {
      id: '3',
      action: 'STOP',
      details: 'Stopped at floor 5',
      timestamp: new Date(Date.now() - 2800000).toISOString()
    }
  ]);
  
  const [connected, setConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  
  const publishCommand = useCallback((command: ElevatorCommand) => {
    console.log('Simulated command:', command);
    
    // Simulate response to commands
    if (command.command === 'move' && typeof command.floor === 'number') {
      const currentFloor = elevatorStatus.floor;
      const targetFloor = command.floor;
      
      if (currentFloor === targetFloor) {
        return true;
      }
      
      const direction = targetFloor > currentFloor ? 'up' : 'down';
      
      // Update status to show we're moving
      setElevatorStatus(prev => ({
        ...prev,
        direction,
        doorOpen: false,
        speed: 1.5,
        lastUpdated: new Date().toISOString()
      }));
      
      // Simulate elevator movement
      let floor = currentFloor;
      const moveInterval = setInterval(() => {
        if (direction === 'up') {
          floor += 1;
        } else {
          floor -= 1;
        }
        
        setElevatorStatus(prev => ({
          ...prev,
          floor,
          lastUpdated: new Date().toISOString()
        }));
        
        if (floor === targetFloor) {
          clearInterval(moveInterval);
          
          // We've arrived, update status
          setElevatorStatus(prev => ({
            ...prev,
            direction: 'idle',
            speed: 0,
            lastUpdated: new Date().toISOString()
          }));
          
          // Add log
          const newLog: ElevatorLog = {
            id: Date.now().toString(),
            action: 'STOP',
            details: `Stopped at floor ${targetFloor}`,
            timestamp: new Date().toISOString()
          };
          setLogs(prev => [newLog, ...prev]);
          
          // Open doors after a small delay
          setTimeout(() => {
            setElevatorStatus(prev => ({
              ...prev,
              doorOpen: true,
              lastUpdated: new Date().toISOString()
            }));
            
            // Add log for door opening
            const doorLog: ElevatorLog = {
              id: (Date.now() + 1).toString(),
              action: 'DOOR',
              details: `Door opened at floor ${targetFloor}`,
              timestamp: new Date().toISOString()
            };
            setLogs(prev => [doorLog, ...prev]);
            
            // Close doors after 3 seconds
            setTimeout(() => {
              setElevatorStatus(prev => ({
                ...prev,
                doorOpen: false,
                lastUpdated: new Date().toISOString()
              }));
              
              // Add log for door closing
              const closeDoorLog: ElevatorLog = {
                id: (Date.now() + 2).toString(),
                action: 'DOOR',
                details: `Door closed at floor ${targetFloor}`,
                timestamp: new Date().toISOString()
              };
              setLogs(prev => [closeDoorLog, ...prev]);
            }, 3000);
          }, 1000);
        }
      }, 1000);
    } else if (command.command === 'open') {
      // Open doors
      setElevatorStatus(prev => ({
        ...prev,
        doorOpen: true,
        lastUpdated: new Date().toISOString()
      }));
      
      // Add log
      const newLog: ElevatorLog = {
        id: Date.now().toString(),
        action: 'DOOR',
        details: `Door opened at floor ${elevatorStatus.floor}`,
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
    } else if (command.command === 'close') {
      // Close doors
      setElevatorStatus(prev => ({
        ...prev,
        doorOpen: false,
        lastUpdated: new Date().toISOString()
      }));
      
      // Add log
      const newLog: ElevatorLog = {
        id: Date.now().toString(),
        action: 'DOOR',
        details: `Door closed at floor ${elevatorStatus.floor}`,
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
    } else if (command.command === 'emergency') {
      // Emergency stop
      setElevatorStatus(prev => ({
        ...prev,
        direction: 'idle',
        speed: 0,
        doorOpen: true,
        lastUpdated: new Date().toISOString()
      }));
      
      // Add alert
      const newAlert: ElevatorAlert = {
        id: Date.now().toString(),
        type: 'critical',
        message: 'Emergency stop activated',
        timestamp: new Date().toISOString()
      };
      setAlerts(prev => [newAlert, ...prev]);
      
      // Add log
      const newLog: ElevatorLog = {
        id: Date.now().toString(),
        action: 'EMERGENCY',
        details: 'Emergency stop activated',
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
    } else if (command.command === 'maintenance') {
      // Toggle maintenance mode
      const newState = !elevatorStatus.maintenance;
      
      setElevatorStatus(prev => ({
        ...prev,
        maintenance: newState,
        lastUpdated: new Date().toISOString()
      }));
      
      // Add log
      const newLog: ElevatorLog = {
        id: Date.now().toString(),
        action: 'MAINTENANCE',
        details: `Maintenance mode ${newState ? 'activated' : 'deactivated'}`,
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
    } else if (command.command === 'display_message') {
      // Simulate display message command
      if (command.message) {
        // Log LCD message
        const newLog: ElevatorLog = {
          id: Date.now().toString(),
          action: 'LCD_MESSAGE',
          details: `LCD message displayed: ${command.message}${command.line2 ? ` (line 2: ${command.line2})` : ''}`,
          timestamp: new Date().toISOString()
        };
        setLogs(prev => [newLog, ...prev]);
      }
    }
    
    return true;
  }, [elevatorStatus, setElevatorStatus, setAlerts, setLogs]);
  
  // Add publishLCDMessage to the simulated hook
  const publishLCDMessage = useCallback((lcdMessage: LCDMessage) => {
    console.log('Simulated LCD message:', lcdMessage);
    
    // Add to logs
    const newLog: ElevatorLog = {
      id: Date.now().toString(),
      action: 'LCD_MESSAGE_SENT',
      details: `LCD message: ${lcdMessage.message}${lcdMessage.line2 ? ` (line 2: ${lcdMessage.line2})` : ''}`,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
    
    return true;
  }, [setLogs]);
  
  return {
    connected,
    elevatorStatus,
    alerts,
    logs,
    connectionStatus,
    publishCommand,
    publishLCDMessage,
    error: null
  };
};
