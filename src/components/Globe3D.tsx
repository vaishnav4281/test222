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

        // Main solid globe with wireframe
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
        const globeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.4,
            transparent: true,
            opacity: 0.95
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globeGroup.add(globe);

        // Wireframe overlay
        const wireframeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.01, 64, 64);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        globeGroup.add(wireframe);

        // Grid lines - store materials for theme updates
        const gridMaterials: THREE.LineBasicMaterial[] = [];
        const gridColorBlue = new THREE.Color(0x60a5fa);
        const gridColorRed = new THREE.Color(0xef4444);

        [-60, -30, 0, 30, 60].forEach((lat, index) => {
            const radius = Math.cos((lat * Math.PI) / 180) * GLOBE_RADIUS;
            const y = Math.sin((lat * Math.PI) / 180) * GLOBE_RADIUS;
            const points = [];
            for (let i = 0; i <= 128; i++) {
                const theta = (i / 128) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(theta) * radius,
                    y,
                    Math.sin(theta) * radius
                ));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: index % 2 === 0 ? gridColorBlue : gridColorRed,
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
                linewidth: 2
            });
            gridMaterials.push(material);
            globeGroup.add(new THREE.Line(geometry, material));
        });

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
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: (lon / 20) % 2 === 0 ? gridColorBlue : gridColorRed,
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
                linewidth: 2
            });
            gridMaterials.push(material);
            globeGroup.add(new THREE.Line(geometry, material));
        }

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const speedArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa);
        const colorRed = new THREE.Color(0xef4444);

        for (let i = 0; i < particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = GLOBE_RADIUS + 0.3 + Math.random() * 1.0;

            posArray[i * 3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i * 3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i * 3] = color.r;
            colorArray[i * 3 + 1] = color.g;
            colorArray[i * 3 + 2] = color.b;

            speedArray[i] = 0.002 + Math.random() * 0.003;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // Dual Orbital Rings with glow effects
        const ringBlueGeometry = new THREE.TorusGeometry(GLOBE_RADIUS + 1.6, 0.008, 16, 100);
        const ringBlueMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x60a5fa) }
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
                varying vec2 vUv;
                
                void main() {
                    float glow = sin(vUv.x * 6.28 - time * 2.0) * 0.3 + 0.7;
                    float pulse = sin(time * 3.0) * 0.15 + 0.85;
                    gl_FragColor = vec4(color * glow, pulse * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const ringBlue = new THREE.Mesh(ringBlueGeometry, ringBlueMaterial);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 6;
        globeGroup.add(ringBlue);

        const ringRedGeometry = new THREE.TorusGeometry(GLOBE_RADIUS + 1.8, 0.008, 16, 100);
        const ringRedMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xef4444) }
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
                varying vec2 vUv;
                
                void main() {
                    float glow = sin(vUv.x * 6.28 + time * 2.0) * 0.3 + 0.7;
                    float pulse = sin(time * 3.0 + 1.57) * 0.15 + 0.85;
                    gl_FragColor = vec4(color * glow, pulse * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const ringRed = new THREE.Mesh(ringRedGeometry, ringRedMaterial);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 6;
        globeGroup.add(ringRed);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const pointLight1 = new THREE.PointLight(0x60a5fa, 3, 50);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xef4444, 2, 50);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        // Mouse interaction
        const mouse = new THREE.Vector2();
        const targetRotation = new THREE.Euler(0, 0, 0);
        const currentRotation = new THREE.Euler(0, 0, 0);

        const onMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            targetRotation.x = mouse.y * 0.3;
            targetRotation.y = mouse.x * 0.3;
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

            globeMaterial.uniforms.time.value = time;

            const isHovering = containerRef.current?.matches(':hover');
            const autoRotateSpeed = isHovering ? 0.1 : 0.05;

            currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
            currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;

            globeGroup.rotation.x = currentRotation.x;
            globeGroup.rotation.y += autoRotateSpeed * delta;

            const positions = particlesGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const z = positions[i3 + 2];
                const speed = speedArray[i] * (isHovering ? 1.5 : 1);

                positions[i3] = x * Math.cos(speed) - z * Math.sin(speed);
                positions[i3 + 2] = x * Math.sin(speed) + z * Math.cos(speed);
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            // Update uniforms
            ringBlueMaterial.uniforms.time.value = time;
            ringRedMaterial.uniforms.time.value = time;

            // Counter-rotating rings
            ringBlue.rotation.z += 0.003;
            ringRed.rotation.z -= 0.0025;

            renderer.render(scene, camera);
        };

        animate();

        // Resize
        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Theme
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');

            if (isDark) {
                // Dark mode - white/light globe
                globeMaterial.color.set(0xf8fafc);
                wireframeMaterial.color.set(0x60a5fa);
                wireframeMaterial.opacity = 0.25;

                // Grid lines - brighter in dark mode
                gridMaterials.forEach((mat, index) => {
                    mat.opacity = 0.55;
                    mat.needsUpdate = true;
                });

                // Lights
                ambientLight.intensity = 0.8;
                pointLight1.intensity = 3;
                pointLight2.intensity = 2;
            } else {
                // Light mode - dark globe
                globeMaterial.color.set(0x1e293b);
                wireframeMaterial.color.set(0x1d4ed8);
                wireframeMaterial.opacity = 0.3;

                // Grid lines - more opaque and darker in light mode
                gridMaterials.forEach((mat, index) => {
                    const isBlue = index % 2 === 0;
                    mat.color = isBlue ? new THREE.Color(0x1d4ed8) : new THREE.Color(0xb91c1c);
                    mat.opacity = 0.7;
                    mat.needsUpdate = true;
                });

                // Lights - softer in light mode
                ambientLight.intensity = 1.0;
                pointLight1.intensity = 2;
                pointLight2.intensity = 1.5;
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
