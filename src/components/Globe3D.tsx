import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 16; // Optimized distance

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

        // 1. Main Wireframe Sphere - Sleeker, less dense
        const geometry = new THREE.IcosahedronGeometry(5.5, 2); // Reduced detail for sleek look
        const material = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // 2. Inner Core - Subtle
        const coreGeometry = new THREE.SphereGeometry(5, 32, 32);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x2563eb) },
                viewVector: { value: camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.55 - dot(vNormal, vNormel), 4.5);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 0.8);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Floating Data Nodes - Minimalist
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 80; // Reduced count
        const posArray = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            const phi = Math.acos(-1 + (2 * i / 3) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = 5.8 + Math.random() * 0.4;

            posArray[i] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i + 2] = r * Math.cos(phi);
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.12,
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Orbital Rings - Thinner, elegant
        const ringGeo = new THREE.TorusGeometry(7.5, 0.01, 16, 100); // Thinner tube
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = Math.PI / 8;
        globeGroup.add(ring);

        // Mouse Interaction
        const mouse = new THREE.Vector2();
        const targetRotation = new THREE.Vector2();
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const onDocumentMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX - windowHalfX);
            mouse.y = (event.clientY - windowHalfY);
        };

        if (window.matchMedia("(pointer: fine)").matches) {
            document.addEventListener('mousemove', onDocumentMouseMove);
        }

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            targetRotation.x = (mouse.y * 0.0002);
            targetRotation.y = (mouse.x * 0.0002);

            globeGroup.rotation.y += 0.001; // Slower auto rotate
            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.05;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.05;

            particlesMesh.rotation.y -= 0.0005;

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
                // Dark Mode: Sleek Black/Silver/White - No Blue
                material.color.setHex(0x333333); // Dark Grey wireframe
                material.opacity = 0.15;

                coreMaterial.uniforms.glowColor.value.setHex(0x1a1a1a); // Very subtle dark glow

                particlesMaterial.color.setHex(0xffffff); // White nodes
                particlesMaterial.opacity = 0.4;

                ringMat.color.setHex(0x404040); // Dark grey ring
                ringMat.opacity = 0.3;
            } else {
                // Light Mode: Keep the clean Blue
                material.color.setHex(0x2563eb);
                material.opacity = 0.15;

                coreMaterial.uniforms.glowColor.value.setHex(0x3b82f6);

                particlesMaterial.color.setHex(0x60a5fa);
                particlesMaterial.opacity = 0.6;

                ringMat.color.setHex(0x93c5fd);
                ringMat.opacity = 0.4;
            }
        };

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        updateTheme();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousemove', onDocumentMouseMove);
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
