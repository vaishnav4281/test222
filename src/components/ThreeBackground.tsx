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
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Create network nodes (representing domains/servers)
        const nodes: THREE.Mesh[] = [];
        const nodePositions: THREE.Vector3[] = [];
        const nodeCount = 12;

        for (let i = 0; i < nodeCount; i++) {
            const geometry = new THREE.SphereGeometry(0.15, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: isDark ? 0x3b82f6 : 0xef4444,
                transparent: true,
                opacity: 0.8,
            });
            const node = new THREE.Mesh(geometry, material);

            // Distribute nodes in 3D space
            const radius = 5;
            const theta = (i / nodeCount) * Math.PI * 2;
            const phi = Math.acos(2 * (i / nodeCount) - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            node.position.set(x, y, z);
            nodePositions.push(new THREE.Vector3(x, y, z));
            nodes.push(node);
            scene.add(node);
        }

        // Create connections (representing data flow)
        const lines: THREE.Line[] = [];
        const lineMaterials: THREE.LineBasicMaterial[] = [];

        for (let i = 0; i < nodeCount; i++) {
            // Connect each node to 2-3 nearby nodes
            const connectionsPerNode = 2;
            for (let j = 1; j <= connectionsPerNode; j++) {
                const targetIndex = (i + j * 3) % nodeCount;

                const points = [];
                points.push(nodePositions[i]);
                points.push(nodePositions[targetIndex]);

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: isDark ? 0x60a5fa : 0xf87171,
                    transparent: true,
                    opacity: 0.3,
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
        let targetRotationX = 0;
        let targetRotationY = 0;

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

            // Smooth rotation following mouse
            targetRotationY = mouseX * 0.3;
            targetRotationX = mouseY * 0.3;

            // Apply rotation to entire network
            scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.05;
            scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.05;

            // Auto-rotate slowly
            scene.rotation.y += 0.001;

            // Animate nodes (pulsing effect)
            nodes.forEach((node, i) => {
                const pulse = Math.sin(elapsedTime * 2 + i) * 0.05 + 1;
                node.scale.setScalar(pulse);

                // Color shift nodes
                const hue = ((elapsedTime * 30 + i * 30) % 360) / 360;
                (node.material as THREE.MeshBasicMaterial).color.setHSL(
                    hue,
                    isDark ? 0.7 : 0.8,
                    isDark ? 0.5 : 0.55
                );
            });

            // Animate connections (data flow pulse)
            lineMaterials.forEach((material, i) => {
                const pulse = Math.sin(elapsedTime * 3 + i * 0.5) * 0.3 + 0.4;
                material.opacity = pulse;

                // Color shift connections
                const hue = ((elapsedTime * 30 + i * 15) % 360) / 360;
                material.color.setHSL(
                    hue,
                    isDark ? 0.6 : 0.7,
                    isDark ? 0.6 : 0.65
                );
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
