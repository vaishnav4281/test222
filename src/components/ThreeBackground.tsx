import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Detect theme
        const isDark = document.documentElement.classList.contains('dark');

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 8;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerWidth);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Create uniform particles (nodes)
        const nodeCount = 15;
        const nodes: THREE.Mesh[] = [];
        const nodePositions: THREE.Vector3[] = [];

        for (let i = 0; i < nodeCount; i++) {
            // Uniform small size - perfectly round
            const geometry = new THREE.SphereGeometry(0.08, 16, 16);

            // Alternate between red and blue
            const isRed = i % 2 === 0;
            const color = isRed ? 0xef4444 : 0x3b82f6;

            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isDark ? 0.9 : 0.8,
            });

            const particle = new THREE.Mesh(geometry, material);

            // Distribute in 3D space
            const radius = 5;
            const theta = (i / nodeCount) * Math.PI * 2;
            const phi = Math.acos(2 * (i / nodeCount) - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            particle.position.set(x, y, z);
            nodePositions.push(new THREE.Vector3(x, y, z));
            nodes.push(particle);
            scene.add(particle);

            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(0.12, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isDark ? 0.15 : 0.1,
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(particle.position);
            scene.add(glow);
            nodes.push(glow); // Store for animation
        }

        // Create shining connection lines
        const lines: THREE.Line[] = [];
        const lineMaterials: THREE.LineBasicMaterial[] = [];

        for (let i = 0; i < nodeCount; i++) {
            // Connect each node to 2 nearby nodes
            for (let j = 1; j <= 2; j++) {
                const targetIndex = (i + j * 3) % nodeCount;

                const points = [nodePositions[i], nodePositions[targetIndex]];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                // Shining link color
                const material = new THREE.LineBasicMaterial({
                    color: isDark ? 0x60a5fa : 0xf87171,
                    transparent: true,
                    opacity: 0.3,
                    linewidth: 2,
                });

                const line = new THREE.Line(geometry, material);
                lines.push(line);
                lineMaterials.push(material);
                scene.add(line);
            }
        }

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Smooth network rotation
            scene.rotation.y += 0.001;
            scene.rotation.x += mouseY * 0.0005;
            scene.rotation.z += mouseX * 0.0005;

            // Pulsing glow effect on particles
            nodes.forEach((node, i) => {
                if (i % 2 === 1) { // Only glow spheres
                    const pulse = Math.sin(elapsedTime * 3 + i) * 0.1 + 0.15;
                    (node.material as THREE.MeshBasicMaterial).opacity = isDark ? pulse : pulse * 0.7;
                }
            });

            // Shining link animation
            lineMaterials.forEach((material, i) => {
                const pulse = Math.sin(elapsedTime * 2 + i * 0.5) * 0.2 + 0.4;
                material.opacity = pulse;
            });

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            containerRef.current?.removeChild(renderer.domElement);

            nodes.forEach(node => {
                node.geometry.dispose();
                (node.material as THREE.Material).dispose();
            });

            lines.forEach(line => {
                line.geometry.dispose();
                (line.material as THREE.Material).dispose();
            });

            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}
