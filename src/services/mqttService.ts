
import { useEffect, useState, useRef, useCallback } from 'react';
import { Client, Message } from 'paho-mqtt';

// MQTT broker settings
const BROKER_URL = 'db48b4ddcc1c4f92b6823370ed6af6ba.s1.eu.hivemq.cloud';
const BROKER_PORT = 8884; // Secure WebSocket port
const CLIENT_ID = `elevator_client_${Math.random().toString(16).substr(2, 8)}`;

// Topics to subscribe to
const TOPICS = {
  STATUS: 'elevator/status',
  ALERTS: 'elevator/alerts',
  LOGS: 'elevator/logs',
  CONNECTION: 'elevator/connection'
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

// Interface for elevator data
export interface ElevatorStatus {
  floor: number;
  totalFloors: number;
  direction: 'up' | 'down' | 'idle';
  doorOpen: boolean;
  speed: number;
  temperature: number;
  weight: number;
  batteryLevel: number;
  maintenance: boolean;
  lastUpdated: string;
}

export interface ElevatorAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export interface ElevatorLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ElevatorCommand {
  action: 'move' | 'stop' | 'open' | 'close' | 'emergency' | 'reset' | 'maintenance';
  floor?: number;
  override?: boolean;
  [key: string]: any;
}

// Hook for using MQTT in React components
export const useMqtt = (options: MqttConnectionOptions) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [elevatorStatus, setElevatorStatus] = useState<ElevatorStatus | null>(null);
  const [alerts, setAlerts] = useState<ElevatorAlert[]>([]);
  const [logs, setLogs] = useState<ElevatorLog[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  
  const clientRef = useRef<Client | null>(null);

  // Handle incoming messages
  const handleMessage = useCallback((message: Message) => {
    const topic = message.destinationName;
    const payload = JSON.parse(message.payloadString);
    
    console.log(`Received message on ${topic}:`, payload);
    
    if (options.onMessage) {
      options.onMessage(topic, payload);
    }
    
    // Update state based on topic
    switch (topic) {
      case TOPICS.STATUS:
        setElevatorStatus(payload);
        break;
      case TOPICS.ALERTS:
        setAlerts(prev => [payload, ...prev].slice(0, 100)); // Keep last 100 alerts
        break;
      case TOPICS.LOGS:
        setLogs(prev => [payload, ...prev].slice(0, 200)); // Keep last 200 logs
        break;
      case TOPICS.CONNECTION:
        setConnectionStatus(payload.status);
        break;
    }
  }, [options]);

  // Connect to MQTT broker
  useEffect(() => {
    const client = new Client(BROKER_URL, BROKER_PORT, CLIENT_ID);
    
    client.onConnectionLost = (responseObject) => {
      console.log('Connection lost:', responseObject.errorMessage);
      setConnected(false);
      setError(new Error(responseObject.errorMessage));
      
      if (options.onDisconnect) {
        options.onDisconnect();
      }
      
      // Try to reconnect after 5 seconds
      setTimeout(() => connect(), 5000);
    };
    
    client.onMessageArrived = handleMessage;
    
    const connect = () => {
      try {
        client.connect({
          useSSL: true,
          userName: options.username,
          password: options.password,
          onSuccess: () => {
            console.log('Connected to MQTT broker');
            setConnected(true);
            setError(null);
            
            // Subscribe to topics
            Object.values(TOPICS).forEach(topic => {
              client.subscribe(topic);
              console.log(`Subscribed to ${topic}`);
            });
            
            if (options.onConnect) {
              options.onConnect();
            }
          },
          onFailure: (err) => {
            console.error('Failed to connect to MQTT broker:', err);
            setConnected(false);
            setError(new Error(err.errorMessage));
            
            if (options.onError) {
              options.onError(new Error(err.errorMessage));
            }
          }
        });
      } catch (err) {
        console.error('Error connecting to MQTT broker:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        if (options.onError) {
          options.onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };
    
    clientRef.current = client;
    connect();
    
    return () => {
      if (client.isConnected()) {
        Object.values(TOPICS).forEach(topic => {
          client.unsubscribe(topic);
        });
        client.disconnect();
      }
    };
  }, [options, handleMessage]);

  // Function to publish a command
  const publishCommand = useCallback((command: ElevatorCommand) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      setError(new Error('Not connected to MQTT broker'));
      return false;
    }
    
    try {
      const message = new Message(JSON.stringify(command));
      message.destinationName = COMMAND_TOPIC;
      clientRef.current.send(message);
      console.log('Published command:', command);
      return true;
    } catch (err) {
      console.error('Error publishing command:', err);
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
    publishCommand
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
    if (command.action === 'move' && typeof command.floor === 'number') {
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
    } else if (command.action === 'open') {
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
    } else if (command.action === 'close') {
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
    } else if (command.action === 'emergency') {
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
    } else if (command.action === 'maintenance') {
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
    }
    
    return true;
  }, [elevatorStatus, setElevatorStatus, setAlerts, setLogs]);
  
  return {
    connected,
    elevatorStatus,
    alerts,
    logs,
    connectionStatus,
    publishCommand,
    error: null
  };
};
