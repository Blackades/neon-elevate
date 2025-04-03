
import { ElevatorCommand } from './mqttService';

/**
 * Parse a natural language command into an ElevatorCommand object
 * @param text The natural language command to parse
 * @returns An ElevatorCommand object, or null if the command could not be parsed
 */
export function parseCommand(text: string): ElevatorCommand | null {
  // Convert to lowercase for easier matching
  const lowerText = text.toLowerCase();
  
  // Move to floor commands
  if (lowerText.match(/go to floor (\d+)/i) || 
      lowerText.match(/move to floor (\d+)/i) || 
      lowerText.match(/floor (\d+)/i)) {
    const match = lowerText.match(/floor (\d+)/i);
    if (match && match[1]) {
      const floor = parseInt(match[1]);
      return {
        command: 'move',
        floor
      };
    }
  }
  
  // Door controls
  if (lowerText.includes('open door') || lowerText.includes('open the door')) {
    return {
      command: 'open'
    };
  }
  
  if (lowerText.includes('close door') || lowerText.includes('close the door')) {
    return {
      command: 'close'
    };
  }
  
  // Emergency stop
  if (lowerText.includes('emergency') || 
      lowerText.includes('stop') || 
      lowerText.includes('halt')) {
    return {
      command: 'emergency',
      override: true
    };
  }
  
  // Reset emergency mode
  if (lowerText.includes('reset emergency') || 
      lowerText.includes('exit emergency') || 
      lowerText.includes('deactivate emergency') ||
      lowerText.includes('cancel emergency')) {
    return {
      command: 'reset'
    };
  }
  
  // Maintenance mode
  if (lowerText.includes('maintenance mode') || lowerText.includes('enter maintenance')) {
    return {
      command: 'maintenance'
    };
  }
  
  // WiFi scan
  if (lowerText.includes('scan wifi') || 
      lowerText.includes('wifi scan') || 
      lowerText.includes('scan networks')) {
    return {
      command: 'wifi_scan'
    };
  }
  
  // ESP restart
  if (lowerText.includes('restart esp') || 
      lowerText.includes('reboot') || 
      lowerText.includes('reset system')) {
    return {
      command: 'restart_esp'
    };
  }
  
  // Display message
  const displayMatch = lowerText.match(/display message (.*)/i) || 
                     lowerText.match(/show message (.*)/i) ||
                     lowerText.match(/display (.*)/i);
  
  if (displayMatch && displayMatch[1]) {
    return {
      command: 'display_message',
      message: displayMatch[1].trim()
    };
  }
  
  // If we couldn't parse the command, return null
  return null;
}
