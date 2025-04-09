
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ElevatorStatus } from '../services/mqttService';
import { Battery } from 'lucide-react';

interface ElevatorVisualizationProps {
  status: ElevatorStatus | null;
  className?: string;
}

const ElevatorVisualization: React.FC<ElevatorVisualizationProps> = ({ status, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const elevatorRef = useRef<THREE.Group | null>(null);
  const shaftRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number>(0);
  const previousFloorRef = useRef<number>(status?.floor || 1);
  const doorMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (rendererRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d0d);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(15, 10, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00f0ff, 1, 20);
    pointLight1.position.set(5, 10, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff0055, 1, 20);
    pointLight2.position.set(-5, 15, -5);
    scene.add(pointLight2);

    const createShaft = (floors: number) => {
      const shaftGroup = new THREE.Group();
      const floorHeight = 3;
      const shaftWidth = 6;
      const shaftDepth = 6;
      
      const wallMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(shaftWidth, floors * floorHeight),
        wallMaterial
      );
      backWall.position.set(0, (floors * floorHeight) / 2, -shaftDepth / 2);
      shaftGroup.add(backWall);
      
      const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(shaftDepth, floors * floorHeight),
        wallMaterial
      );
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(-shaftWidth / 2, (floors * floorHeight) / 2, 0);
      shaftGroup.add(leftWall);
      
      const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(shaftDepth, floors * floorHeight),
        wallMaterial
      );
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.position.set(shaftWidth / 2, (floors * floorHeight) / 2, 0);
      shaftGroup.add(rightWall);
      
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00f0ff });
      
      for (let i = 0; i <= floors; i++) {
        const y = i * floorHeight;
        
        const floorGeometry = new THREE.BufferGeometry();
        const floorVertices = new Float32Array([
          -shaftWidth / 2, y, -shaftDepth / 2,
          shaftWidth / 2, y, -shaftDepth / 2,
          shaftWidth / 2, y, shaftDepth / 2,
          -shaftWidth / 2, y, shaftDepth / 2,
          -shaftWidth / 2, y, -shaftDepth / 2
        ]);
        floorGeometry.setAttribute('position', new THREE.BufferAttribute(floorVertices, 3));
        const floorLine = new THREE.Line(floorGeometry, lineMaterial);
        shaftGroup.add(floorLine);
        
        if (i > 0) {
          const markerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
          const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(-shaftWidth / 2 - 1, y, 0);
          
          // Add floor number next to the marker
          const textMesh = createFloorText(i.toString());
          textMesh.position.set(-shaftWidth / 2 - 2, y, 0);
          shaftGroup.add(textMesh);
          
          shaftGroup.add(marker);
        }
      }
      
      const railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      const railGeometry = new THREE.BoxGeometry(0.2, floors * floorHeight, 0.2);
      
      const leftRail = new THREE.Mesh(railGeometry, railMaterial);
      leftRail.position.set(-shaftWidth / 2 + 0.5, (floors * floorHeight) / 2, -shaftDepth / 2 + 0.5);
      shaftGroup.add(leftRail);
      
      const rightRail = new THREE.Mesh(railGeometry, railMaterial);
      rightRail.position.set(shaftWidth / 2 - 0.5, (floors * floorHeight) / 2, -shaftDepth / 2 + 0.5);
      shaftGroup.add(rightRail);
      
      return shaftGroup;
    };

    // Helper function to create 3D text for floor numbers
    const createFloorText = (text: string) => {
      // Create a canvas for the text
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 64;
      canvas.height = 64;
      
      if (context) {
        context.fillStyle = '#00f0ff';
        context.font = 'bold 50px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 32, 32);
      }
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create a material with the texture
      const material = new THREE.SpriteMaterial({ map: texture });
      
      // Create a sprite with the material
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1, 1, 1);
      
      return sprite;
    };

    const createElevator = () => {
      const elevatorGroup = new THREE.Group();
      
      const carGeometry = new THREE.BoxGeometry(5, 2.5, 5);
      const carMaterial = new THREE.MeshPhongMaterial({
        color: 0x252525,
        specular: 0x333333,
        shininess: 30
      });
      const car = new THREE.Mesh(carGeometry, carMaterial);
      elevatorGroup.add(car);
      
      const doorGeometry = new THREE.PlaneGeometry(4, 2);
      const doorMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0055, // Default to red (closed)
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      const frontDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      frontDoor.position.set(0, 0, 2.51);
      frontDoor.userData.isDoor = true;
      elevatorGroup.add(frontDoor);
      doorMeshRef.current = frontDoor;
      
      const indicatorGeometry = new THREE.PlaneGeometry(2, 0.5);
      const indicatorMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(0, 1, 2.52);
      elevatorGroup.add(indicator);
      
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00f0ff });
      
      const topLineGeometry = new THREE.BufferGeometry();
      const topVertices = new Float32Array([
        -2.5, 1.25, 2.52,
        2.5, 1.25, 2.52
      ]);
      topLineGeometry.setAttribute('position', new THREE.BufferAttribute(topVertices, 3));
      const topLine = new THREE.Line(topLineGeometry, lineMaterial);
      elevatorGroup.add(topLine);
      
      const bottomLineGeometry = new THREE.BufferGeometry();
      const bottomVertices = new Float32Array([
        -2.5, -1.25, 2.52,
        2.5, -1.25, 2.52
      ]);
      bottomLineGeometry.setAttribute('position', new THREE.BufferAttribute(bottomVertices, 3));
      const bottomLine = new THREE.Line(bottomLineGeometry, lineMaterial);
      elevatorGroup.add(bottomLine);
      
      // Position the elevator at the starting floor (1)
      const floorHeight = 3;
      const initialFloor = status?.floor || 1;
      elevatorGroup.position.set(0, initialFloor * floorHeight - floorHeight / 2, 0);
      
      return elevatorGroup;
    };

    const totalFloors = 3;
    const shaft = createShaft(totalFloors);
    scene.add(shaft);
    shaftRef.current = shaft;
    
    const elevator = createElevator();
    scene.add(elevator);
    elevatorRef.current = elevator;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (pointLight1) {
        const time = Date.now() * 0.001;
        pointLight1.position.y = 10 + Math.sin(time) * 2;
        pointLight2.position.y = 15 + Math.cos(time) * 2;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [status?.floor]); // Re-initialize when floor changes to position correctly on load

  useEffect(() => {
    if (!elevatorRef.current || !status) return;
    
    const floorHeight = 3;
    const currentFloor = status.floor;
    const targetY = currentFloor * floorHeight - floorHeight / 2;
    
    // Update door mesh material color based on door status
    if (doorMeshRef.current) {
      const doorMaterial = doorMeshRef.current.material as THREE.MeshPhongMaterial;
      
      if (status.doorOpen) {
        // If door is open, set to green
        doorMaterial.color.set(0x00ff00);
        doorMaterial.opacity = 0.5;
      } else {
        // If door is closed, set to red
        doorMaterial.color.set(0xff0055);
        doorMaterial.opacity = 0.5;
      }
    }
    
    const animate = () => {
      if (!elevatorRef.current) return;
      
      const currentY = elevatorRef.current.position.y;
      const diff = targetY - currentY;
      
      if (Math.abs(diff) < 0.05) {
        elevatorRef.current.position.y = targetY;
        previousFloorRef.current = currentFloor;
        return;
      }
      
      elevatorRef.current.position.y += diff * 0.05;
      
      requestAnimationFrame(animate);
    };
    
    if (previousFloorRef.current !== currentFloor) {
      animate();
    }
  }, [status]);

  const getSystemStateColor = () => {
    if (!status) return "#00f0ff";
    switch(status.systemState) {
      case "MAINTENANCE": return "#f0f000";
      case "EMERGENCY": return "#f000f0";
      case "ERROR": return "#f00000";
      default: return "#00f0ff";
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full bg-cyber-dark rounded-md overflow-hidden ${className || ''}`}
    >
      {status && (
        <div className="absolute top-2 right-2 z-10 font-cyber bg-black bg-opacity-70 px-3 py-1 rounded flex items-center">
          <Battery className={`w-4 h-4 mr-1 ${
            status.batteryLevel < 30 ? 'text-cyber-pink' : 
            status.batteryLevel < 60 ? 'text-cyber-yellow' : 
            'text-cyber-green'
          }`} />
          <span className={`text-xs ${
            status.batteryLevel < 30 ? 'text-cyber-pink' : 
            status.batteryLevel < 60 ? 'text-cyber-yellow' : 
            'text-cyber-green'
          }`}>
            {status.batteryLevel}%
          </span>
        </div>
      )}
      
      {status && (
        <div className="absolute top-2 left-2 z-10 font-cyber bg-black bg-opacity-70 px-3 py-1 rounded">
          <span className="text-xs text-cyber-blue">
            Floor: <span className="text-cyber-pink">{status.floor}</span>
          </span>
          {status.doorOpen !== undefined && (
            <span className="text-xs ml-2">
              Doors: <span className={status.doorOpen ? "text-cyber-green" : "text-cyber-pink"}>
                {status.doorOpen ? "OPEN" : "CLOSED"}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ElevatorVisualization;
