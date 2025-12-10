import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            45,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 12;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        containerRef.current.appendChild(renderer.domElement);

        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const GLOBE_RADIUS = 2.2;

        // Glass-like globe with inner glow
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
        const globeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1e40af,
            metalness: 0.2,
            roughness: 0.1,
            transparent: true,
            opacity: 0.15,
            transmission: 0.9,
            thickness: 0.5,
            envMapIntensity: 1.0
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globeGroup.add(globe);

        // Inner glowing core
        const coreGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 0.3, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.4
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // Latitude/Longitude grid lines
        const gridGroup = new THREE.Group();
        const createGridLine = (points: THREE.Vector3[], color: number, opacity: number) => {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity,
                blending: THREE.AdditiveBlending
            });
            return new THREE.Line(geometry, material);
        };

        // Latitude lines
        for (let lat = -60; lat <= 60; lat += 20) {
            const points = [];
            const radius = Math.cos((lat * Math.PI) / 180) * GLOBE_RADIUS;
            const y = Math.sin((lat * Math.PI) / 180) * GLOBE_RADIUS;
            for (let i = 0; i <= 128; i++) {
                const theta = (i / 128) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(theta) * radius,
                    y,
                    Math.sin(theta) * radius
                ));
            }
            gridGroup.add(createGridLine(points, 0x60a5fa, 0.4));
        }

        // Longitude lines
        for (let lon = 0; lon < 180; lon += 20) {
            const points = [];
            for (let i = 0; i <= 128; i++) {
                const phi = (i / 128) * Math.PI;
                const theta = (lon * Math.PI) / 180;
                points.push(new THREE.Vector3(
                    GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
                    GLOBE_RADIUS * Math.cos(phi),
                    GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta)
                ));
            }
            gridGroup.add(createGridLine(points, 0x60a5fa, 0.4));
        }
        globeGroup.add(gridGroup);

        // Glowing particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 80;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = GLOBE_RADIUS + 0.2 + Math.random() * 0.8;

            positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
            positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const isBlue = Math.random() > 0.3;
            const color = isBlue ? new THREE.Color(0x60a5fa) : new THREE.Color(0xef4444);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            speeds[i] = 0.001 + Math.random() * 0.002;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // Dual orbital rings with shaders
        const createRing = (radius: number, color: THREE.Color, phaseOffset: number) => {
            const geometry = new THREE.TorusGeometry(radius, 0.01, 16, 100);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: color },
                    phase: { value: phaseOffset }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float phase;
                    varying vec2 vUv;
                    
                    void main() {
                        float wave = sin(vUv.x * 6.28 * 2.0 - time * 3.0 + phase) * 0.4 + 0.6;
                        float pulse = sin(time * 2.0 + phase) * 0.2 + 0.8;
                        gl_FragColor = vec4(color, wave * pulse * 0.7);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            return { mesh: new THREE.Mesh(geometry, material), material };
        };

        const ring1 = createRing(GLOBE_RADIUS + 1.5, new THREE.Color(0x60a5fa), 0);
        ring1.mesh.rotation.x = Math.PI / 2;
        ring1.mesh.rotation.y = 0.3;
        globeGroup.add(ring1.mesh);

        const ring2 = createRing(GLOBE_RADIUS + 1.7, new THREE.Color(0xef4444), Math.PI);
        ring2.mesh.rotation.x = Math.PI / 2;
        ring2.mesh.rotation.y = -0.3;
        globeGroup.add(ring2.mesh);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x60a5fa, 2, 50);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xef4444, 1.5, 50);
        pointLight2.position.set(-5, -3, 3);
        scene.add(pointLight2);

        // Mouse interaction
        const mouse = new THREE.Vector2();
        const targetRotation = new THREE.Euler(0, 0, 0);
        const currentRotation = new THREE.Euler(0, 0, 0);

        const onMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            targetRotation.x = mouse.y * 0.2;
            targetRotation.y = mouse.x * 0.2;
        };

        if (window.matchMedia("(pointer: fine)").matches) {
            window.addEventListener('mousemove', onMouseMove);
        }

        // Animation
        let time = 0;
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            time += delta;

            ring1.material.uniforms.time.value = time;
            ring2.material.uniforms.time.value = time;

            const isHovering = containerRef.current?.matches(':hover');
            const autoRotateSpeed = isHovering ? 0.08 : 0.04;

            currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
            currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;

            globeGroup.rotation.x = currentRotation.x;
            globeGroup.rotation.y += autoRotateSpeed * delta;

            // Core pulsing
            const coreScale = 1 + Math.sin(time * 2) * 0.1;
            core.scale.setScalar(coreScale);

            // Particle rotation
            const particlePositions = particlesGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const x = particlePositions[i3];
                const z = particlePositions[i3 + 2];
                const speed = speeds[i] * (isHovering ? 1.5 : 1);

                particlePositions[i3] = x * Math.cos(speed) - z * Math.sin(speed);
                particlePositions[i3 + 2] = x * Math.sin(speed) + z * Math.cos(speed);
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            // Ring counter-rotation
            ring1.mesh.rotation.z += 0.004;
            ring2.mesh.rotation.z -= 0.003;

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Theme handler
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');

            if (isDark) {
                // Dark mode - vibrant blue glass
                globeMaterial.color.set(0x1e40af);
                globeMaterial.opacity = 0.15;
                coreMaterial.color.set(0x60a5fa);
                coreMaterial.opacity = 0.4;

                // Grid lines - bright blue
                gridGroup.children.forEach((line) => {
                    (line as THREE.Line).material.opacity = 0.4;
                });

                ambientLight.intensity = 0.6;
                pointLight1.intensity = 2;
                pointLight2.intensity = 1.5;
            } else {
                // Light mode - darker glass for contrast
                globeMaterial.color.set(0x0c4a6e);
                globeMaterial.opacity = 0.2;
                coreMaterial.color.set(0x0284c7);
                coreMaterial.opacity = 0.5;

                // Grid lines - darker and more visible
                gridGroup.children.forEach((line) => {
                    (line as THREE.Line).material.opacity = 0.5;
                    ((line as THREE.Line).material as THREE.LineBasicMaterial).color.set(0x0369a1);
                });

                ambientLight.intensity = 0.8;
                pointLight1.intensity = 1.5;
                pointLight2.intensity = 1;
            }
        };

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        updateTheme();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMouseMove);
            observer.disconnect();

            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }

            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full absolute inset-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        />
    );
}
