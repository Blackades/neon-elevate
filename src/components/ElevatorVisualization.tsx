import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ElevatorStatus } from '../services/mqttService';

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

  // Set up the scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing scene
    if (rendererRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    // Get container dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d0d);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(15, 10, 15);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Add lights
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

    // Create elevator shaft
    const createShaft = (floors: number) => {
      const shaftGroup = new THREE.Group();
      const floorHeight = 3;
      const shaftWidth = 6;
      const shaftDepth = 6;
      
      // Shaft walls
      const wallMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      // Back wall
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(shaftWidth, floors * floorHeight),
        wallMaterial
      );
      backWall.position.set(0, (floors * floorHeight) / 2, -shaftDepth / 2);
      shaftGroup.add(backWall);
      
      // Left wall
      const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(shaftDepth, floors * floorHeight),
        wallMaterial
      );
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(-shaftWidth / 2, (floors * floorHeight) / 2, 0);
      shaftGroup.add(leftWall);
      
      // Right wall
      const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(shaftDepth, floors * floorHeight),
        wallMaterial
      );
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.position.set(shaftWidth / 2, (floors * floorHeight) / 2, 0);
      shaftGroup.add(rightWall);
      
      // Floor lines
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00f0ff });
      
      for (let i = 0; i <= floors; i++) {
        const y = i * floorHeight;
        
        // Floor lines
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
        
        // Floor number - removed TextGeometry that was causing issues
        if (i > 0) {
          // Create floor number indicators using HTML
          // We'll implement this in the overlay instead
        }
      }
      
      // Guide rails
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

    // Create elevator car
    const createElevator = () => {
      const elevatorGroup = new THREE.Group();
      
      // Elevator car
      const carGeometry = new THREE.BoxGeometry(5, 2.5, 5);
      const carMaterial = new THREE.MeshPhongMaterial({
        color: 0x252525,
        specular: 0x333333,
        shininess: 30
      });
      const car = new THREE.Mesh(carGeometry, carMaterial);
      elevatorGroup.add(car);
      
      // Elevator door (front part is open area)
      const doorGeometry = new THREE.PlaneGeometry(4, 2);
      const doorMaterial = new THREE.MeshPhongMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const frontDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      frontDoor.position.set(0, 0, 2.51);
      frontDoor.userData.isDoor = true;
      elevatorGroup.add(frontDoor);
      
      // Floor indicator
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
      
      // Add decorative lines
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00f0ff });
      
      // Top lines
      const topLineGeometry = new THREE.BufferGeometry();
      const topVertices = new Float32Array([
        -2.5, 1.25, 2.52,
        2.5, 1.25, 2.52
      ]);
      topLineGeometry.setAttribute('position', new THREE.BufferAttribute(topVertices, 3));
      const topLine = new THREE.Line(topLineGeometry, lineMaterial);
      elevatorGroup.add(topLine);
      
      // Bottom lines
      const bottomLineGeometry = new THREE.BufferGeometry();
      const bottomVertices = new Float32Array([
        -2.5, -1.25, 2.52,
        2.5, -1.25, 2.52
      ]);
      bottomLineGeometry.setAttribute('position', new THREE.BufferAttribute(bottomVertices, 3));
      const bottomLine = new THREE.Line(bottomLineGeometry, lineMaterial);
      elevatorGroup.add(bottomLine);
      
      // Add the elevator to the scene
      elevatorGroup.position.set(0, 1.25, 0); // Position it at the first floor
      
      return elevatorGroup;
    };

    const totalFloors = status?.totalFloors || 20;
    
    // Create and add shaft to scene
    const shaft = createShaft(totalFloors);
    scene.add(shaft);
    shaftRef.current = shaft;
    
    // Create and add elevator to scene
    const elevator = createElevator();
    scene.add(elevator);
    elevatorRef.current = elevator;

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (pointLight1) {
        // Animate the point lights
        const time = Date.now() * 0.001;
        pointLight1.position.y = 10 + Math.sin(time) * 2;
        pointLight2.position.y = 15 + Math.cos(time) * 2;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Resize handler
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
  }, []);

  // Update elevator position and state based on status updates
  useEffect(() => {
    if (!elevatorRef.current || !status) return;
    
    const floorHeight = 3;
    const currentFloor = status.floor;
    const targetY = currentFloor * floorHeight - floorHeight / 2;
    
    // Handle door animation
    const doorMesh = elevatorRef.current.children.find((child) => 
      child instanceof THREE.Mesh && child.userData.isDoor
    ) as THREE.Mesh | undefined;
    
    if (doorMesh) {
      const doorMaterial = doorMesh.material as THREE.MeshPhongMaterial;
      
      if (status.doorOpen) {
        doorMaterial.opacity = 0;
      } else {
        doorMaterial.opacity = 0.3;
      }
    }
    
    // Animate elevator movement
    const animate = () => {
      if (!elevatorRef.current) return;
      
      const currentY = elevatorRef.current.position.y;
      const diff = targetY - currentY;
      
      // If we're close enough to the target floor, snap to it
      if (Math.abs(diff) < 0.05) {
        elevatorRef.current.position.y = targetY;
        previousFloorRef.current = currentFloor;
        return;
      }
      
      // Otherwise, move towards it
      elevatorRef.current.position.y += diff * 0.05;
      
      // Request next frame
      requestAnimationFrame(animate);
    };
    
    // Only animate if we're moving to a new floor
    if (previousFloorRef.current !== currentFloor) {
      animate();
    }
  }, [status]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full bg-cyber-dark rounded-md overflow-hidden ${className || ''}`}
    >
      {/* Floor indicator overlay - shows current floor */}
      {status && (
        <div className="absolute top-2 left-2 z-10 font-cyber bg-black bg-opacity-50 px-4 py-2 rounded">
          <div className="text-cyber-blue text-xl">
            Floor <span className="text-cyber-pink">{status.floor}</span>
          </div>
          <div className="text-xs text-cyber-blue">
            Status: <span className={
              status.direction === 'up' ? 'text-cyber-green' :
              status.direction === 'down' ? 'text-cyber-pink' :
              'text-cyber-yellow'
            }>
              {status.direction.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElevatorVisualization;
