import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 14; // Closer, more immersive

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        // --- Shaders ---

        // 1. Holographic Globe Shader
        const globeVertexShader = `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                vUv = uv;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const globeFragmentShader = `
            uniform vec3 colorPrimary;
            uniform vec3 colorSecondary;
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                
                // Fresnel Rim Light
                float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);
                
                // Grid Pattern
                float gridX = step(0.98, mod(vUv.x * 40.0, 1.0));
                float gridY = step(0.98, mod(vUv.y * 20.0, 1.0));
                float grid = max(gridX, gridY);

                // Scanline
                float scan = sin(vUv.y * 20.0 - time * 2.0) * 0.1;

                vec3 finalColor = mix(colorPrimary, colorSecondary, fresnel);
                finalColor += vec3(grid) * colorSecondary * 0.5;
                finalColor += vec3(scan) * colorSecondary;

                gl_FragColor = vec4(finalColor, fresnel * 0.8 + 0.1 + grid * 0.3);
            }
        `;

        // 2. Atmosphere Glow Shader
        const atmosphereVertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const atmosphereFragmentShader = `
            uniform vec3 colorGlow;
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                gl_FragColor = vec4(colorGlow, intensity * 0.8);
            }
        `;

        // --- Objects ---

        // 1. Main Globe
        const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
        const globeMaterial = new THREE.ShaderMaterial({
            vertexShader: globeVertexShader,
            fragmentShader: globeFragmentShader,
            uniforms: {
                colorPrimary: { value: new THREE.Color(0x1e293b) }, // Dark Slate
                colorSecondary: { value: new THREE.Color(0x3b82f6) }, // Blue
                time: { value: 0 }
            },
            transparent: true,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        group.add(globe);

        // 2. Atmosphere Glow
        const atmosGeometry = new THREE.SphereGeometry(5.4, 64, 64);
        const atmosMaterial = new THREE.ShaderMaterial({
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
            uniforms: {
                colorGlow: { value: new THREE.Color(0x3b82f6) }
            },
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
        group.add(atmosphere);

        // 3. Particles (Data Nodes)
        const particlesGeo = new THREE.BufferGeometry();
        const particleCount = 200;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const sizeArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa);
        const colorRed = new THREE.Color(0xf87171);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Distribute on sphere surface + random float
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = 5.1 + Math.random() * 1.5; // Floating layer

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.7 ? colorRed : colorBlue;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

            sizeArray[i] = Math.random();
        }

        particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        particlesGeo.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

        const particlesMat = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particlesGeo, particlesMat);
        group.add(particles);

        // 4. Rings (Orbital Data Paths)
        const ringGeo = new THREE.TorusGeometry(7, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending });

        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.rotation.y = Math.PI / 6;
        group.add(ring1);

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.rotation.y = -Math.PI / 6;
        ring2.scale.setScalar(0.85);
        group.add(ring2);


        // --- Interaction ---
        const mouse = new THREE.Vector2();
        const targetRotation = new THREE.Vector2();
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const onMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX - windowHalfX);
            mouse.y = (event.clientY - windowHalfY);
        };

        if (window.matchMedia("(pointer: fine)").matches) {
            document.addEventListener('mousemove', onMouseMove);
        }

        // --- Animation Loop ---
        const animate = () => {
            requestAnimationFrame(animate);

            const time = Date.now() * 0.001;
            globeMaterial.uniforms.time.value = time;

            // Rotation
            const hoverSpeed = containerRef.current?.matches(':hover') ? 2.5 : 1;

            targetRotation.x = mouse.y * 0.0001;
            targetRotation.y = mouse.x * 0.0001;

            group.rotation.y += 0.001 * hoverSpeed;
            group.rotation.x += (targetRotation.x - group.rotation.x) * 0.05;
            group.rotation.y += (targetRotation.y - group.rotation.y) * 0.05;

            // Particles Pulse
            particles.rotation.y -= 0.0005 * hoverSpeed;

            // Rings
            ring1.rotation.z += 0.002;
            ring2.rotation.z -= 0.002;
            ring1.scale.setScalar(1 + Math.sin(time * 0.5) * 0.02);

            renderer.render(scene, camera);
        };
        animate();

        // --- Resize ---
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // --- Theme Management ---
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');

            if (isDark) {
                // Dark Mode: Cyberpunk / Intelligence
                globeMaterial.uniforms.colorPrimary.value.setHex(0x0f172a); // Dark Slate
                globeMaterial.uniforms.colorSecondary.value.setHex(0x3b82f6); // Blue Glow
                atmosMaterial.uniforms.colorGlow.value.setHex(0x3b82f6);
                ringMat.color.setHex(0x3b82f6);
                ringMat.opacity = 0.2;
            } else {
                // Light Mode: Clean Corporate / Scientific
                globeMaterial.uniforms.colorPrimary.value.setHex(0xffffff); // White
                globeMaterial.uniforms.colorSecondary.value.setHex(0x2563eb); // Darker Blue for contrast
                atmosMaterial.uniforms.colorGlow.value.setHex(0x2563eb);
                ringMat.color.setHex(0x94a3b8); // Slate ring
                ringMat.opacity = 0.4;
            }
        };

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        updateTheme();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousemove', onMouseMove);
            observer.disconnect();
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            globeGeometry.dispose();
            globeMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[400px] transition-transform duration-700 hover:scale-105 cursor-pointer"
        />
    );
}
