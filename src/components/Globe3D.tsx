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

        const globeRadius = 2.4; // Decreased further

        // ===== MAIN WIREFRAME SPHERE =====
        const segments = 64;
        const globeGeometry = new THREE.SphereGeometry(globeRadius, segments, segments);

        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const wireframeGlobe = new THREE.Mesh(globeGeometry, wireframeMaterial);
        globeGroup.add(wireframeGlobe);

        // ===== LATITUDE/LONGITUDE GRID LINES =====
        const linesMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.25
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

        // ===== GLOWING VERTICES =====
        const positions = globeGeometry.attributes.position.array;
        const dotPositions = [];

        for (let i = 0; i < positions.length; i += 18) {
            dotPositions.push(positions[i], positions[i + 1], positions[i + 2]);
        }

        const dotGeometry = new THREE.BufferGeometry();
        dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));

        const dotMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.06,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const dots = new THREE.Points(dotGeometry, dotMaterial);
        globeGroup.add(dots);

        // ===== LENS FLARE EFFECT =====
        // Create a spotlight effect
        const lensFlareGeometry = new THREE.CircleGeometry(globeRadius * 1.2, 32);
        const lensFlareMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x60a5fa) },
                color2: { value: new THREE.Color(0xf87171) }
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
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    // Lens flare rings
                    float ring1 = smoothstep(0.3, 0.32, dist) - smoothstep(0.32, 0.34, dist);
                    float ring2 = smoothstep(0.4, 0.42, dist) - smoothstep(0.42, 0.44, dist);
                    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    // Animated color
                    vec3 color = mix(color1, color2, sin(time) * 0.5 + 0.5);
                    
                    float alpha = (ring1 + ring2) * 0.3 + glow * 0.15;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const lensFlare = new THREE.Mesh(lensFlareGeometry, lensFlareMaterial);
        lensFlare.position.z = 0.5; // Slightly in front
        globeGroup.add(lensFlare);

        // ===== INNER GLOW (Blue to Red) =====
        const glowGeometry = new THREE.SphereGeometry(globeRadius * 0.96, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color(0x3b82f6) }, // Blue
                color2: { value: new THREE.Color(0xef4444) }, // Red
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float time;
                varying vec3 vNormal;
                
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    vec3 glow = mix(color1, color2, sin(time * 0.5) * 0.5 + 0.5);
                    gl_FragColor = vec4(glow * intensity, intensity * 0.35);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        globeGroup.add(glow);

        // ===== DATA PARTICLES (Red & Blue) =====
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 80;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const speedArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa);
        const colorRed = new THREE.Color(0xf87171);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = globeRadius + 0.5 + Math.random() * 0.9;

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

            speedArray[i] = 0.002 + Math.random() * 0.003;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // ===== ORBITAL RINGS (Red & Blue) =====
        const ringGeo = new THREE.TorusGeometry(globeRadius + 1.4, 0.008, 16, 100);

        const ringMatBlue = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 9;
        globeGroup.add(ringBlue);

        const ringMatRed = new THREE.MeshBasicMaterial({
            color: 0xf87171,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        const ringRed = new THREE.Mesh(ringGeo, ringMatRed);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 9;
        globeGroup.add(ringRed);

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

            glowMaterial.uniforms.time.value = time;
            lensFlareMaterial.uniforms.time.value = time;

            // Rotate lens flare slowly
            lensFlare.rotation.z += 0.001;

            const isHovering = containerRef.current?.matches(':hover');
            const rotationSpeed = isHovering ? 0.005 : 0.002;

            globeGroup.rotation.y += rotationSpeed;

            targetRotation.x = mouse.y * 0.15;
            targetRotation.y = mouse.x * 0.15;

            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.03;

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

            ringBlue.rotation.z += 0.0015;
            ringRed.rotation.z -= 0.0015;

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
                wireframeMaterial.opacity = 0.3;
                linesMaterial.color.setHex(0xffffff);
                linesMaterial.opacity = 0.25;
                dotMaterial.color.setHex(0xffffff);
                dotMaterial.opacity = 0.9;
            } else {
                wireframeMaterial.color.setHex(0x1f2937);
                wireframeMaterial.opacity = 0.35;
                linesMaterial.color.setHex(0x374151);
                linesMaterial.opacity = 0.3;
                dotMaterial.color.setHex(0x1f2937);
                dotMaterial.opacity = 0.85;
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
