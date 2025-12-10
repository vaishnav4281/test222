import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Group to hold everything
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // 1. Main Wireframe Sphere
        const geometry = new THREE.IcosahedronGeometry(5, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x3b82f6, // Blue-500
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // 2. Inner Core (Solid but transparent)
        const coreGeometry = new THREE.IcosahedronGeometry(4.9, 2);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x1e40af, // Blue-800
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide // Render inside
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Particles / Nodes
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        const posArray = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Random points on sphere surface
            const phi = Math.acos(-1 + (2 * i / 3) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;

            const r = 5.2; // Slightly outside wireframe

            posArray[i] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i + 2] = r * Math.cos(phi);
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.15,
            color: 0x60a5fa, // Blue-400
            transparent: true,
            opacity: 0.8,
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Orbital Rings
        const ringGeo = new THREE.TorusGeometry(7, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3 }); // Red ring
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = Math.PI / 6;
        globeGroup.add(ring);

        const ringGeo2 = new THREE.TorusGeometry(6, 0.02, 16, 100);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3 }); // Blue ring
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.rotation.x = Math.PI / 2;
        ring2.rotation.y = -Math.PI / 6;
        globeGroup.add(ring2);


        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate Globe
            sphere.rotation.y += 0.002;
            core.rotation.y += 0.002;
            particlesMesh.rotation.y += 0.002;

            // Rotate Rings
            ring.rotation.z += 0.005;
            ring2.rotation.z -= 0.003;

            // Gentle float
            globeGroup.position.y = Math.sin(Date.now() * 0.001) * 0.2;

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Theme handling
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                material.color.setHex(0x3b82f6);
                material.opacity = 0.3;
                coreMaterial.opacity = 0.1;
            } else {
                material.color.setHex(0x2563eb);
                material.opacity = 0.4; // Darker for light mode
                coreMaterial.opacity = 0.05;
            }
        };

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        updateTheme();

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
}
