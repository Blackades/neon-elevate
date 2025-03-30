
import React from 'react';
import { ElevatorAlert } from '../services/mqttService';
import { 
  AlertCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface AlertsPanelProps {
  alerts: ElevatorAlert[];
  className?: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, className }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };
  
  // Get the icon based on alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-cyber-pink" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-cyber-yellow" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-cyber-blue" />;
    }
  };
  
  // Get the class based on alert type
  const getAlertClass = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-4 border-cyber-pink bg-cyber-pink bg-opacity-10';
      case 'warning':
        return 'border-l-4 border-cyber-yellow bg-cyber-yellow bg-opacity-10';
      case 'info':
      default:
        return 'border-l-4 border-cyber-blue bg-cyber-blue bg-opacity-10';
    }
  };

  return (
    <div className={`cyber-panel ${className || ''}`}>
      <div className="border-b border-cyber-blue pb-2 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-cyber text-cyber-blue">SYSTEM ALERTS</h3>
          <div className="bg-cyber-dark px-2 py-1 text-xs rounded-full">
            {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 cyber-scrollbar">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-cyber-blue opacity-50" />
            <p>No active alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded ${getAlertClass(alert.type)}`}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`font-cyber text-sm ${
                      alert.type === 'critical' ? 'text-cyber-pink' :
                      alert.type === 'warning' ? 'text-cyber-yellow' :
                      'text-cyber-blue'
                    }`}>
                      {alert.type.toUpperCase()}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
