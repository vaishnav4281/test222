import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            50,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        containerRef.current.appendChild(renderer.domElement);

        // Globe Group
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const globeRadius = 2.4;

        // ===== CLEAN WIREFRAME GLOBE =====
        const segments = 64;
        const globeGeometry = new THREE.SphereGeometry(globeRadius, segments, segments);

        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.15 // Very subtle
        });
        const wireframeGlobe = new THREE.Mesh(globeGeometry, wireframeMaterial);
        globeGroup.add(wireframeGlobe);

        // ===== CLEAN GRID LINES (GEOGRAPHIC) =====
        const linesMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2
        });

        // Latitude lines
        for (let lat = -60; lat <= 60; lat += 30) {
            const radius = Math.cos((lat * Math.PI) / 180) * globeRadius;
            const y = Math.sin((lat * Math.PI) / 180) * globeRadius;

            const points = [];
            for (let i = 0; i <= 64; i++) {
                const theta = (i / 64) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(theta) * radius,
                    y,
                    Math.sin(theta) * radius
                ));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, linesMaterial);
            globeGroup.add(line);
        }

        // Longitude lines
        for (let lon = 0; lon < 180; lon += 30) {
            const points = [];
            for (let i = 0; i <= 64; i++) {
                const phi = (i / 64) * Math.PI;
                const theta = (lon * Math.PI) / 180;

                points.push(new THREE.Vector3(
                    globeRadius * Math.sin(phi) * Math.cos(theta),
                    globeRadius * Math.cos(phi),
                    globeRadius * Math.sin(phi) * Math.sin(theta)
                ));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, linesMaterial);
            globeGroup.add(line);
        }

        // ===== SECURITY SCAN WAVE (Radar Effect) =====
        const scanGeometry = new THREE.RingGeometry(globeRadius * 0.05, globeRadius * 1.05, 64);
        const scanMaterial = new THREE.ShaderMaterial({
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
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    // Scanning wave
                    float wave = fract(time * 0.3);
                    float scanLine = smoothstep(wave - 0.05, wave, dist) - smoothstep(wave, wave + 0.05, dist);
                    
                    gl_FragColor = vec4(color, scanLine * 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const scanWave = new THREE.Mesh(scanGeometry, scanMaterial);
        scanWave.rotation.x = Math.PI / 2;
        globeGroup.add(scanWave);

        // ===== DOMAIN/SERVER NODES (Data Points on Surface) =====
        const nodeCount = 24;
        const nodeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const nodeMaterialBlue = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.9
        });
        const nodeMaterialRed = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.9
        });

        const nodes: THREE.Mesh[] = [];
        for (let i = 0; i < nodeCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / nodeCount);
            const theta = Math.sqrt(nodeCount * Math.PI) * phi;

            const x = globeRadius * Math.sin(phi) * Math.cos(theta);
            const y = globeRadius * Math.sin(phi) * Math.sin(theta);
            const z = globeRadius * Math.cos(phi);

            const material = Math.random() > 0.7 ? nodeMaterialRed : nodeMaterialBlue;
            const node = new THREE.Mesh(nodeGeometry, material);
            node.position.set(x, y, z);

            // Glowing ring around each node
            const ringGeo = new THREE.RingGeometry(0.05, 0.06, 16);
            const ringMat = new THREE.MeshBasicMaterial({
                color: material.color,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(node.position);
            ring.lookAt(0, 0, 0);

            globeGroup.add(node);
            globeGroup.add(ring);
            nodes.push(node);
        }

        // ===== DATA CONNECTIONS (Between Nodes) =====
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.2
        });

        // Create a few connections between random nodes
        for (let i = 0; i < 8; i++) {
            const node1 = nodes[Math.floor(Math.random() * nodes.length)];
            const node2 = nodes[Math.floor(Math.random() * nodes.length)];

            if (node1 !== node2) {
                const points = [];
                points.push(node1.position.clone());
                points.push(node2.position.clone());

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, connectionMaterial);
                globeGroup.add(line);
            }
        }

        // ===== SCANNING PARTICLES (Threat Detection) =====
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 60; // Reduced for cleaner look
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const speedArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa);
        const colorRed = new THREE.Color(0xef4444);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = globeRadius + 0.3 + Math.random() * 0.6;

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.8 ? colorRed : colorBlue; // More blue (safe), less red (threats)
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

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

        // ===== SECURITY SHIELD RING =====
        const shieldRingGeo = new THREE.TorusGeometry(globeRadius + 1.3, 0.006, 16, 100);
        const shieldRingMat = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const shieldRing = new THREE.Mesh(shieldRingGeo, shieldRingMat);
        shieldRing.rotation.x = Math.PI / 2;
        globeGroup.add(shieldRing);

        // ===== MOUSE INTERACTION =====
        const mouse = new THREE.Vector2();
        const targetRotation = new THREE.Vector2();

        const onDocumentMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        if (window.matchMedia("(pointer: fine)").matches) {
            document.addEventListener('mousemove', onDocumentMouseMove);
        }

        // ===== ANIMATION =====
        let time = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            time += 0.01;

            scanMaterial.uniforms.time.value = time;

            // Rotate scan wave
            scanWave.rotation.z += 0.01;

            const isHovering = containerRef.current?.matches(':hover');
            const rotationSpeed = isHovering ? 0.004 : 0.002;

            globeGroup.rotation.y += rotationSpeed;

            targetRotation.x = mouse.y * 0.1;
            targetRotation.y = mouse.x * 0.1;

            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.03;

            // Pulse nodes
            nodes.forEach((node, index) => {
                const pulse = Math.sin(time * 2 + index) * 0.3 + 1.0;
                node.scale.setScalar(pulse);
            });

            // Particle animation
            const positions = particlesGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const z = positions[i3 + 2];
                const speed = speedArray[i] * (isHovering ? 1.3 : 1);

                positions[i3] = x * Math.cos(speed) - z * Math.sin(speed);
                positions[i3 + 2] = x * Math.sin(speed) + z * Math.cos(speed);
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            // Shield ring rotation
            shieldRing.rotation.z += 0.001;

            renderer.render(scene, camera);
        };

        animate();

        // ===== RESIZE =====
        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // ===== THEME =====
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');

            if (isDark) {
                wireframeMaterial.color.setHex(0xffffff);
                wireframeMaterial.opacity = 0.15;
                linesMaterial.color.setHex(0xffffff);
                linesMaterial.opacity = 0.2;
                scanMaterial.uniforms.color.value.setHex(0x60a5fa);
            } else {
                wireframeMaterial.color.setHex(0x1f2937);
                wireframeMaterial.opacity = 0.2;
                linesMaterial.color.setHex(0x374151);
                linesMaterial.opacity = 0.25;
                scanMaterial.uniforms.color.value.setHex(0x3b82f6);
            }
        };

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        updateTheme();

        // ===== CLEANUP =====
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousemove', onDocumentMouseMove);
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
