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
        camera.position.z = 16;

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
        const geometry = new THREE.IcosahedronGeometry(5.5, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x333333,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
            // Remove AdditiveBlending to ensure visibility in light mode (dark lines on light bg)
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // 2. Inner Core - Dynamic Shader
        const coreGeometry = new THREE.SphereGeometry(5, 64, 64);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x3b82f6) },
                viewVector: { value: camera.position },
                opacity: { value: 0.6 }
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
                uniform float opacity;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, opacity * intensity);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Particles (Red & Blue)
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 150;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const sizeArray = new Float32Array(particleCount);
        const speedArray = new Float32Array(particleCount); // For individual movement

        const colorBlue = new THREE.Color(0x3b82f6);
        const colorRed = new THREE.Color(0xef4444);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Spread particles in a shell
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = 6.0 + Math.random() * 1.5; // Wider spread

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            // Mix colors
            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

            sizeArray[i] = Math.random();
            speedArray[i] = 0.002 + Math.random() * 0.005;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Orbital Rings
        const ringGeo = new THREE.TorusGeometry(8, 0.01, 16, 100);

        const ringMatBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 8;
        globeGroup.add(ringBlue);

        const ringMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
        const ringRed = new THREE.Mesh(ringGeo, ringMatRed);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 8;
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

            // Interaction Logic
            const isHovering = containerRef.current?.matches(':hover');

            // Rotation
            const rotationSpeed = isHovering ? 0.004 : 0.0015;
            targetRotation.x = (mouse.y * 0.0003);
            targetRotation.y = (mouse.x * 0.0003);

            globeGroup.rotation.y += rotationSpeed;
            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.05;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.05;

            // Particles Movement (Breathing + Orbit)
            const positions = particlesGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                // Simple orbit effect
                const x = positions[i3];
                const z = positions[i3 + 2];
                const speed = speedArray[i];

                // Rotate around Y axis
                positions[i3] = x * Math.cos(speed) - z * Math.sin(speed);
                positions[i3 + 2] = x * Math.sin(speed) + z * Math.cos(speed);
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            // Rings Animation
            ringBlue.rotation.z += 0.002;
            ringRed.rotation.z -= 0.002;

            // Pulse scale
            const pulse = 1 + Math.sin(time * 1.5) * 0.03;
            ringBlue.scale.setScalar(pulse);
            ringRed.scale.setScalar(pulse);

            // Core Color Shift
            const r = (Math.sin(time * 0.8) + 1) * 0.5;
            const coreColor = new THREE.Color().lerpColors(colorBlue, colorRed, r);
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
                // Dark Mode: Stealthy, Dark Wireframe
                material.color.setHex(0x404040);
                material.opacity = 0.15;
                coreMaterial.uniforms.opacity.value = 0.6;
                particlesMaterial.opacity = 0.8;
                ringMatBlue.opacity = 0.3;
                ringMatRed.opacity = 0.3;
            } else {
                // Light Mode: High Contrast, Darker Wireframe for visibility
                material.color.setHex(0x64748b); // Slate-500 (Visible on white)
                material.opacity = 0.3;
                coreMaterial.uniforms.opacity.value = 0.8; // Stronger core
                particlesMaterial.opacity = 1.0; // More visible particles
                ringMatBlue.opacity = 0.5;
                ringMatRed.opacity = 0.5;
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
