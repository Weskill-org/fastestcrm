import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';

interface ThreeHeroSceneProps {
  className?: string;
}

export const ThreeHeroScene = memo(function ThreeHeroScene({ className = '' }: ThreeHeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // ─── Scene, Camera & Renderer ───
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b13, 0.035);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // ─── Core Geometry: Neural Polyhedron ───
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Outer Geodesic Wireframe
    const outerGeo = new THREE.IcosahedronGeometry(4.2, 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(outerMesh);

    // Inner Glowing Core
    const innerGeo = new THREE.OctahedronGeometry(2.2, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0df0b4,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // ─── Surrounding Particle Constellation ───
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const colorTeal = new THREE.Color(0x0df0b4);
    const colorCyan = new THREE.Color(0x38bdf8);
    const colorViolet = new THREE.Color(0x818cf8);

    for (let i = 0; i < particleCount; i++) {
      const radius = 5 + Math.random() * 9;
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);

      positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(theta);

      // Random color variation
      const randChoice = Math.random();
      const chosenColor = randChoice < 0.5 ? colorTeal : randChoice < 0.85 ? colorCyan : colorViolet;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;

      scales[i] = Math.random() * 2.5 + 1.2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Dynamic glowing points
    const pMaterial = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const pointCloud = new THREE.Points(particleGeo, pMaterial);
    coreGroup.add(pointCloud);

    // ─── Orbiting Ring Glyphs (Leads, Calls, Payments) ───
    const createRing = (radius: number, tiltX: number, tiltY: number, color: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.02, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.28
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      return ring;
    };

    const ring1 = createRing(5.2, Math.PI / 3, Math.PI / 6, 0x14b8a6);
    const ring2 = createRing(6.0, -Math.PI / 4, Math.PI / 4, 0x38bdf8);
    const ring3 = createRing(6.8, Math.PI / 2.2, -Math.PI / 5, 0x818cf8);
    coreGroup.add(ring1);
    coreGroup.add(ring2);
    coreGroup.add(ring3);

    // ─── Mouse Tracking Parallax ───
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX = (e.clientX / innerWidth - 0.5) * 2;
      mouseY = (e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ─── Animation Loop with Intersection Observer ───
    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });

    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax easing
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      camera.position.x = targetX * 2.5;
      camera.position.y = -targetY * 2.0;
      camera.lookAt(0, 0, 0);

      // Core rotations
      coreGroup.rotation.y = elapsedTime * 0.09;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.15;

      innerMesh.rotation.x = -elapsedTime * 0.2;
      innerMesh.rotation.z = elapsedTime * 0.18;

      outerMesh.rotation.y = -elapsedTime * 0.06;

      ring1.rotation.z = elapsedTime * 0.12;
      ring2.rotation.z = -elapsedTime * 0.15;
      ring3.rotation.z = elapsedTime * 0.08;

      // Pulsing scale
      const scale = 1 + Math.sin(elapsedTime * 0.8) * 0.04;
      innerMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    // ─── Responsive Resize ───
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // ─── Cleanup ───
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      outerGeo.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeo.dispose();
      pMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
});

export default ThreeHeroScene;
