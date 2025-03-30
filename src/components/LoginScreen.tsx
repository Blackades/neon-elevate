
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string | null;
  defaultUsername?: string; // Add defaultUsername prop
  defaultPassword?: string; // Add defaultPassword prop
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  isLoading = false, 
  error = null,
  defaultUsername = '',  // Set default empty value
  defaultPassword = ''   // Set default empty value
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState(defaultPassword);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  }, [error, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    onLogin(username, password);
  };

  // Glitch effect for the container
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    let timeouts: NodeJS.Timeout[] = [];
    
    const applyGlitch = () => {
      // Add glitch class
      container.classList.add('glitch');
      
      // Remove after a short time
      const timeout = setTimeout(() => {
        container.classList.remove('glitch');
      }, 300);
      
      timeouts.push(timeout);
    };
    
    // Apply glitch every few seconds
    const interval = setInterval(() => {
      applyGlitch();
    }, 5000);
    
    // Initial glitch
    applyGlitch();
    
    return () => {
      clearInterval(interval);
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black p-4">
      <div 
        ref={containerRef}
        className="cyber-panel max-w-md w-full mx-auto relative overflow-hidden"
      >
        {/* Top inset border glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-cyber-blue shadow-neon-blue" />
        
        {/* Overlay grid pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full grid grid-cols-10" style={{ backgroundImage: 'linear-gradient(0deg, rgba(0,240,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)' }} />
        </div>
        
        <div className="py-8 px-6 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-cyber text-cyber-blue tracking-wider mb-2 uppercase">
              Neon<span className="text-cyber-pink">Elevate</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Cyber-enhanced Elevator Control Interface
            </p>
          </div>
          
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-cyber text-cyber-blue mb-1 uppercase tracking-wider">
                  User ID
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="cyber-input w-full bg-cyber-dark border-cyber-blue focus:border-cyber-pink"
                  placeholder="Enter your username"
                  autoComplete="off"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-cyber text-cyber-blue mb-1 uppercase tracking-wider">
                  Neural Key
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input w-full bg-cyber-dark border-cyber-blue focus:border-cyber-pink"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            
            <div>
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="cyber-button w-full"
              >
                {isLoading || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">Authenticating</span>
                    <div className="animate-pulse">...</div>
                  </div>
                ) : (
                  "Neural Link"
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Secure MQTT Connection Required</p>
            <p className="mt-1">Authorized Personnel Only</p>
          </div>
          
          {/* System status indicator */}
          <div className="mt-6 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyber-blue animate-pulse mr-2" />
            <span className="text-xs text-cyber-blue">System Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
