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
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Create visible wave mesh
        const geometry = new THREE.PlaneGeometry(15, 15, 50, 50);
        const material = new THREE.MeshBasicMaterial({
            color: isDark ? 0x3b82f6 : 0xef4444,
            wireframe: true,
            transparent: true,
            opacity: isDark ? 0.15 : 0.12,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 3;
        scene.add(mesh);

        // Add floating spheres for depth
        const spheres: THREE.Mesh[] = [];
        for (let i = 0; i < 8; i++) {
            const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: isDark ? 0x60a5fa : 0xf87171,
                wireframe: true,
                transparent: true,
                opacity: isDark ? 0.3 : 0.25,
            });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5
            );
            spheres.push(sphere);
            scene.add(sphere);
        }

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

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

            // Smooth mouse following
            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            // Animate wave mesh
            const positions = geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const wave1 = Math.sin(x * 0.5 + elapsedTime) * 0.5;
                const wave2 = Math.sin(y * 0.5 + elapsedTime * 0.8) * 0.5;
                positions.setZ(i, wave1 + wave2);
            }
            positions.needsUpdate = true;

            // Rotate mesh with mouse
            mesh.rotation.z = targetX * 0.3;
            mesh.rotation.y = targetY * 0.2;

            // Animate spheres
            spheres.forEach((sphere, i) => {
                sphere.position.y = Math.sin(elapsedTime + i) * 2;
                sphere.rotation.y = elapsedTime * 0.5;
                sphere.rotation.x = elapsedTime * 0.3;
            });

            // Color shift based on time
            const hue = (elapsedTime * 20) % 360;
            if (isDark) {
                material.color.setHSL(hue / 360, 0.7, 0.5);
                spheres.forEach(sphere => {
                    (sphere.material as THREE.MeshBasicMaterial).color.setHSL((hue + 30) / 360, 0.7, 0.6);
                });
            } else {
                material.color.setHSL(hue / 360, 0.8, 0.55);
                spheres.forEach(sphere => {
                    (sphere.material as THREE.MeshBasicMaterial).color.setHSL((hue + 30) / 360, 0.8, 0.6);
                });
            }

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
            geometry.dispose();
            material.dispose();
            spheres.forEach(sphere => {
                sphere.geometry.dispose();
                (sphere.material as THREE.Material).dispose();
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
