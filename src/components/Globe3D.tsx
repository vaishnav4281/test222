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
        camera.position.z = 12; // Closer for better detail

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

        // 1. Solid Tech Sphere (Replacing Dots)
        // A solid but transparent sphere with a tech grid texture
        const geometry = new THREE.SphereGeometry(3.8, 64, 64);

        // Custom shader for a "Holographic" look
        const material = new THREE.ShaderMaterial({
            uniforms: {
                baseColor: { value: new THREE.Color(0xffffff) },
                glowColor: { value: new THREE.Color(0x3b82f6) },
                viewVector: { value: camera.position },
                time: { value: 0 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.6 - dot(vNormal, vNormel), 2.5); // Fresnel rim light
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 baseColor;
                uniform vec3 glowColor;
                uniform float time;
                varying float intensity;
                varying vec2 vUv;
                
                void main() {
                    // Grid pattern
                    float gridX = step(0.98, fract(vUv.x * 20.0 + time * 0.05));
                    float gridY = step(0.98, fract(vUv.y * 10.0));
                    float grid = max(gridX, gridY);
                    
                    // Mix base color with glow
                    vec3 finalColor = mix(baseColor, glowColor, intensity);
                    
                    // Add grid lines
                    finalColor += vec3(grid) * 0.5;
                    
                    // Alpha based on intensity (rim) and grid
                    float alpha = intensity * 0.8 + grid * 0.3;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.FrontSide,
            depthWrite: false, // Prevents occlusion issues
            blending: THREE.AdditiveBlending
        });

        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // 2. Inner Core - Solid
        const coreGeometry = new THREE.SphereGeometry(3.4, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black core to block background
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Particles (Red & Blue)
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 150;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const sizeArray = new Float32Array(particleCount);
        const speedArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa);
        const colorRed = new THREE.Color(0xf87171);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = 4.5 + Math.random() * 1.5;

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

            sizeArray[i] = 0.8 + Math.random() * 0.5;
            speedArray[i] = 0.002 + Math.random() * 0.004;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Rings - Clean
        const ringGeo = new THREE.TorusGeometry(6.0, 0.01, 16, 100);

        const ringMatBlue = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 10;
        globeGroup.add(ringBlue);

        const ringMatRed = new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
        const ringRed = new THREE.Mesh(ringGeo, ringMatRed);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 10;
        globeGroup.add(ringRed);

        // Mouse
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
            material.uniforms.time.value = time;

            const isHovering = containerRef.current?.matches(':hover');
            const rotationSpeed = isHovering ? 0.004 : 0.001;
            targetRotation.x = (mouse.y * 0.00015);
            targetRotation.y = (mouse.x * 0.00015);

            globeGroup.rotation.y += rotationSpeed;
            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.08;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.08;

            const positions = particlesGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const z = positions[i3 + 2];
                const speed = speedArray[i] * (isHovering ? 2 : 1);

                positions[i3] = x * Math.cos(speed) - z * Math.sin(speed);
                positions[i3 + 2] = x * Math.sin(speed) + z * Math.cos(speed);
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            ringBlue.rotation.z += 0.001;
            ringRed.rotation.z -= 0.001;
            ringBlue.rotation.x = Math.PI / 2 + Math.sin(time * 0.5) * 0.1;
            ringRed.rotation.x = Math.PI / 2 + Math.cos(time * 0.5) * 0.1;

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                // Dark Mode: Holographic White/Blue
                material.uniforms.baseColor.value.setHex(0xffffff);
                material.uniforms.glowColor.value.setHex(0x3b82f6);
                material.blending = THREE.AdditiveBlending;
                coreMaterial.color.setHex(0x000000); // Black core hides background

                particlesMaterial.opacity = 1.0;
                ringMatBlue.opacity = 0.6;
                ringMatRed.opacity = 0.6;
            } else {
                // Light Mode: Solid Dark Tech Look
                material.uniforms.baseColor.value.setHex(0x111827); // Dark Grey
                material.uniforms.glowColor.value.setHex(0x3b82f6);
                material.blending = THREE.NormalBlending; // Solid blending for visibility
                coreMaterial.color.setHex(0xffffff); // White core

                particlesMaterial.opacity = 1.0;
                ringMatBlue.opacity = 0.7;
                ringMatRed.opacity = 0.7;
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
