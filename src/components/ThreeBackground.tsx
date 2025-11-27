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

        // Create flowing particles
        const particleCount = 150;
        const particles: {
            mesh: THREE.Mesh;
            velocity: THREE.Vector3;
            originalPos: THREE.Vector3;
        }[] = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: isDark ? 0x60a5fa : 0xf87171,
                transparent: true,
                opacity: isDark ? 0.4 : 0.3,
            });
            const particle = new THREE.Mesh(geometry, material);

            // Random position
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 10;

            particle.position.set(x, y, z);

            particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.01
                ),
                originalPos: new THREE.Vector3(x, y, z),
            });

            scene.add(particle);
        }

        // Mouse tracking
        const mouse = new THREE.Vector2();
        const mouse3D = new THREE.Vector3();

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Convert 2D mouse to 3D position
            mouse3D.set(mouse.x * 10, mouse.y * 10, 0);
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            particles.forEach((particle, i) => {
                // Gentle floating motion
                particle.mesh.position.x += particle.velocity.x;
                particle.mesh.position.y += particle.velocity.y;
                particle.mesh.position.z += particle.velocity.z;

                // Add gentle wave motion
                particle.mesh.position.y += Math.sin(elapsedTime + i * 0.5) * 0.002;

                // Distance from mouse
                const dx = particle.mesh.position.x - mouse3D.x;
                const dy = particle.mesh.position.y - mouse3D.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Move away from mouse (Google Antigravity effect)
                if (distance < 3) {
                    const force = (3 - distance) / 3;
                    particle.mesh.position.x += (dx / distance) * force * 0.1;
                    particle.mesh.position.y += (dy / distance) * force * 0.1;
                }

                // Gentle pull back to original position
                particle.mesh.position.x += (particle.originalPos.x - particle.mesh.position.x) * 0.001;
                particle.mesh.position.y += (particle.originalPos.y - particle.mesh.position.y) * 0.001;
                particle.mesh.position.z += (particle.originalPos.z - particle.mesh.position.z) * 0.001;

                // Wrap around screen edges
                if (particle.mesh.position.x > 10) particle.mesh.position.x = -10;
                if (particle.mesh.position.x < -10) particle.mesh.position.x = 10;
                if (particle.mesh.position.y > 10) particle.mesh.position.y = -10;
                if (particle.mesh.position.y < -10) particle.mesh.position.y = 10;

                // Subtle color shift
                const hue = ((elapsedTime * 20 + i * 10) % 360) / 360;
                (particle.mesh.material as THREE.MeshBasicMaterial).color.setHSL(
                    hue,
                    isDark ? 0.6 : 0.7,
                    isDark ? 0.6 : 0.65
                );

                // Subtle size pulse
                const scale = 1 + Math.sin(elapsedTime * 2 + i) * 0.2;
                particle.mesh.scale.setScalar(scale);
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

            particles.forEach(particle => {
                particle.mesh.geometry.dispose();
                (particle.mesh.material as THREE.Material).dispose();
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
