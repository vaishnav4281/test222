import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 18; // Moved back slightly for better view

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

        // 1. Main Wireframe Sphere (The "Grid")
        const geometry = new THREE.IcosahedronGeometry(6, 3); // More detail
        const material = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // 2. Glowing Core
        const coreGeometry = new THREE.SphereGeometry(5.5, 32, 32);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { value: 0.5 },
                p: { value: 3.0 },
                glowColor: { value: new THREE.Color(0x2563eb) },
                viewVector: { value: camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.6 - dot(vNormal, vNormel), 4.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 1.0);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Floating Data Nodes (Particles)
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 150;
        const posArray = new Float32Array(particleCount * 3);
        const sizesArray = new Float32Array(particleCount);

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Random points on sphere surface
            const phi = Math.acos(-1 + (2 * i / 3) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;

            const r = 6.2 + Math.random() * 0.5; // Floating outside

            posArray[i] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i + 2] = r * Math.cos(phi);

            sizesArray[i / 3] = Math.random();
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizesArray, 1));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.15,
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Orbital Rings (Scanning effect)
        const ringGeo = new THREE.TorusGeometry(8, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = Math.PI / 8;
        globeGroup.add(ring);

        const ringGeo2 = new THREE.TorusGeometry(7, 0.02, 16, 100);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.rotation.x = Math.PI / 2;
        ring2.rotation.y = -Math.PI / 8;
        globeGroup.add(ring2);

        // Mouse Interaction
        const mouse = new THREE.Vector2();
        const targetRotation = new THREE.Vector2();
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const onDocumentMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX - windowHalfX);
            mouse.y = (event.clientY - windowHalfY);
        };

        document.addEventListener('mousemove', onDocumentMouseMove);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            // Smooth rotation based on mouse
            targetRotation.x = (mouse.y * 0.0005);
            targetRotation.y = (mouse.x * 0.0005);

            globeGroup.rotation.y += 0.002; // Auto rotate
            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.05;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.05;

            // Pulse rings
            const time = Date.now() * 0.001;
            ring.scale.setScalar(1 + Math.sin(time) * 0.05);
            ring2.scale.setScalar(1 + Math.cos(time) * 0.05);

            // Rotate particles independently
            particlesMesh.rotation.y -= 0.001;

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
                material.opacity = 0.15;
                coreMaterial.uniforms.glowColor.value.setHex(0x2563eb);
            } else {
                material.color.setHex(0x2563eb);
                material.opacity = 0.2;
                coreMaterial.uniforms.glowColor.value.setHex(0x3b82f6);
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

    return <div ref={containerRef} className="w-full h-full min-h-[500px]" />;
}
