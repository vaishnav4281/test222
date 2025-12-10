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

        // Atmospheric glow
        const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorBlue: { value: new THREE.Color(0x60a5fa) },
                colorRed: { value: new THREE.Color(0xef4444) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 colorBlue;
                uniform vec3 colorRed;
                varying vec3 vNormal;
                
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 glow = mix(colorBlue, colorRed, sin(time * 0.3) * 0.5 + 0.5);
                    float pulse = sin(time * 0.5) * 0.2 + 0.8;
                    gl_FragColor = vec4(glow * pulse, intensity * 0.7);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        globeGroup.add(atmosphere);

        // Main globe
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128);
        const globeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x0f172a) },
                glowColorBlue: { value: new THREE.Color(0x3b82f6) },
                glowColorRed: { value: new THREE.Color(0xef4444) },
                isDark: { value: 1.0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform vec3 glowColorBlue;
                uniform vec3 glowColorRed;
                uniform float isDark;
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    float fresnel = pow(1.0 - dot(normalize(cameraPosition - vec3(0.0)), vNormal), 2.5);
                    vec3 glowColor = mix(glowColorBlue, glowColorRed, sin(time * 0.5 + vUv.x * 3.14) * 0.5 + 0.5);
                    
                    // Adaptive glow based on theme
                    float glowStrength = isDark > 0.5 ? 0.6 : 0.8;
                    vec3 finalColor = mix(baseColor, glowColor, fresnel * glowStrength);
                    finalColor += glowColor * fresnel * (isDark > 0.5 ? 0.3 : 0.5);
                    
                    // Better opacity for light mode
                    float alpha = isDark > 0.5 ? 0.98 : 0.95;
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globeGroup.add(globe);

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

        // Ring
        const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(GLOBE_RADIUS + 1.6, 0.006, 16, 100),
            new THREE.MeshBasicMaterial({
                color: 0x60a5fa,
                transparent: true,
                opacity: 0.75,
                blending: THREE.AdditiveBlending
            })
        );
        ring1.rotation.x = Math.PI / 2;
        globeGroup.add(ring1);

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

            atmosphereMaterial.uniforms.time.value = time;
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

            ring1.rotation.z += 0.002;

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
                // Dark mode - vibrant colors on dark background
                const baseColor = new THREE.Color(0x0f172a);
                const glowColorBlue = new THREE.Color(0x3b82f6);
                const glowColorRed = new THREE.Color(0xef4444);
                const atmosphereBlue = new THREE.Color(0x60a5fa);
                const atmosphereRed = new THREE.Color(0xf87171);

                globeMaterial.uniforms.baseColor.value = baseColor;
                globeMaterial.uniforms.glowColorBlue.value = glowColorBlue;
                globeMaterial.uniforms.glowColorRed.value = glowColorRed;
                globeMaterial.uniforms.isDark.value = 1.0;

                atmosphereMaterial.uniforms.colorBlue.value = atmosphereBlue;
                atmosphereMaterial.uniforms.colorRed.value = atmosphereRed;

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
                // Light mode - deeper colors on light background for contrast
                const baseColor = new THREE.Color(0xdbeafe);
                const glowColorBlue = new THREE.Color(0x1d4ed8);
                const glowColorRed = new THREE.Color(0xb91c1c);
                const atmosphereBlue = new THREE.Color(0x3b82f6);
                const atmosphereRed = new THREE.Color(0xdc2626);

                globeMaterial.uniforms.baseColor.value = baseColor;
                globeMaterial.uniforms.glowColorBlue.value = glowColorBlue;
                globeMaterial.uniforms.glowColorRed.value = glowColorRed;
                globeMaterial.uniforms.isDark.value = 0.0;

                atmosphereMaterial.uniforms.colorBlue.value = atmosphereBlue;
                atmosphereMaterial.uniforms.colorRed.value = atmosphereRed;

                // Grid lines - more opaque and darker in light mode
                gridMaterials.forEach((mat, index) => {
                    const isBlue = index % 2 === 0;
                    mat.color = isBlue ? glowColorBlue : glowColorRed;
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
