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

        const GLOBE_RADIUS = 2.6;

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
                    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
                    vec3 glow = mix(colorBlue, colorRed, sin(time * 0.3) * 0.5 + 0.5);
                    gl_FragColor = vec4(glow, intensity * 0.5);
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
                baseColor: { value: new THREE.Color(0x0a0e27) },
                glowColorBlue: { value: new THREE.Color(0x60a5fa) },
                glowColorRed: { value: new THREE.Color(0xef4444) }
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
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    float fresnel = pow(1.0 - dot(normalize(cameraPosition - vec3(0.0)), vNormal), 3.0);
                    vec3 glowColor = mix(glowColorBlue, glowColorRed, sin(time * 0.5 + vUv.x * 3.14) * 0.5 + 0.5);
                    vec3 finalColor = mix(baseColor, glowColor, fresnel * 0.5);
                    gl_FragColor = vec4(finalColor, 0.98);
                }
            `,
            transparent: true
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globeGroup.add(globe);

        // Grid lines
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
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            });
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
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            });
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
            size: 0.06,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // Ring
        const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(GLOBE_RADIUS + 1.8, 0.005, 16, 100),
            new THREE.MeshBasicMaterial({
                color: 0x60a5fa,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            })
        );
        ring1.rotation.x = Math.PI / 2;
        globeGroup.add(ring1);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x60a5fa, 2, 50);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

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
                const baseColor = new THREE.Color(0x0a0e27);
                const glowColorBlue = new THREE.Color(0x60a5fa);
                const glowColorRed = new THREE.Color(0xef4444);

                globeMaterial.uniforms.baseColor.value = baseColor;
                globeMaterial.uniforms.glowColorBlue.value = glowColorBlue;
                globeMaterial.uniforms.glowColorRed.value = glowColorRed;
                atmosphereMaterial.uniforms.colorBlue.value = glowColorBlue;
                atmosphereMaterial.uniforms.colorRed.value = glowColorRed;
            } else {
                const baseColor = new THREE.Color(0xe8eef5);
                const glowColorBlue = new THREE.Color(0x3b82f6);
                const glowColorRed = new THREE.Color(0xdc2626);

                globeMaterial.uniforms.baseColor.value = baseColor;
                globeMaterial.uniforms.glowColorBlue.value = glowColorBlue;
                globeMaterial.uniforms.glowColorRed.value = glowColorRed;
                atmosphereMaterial.uniforms.colorBlue.value = glowColorBlue;
                atmosphereMaterial.uniforms.colorRed.value = glowColorRed;
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
