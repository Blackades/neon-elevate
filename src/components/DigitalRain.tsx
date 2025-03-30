
import React, { useEffect, useRef, useState } from 'react';

interface DigitalRainProps {
  density?: number;
}

const DigitalRain: React.FC<DigitalRainProps> = ({ density = 25 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Set up characters (standard + katakana)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,./<>?';
    const katakana = '゠ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶヷヸヹヺ・ーヽヾヿ';
    const allChars = chars + katakana;

    const fontSize = 14;
    const columns = Math.ceil(dimensions.width / fontSize);
    
    // Create raindrops with varying speeds and start positions
    const raindrops = Array(columns).fill(0).map(() => ({
      y: Math.random() * dimensions.height * -1, // Start above the screen
      speed: 0.5 + Math.random() * 2, // Random speed
      opacity: 0.8 + Math.random() * 0.2, // Random opacity
    }));

    const draw = () => {
      // Add a semi-transparent black rectangle on top of previous frame
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set font and color for the characters
      ctx.fillStyle = '#00FF66';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < columns; i++) {
        if (Math.random() > 0.975) continue; // Skip some columns randomly
        
        // Get random character
        const char = allChars.charAt(Math.floor(Math.random() * allChars.length));
        
        // Calculate the x position
        const x = i * fontSize;
        const drop = raindrops[i];
        
        // Set varying opacity
        ctx.fillStyle = `rgba(0, 255, 102, ${drop.opacity})`;
        
        // Draw the character
        ctx.fillText(char, x, drop.y);
        
        // Move the raindrop down
        drop.y += drop.speed;
        
        // If the drop reaches the bottom of the screen, reset it
        if (drop.y > dimensions.height) {
          drop.y = -fontSize;
          drop.speed = 0.5 + Math.random() * 2;
          drop.opacity = 0.8 + Math.random() * 0.2;
        }
      }
    };
    
    const animationId = setInterval(draw, 33); // ~30 FPS
    
    return () => clearInterval(animationId);
  }, [dimensions, density]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 opacity-25"
    />
  );
};

export default DigitalRain;
