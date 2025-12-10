import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 15; // Slightly closer for impact

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

        // 1. Main Wireframe Sphere - High Definition
        const geometry = new THREE.IcosahedronGeometry(5.5, 3); // Increased detail (3) for premium look
        const material = new THREE.MeshBasicMaterial({
            color: 0x333333,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // 2. Inner Core - Premium Shader
        const coreGeometry = new THREE.SphereGeometry(5.2, 64, 64);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x3b82f6) },
                viewVector: { value: camera.position },
                opacity: { value: 0.5 },
                time: { value: 0 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float time;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    // Pulsing intensity
                    float pulse = 0.5 + 0.1 * sin(time * 2.0);
                    intensity = pow(pulse - dot(vNormal, vNormel), 4.5);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float opacity;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, opacity * intensity * 1.5);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Premium Particles (Red & Blue)
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 200; // Increased density
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const sizeArray = new Float32Array(particleCount);
        const speedArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa); // Lighter blue for visibility
        const colorRed = new THREE.Color(0xf87171); // Lighter red for visibility

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = 6.2 + Math.random() * 1.0;

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

            sizeArray[i] = 0.5 + Math.random() * 0.5;
            speedArray[i] = 0.001 + Math.random() * 0.003;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Elegant Orbital Rings
        const ringGeo = new THREE.TorusGeometry(8.5, 0.008, 16, 100); // Thinner, more elegant

        const ringMatBlue = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 10;
        globeGroup.add(ringBlue);

        const ringMatRed = new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        const ringRed = new THREE.Mesh(ringGeo, ringMatRed);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 10;
        globeGroup.add(ringRed);

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
        let time = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            time += 0.01;
            coreMaterial.uniforms.time.value = time;

            // Interaction Logic
            const isHovering = containerRef.current?.matches(':hover');

            // Smoother rotation
            const rotationSpeed = isHovering ? 0.003 : 0.001;
            targetRotation.x = (mouse.y * 0.00015); // Subtle mouse follow
            targetRotation.y = (mouse.x * 0.00015);

            globeGroup.rotation.y += rotationSpeed;
            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.08;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.08;

            // Particle Orbit
            const positions = particlesGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const z = positions[i3 + 2];
                const speed = speedArray[i] * (isHovering ? 2 : 1); // Speed up on hover

                positions[i3] = x * Math.cos(speed) - z * Math.sin(speed);
                positions[i3 + 2] = x * Math.sin(speed) + z * Math.cos(speed);
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            // Ring Animation
            ringBlue.rotation.z += 0.001;
            ringRed.rotation.z -= 0.001;
            ringBlue.rotation.x = Math.PI / 2 + Math.sin(time * 0.5) * 0.1;
            ringRed.rotation.x = Math.PI / 2 + Math.cos(time * 0.5) * 0.1;

            // Core Color Shift
            const r = (Math.sin(time * 0.5) + 1) * 0.5;
            const coreColor = new THREE.Color().lerpColors(new THREE.Color(0x3b82f6), new THREE.Color(0xef4444), r);
            coreMaterial.uniforms.glowColor.value.copy(coreColor);

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
                // Dark Mode: Premium Silver/Grey Wireframe for High Visibility against Dark BG
                material.color.setHex(0xe2e8f0); // Slate-200 (Silver)
                material.opacity = 0.12; // Subtle but visible

                coreMaterial.uniforms.opacity.value = 0.5;

                particlesMaterial.opacity = 0.9;

                ringMatBlue.opacity = 0.4;
                ringMatRed.opacity = 0.4;
            } else {
                // Light Mode: Dark Charcoal Wireframe for High Visibility against White BG
                material.color.setHex(0x1e293b); // Slate-800 (Dark Charcoal)
                material.opacity = 0.15; // Crisp lines

                coreMaterial.uniforms.opacity.value = 0.7; // Stronger core

                particlesMaterial.opacity = 1.0;

                ringMatBlue.opacity = 0.6;
                ringMatRed.opacity = 0.6;
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

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[400px] transition-all duration-700 ease-out hover:scale-105 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        />
    );
}
