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
        camera.position.z = 8;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0); // Fully transparent
        containerRef.current.appendChild(renderer.domElement);

        // Globe Group
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const globeRadius = 2.5;

        // ===== MAIN GLOBE - Wireframe Style (Modern & Clean) =====
        const segments = 40;
        const globeGeometry = new THREE.SphereGeometry(globeRadius, segments, segments);

        // Wireframe globe
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const wireframeGlobe = new THREE.Mesh(globeGeometry, wireframeMaterial);
        globeGroup.add(wireframeGlobe);

        // ===== GLOWING DOTS AT VERTICES =====
        const dotGeometry = new THREE.BufferGeometry();
        const positions = globeGeometry.attributes.position.array;
        const dotPositions = [];

        // Sample every few vertices for dots
        for (let i = 0; i < positions.length; i += 9) {
            dotPositions.push(positions[i], positions[i + 1], positions[i + 2]);
        }

        dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));

        const dotMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.04,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const dots = new THREE.Points(dotGeometry, dotMaterial);
        globeGroup.add(dots);

        // ===== INNER GLOW =====
        const glowGeometry = new THREE.SphereGeometry(globeRadius * 0.98, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color(0x3b82f6) },
                color2: { value: new THREE.Color(0xef4444) },
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
                    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
                    vec3 glow = mix(color1, color2, sin(time) * 0.5 + 0.5);
                    gl_FragColor = vec4(glow * intensity, intensity * 0.3);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        globeGroup.add(glow);

        // ===== ORBITAL PARTICLES (Red & Blue) =====
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const speedArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa);
        const colorRed = new THREE.Color(0xf87171);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = globeRadius + 0.6 + Math.random() * 1.0;

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

            speedArray[i] = 0.003 + Math.random() * 0.004;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // ===== RINGS =====
        const ringGeo = new THREE.TorusGeometry(globeRadius + 1.5, 0.006, 16, 100);

        const ringMatBlue = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 8;
        globeGroup.add(ringBlue);

        const ringMatRed = new THREE.MeshBasicMaterial({
            color: 0xf87171,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        const ringRed = new THREE.Mesh(ringGeo, ringMatRed);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 8;
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
            time += 0.015;

            glowMaterial.uniforms.time.value = time;

            const isHovering = containerRef.current?.matches(':hover');
            const rotationSpeed = isHovering ? 0.006 : 0.003;

            // Continuous rotation
            globeGroup.rotation.y += rotationSpeed;

            // Mouse influence
            targetRotation.x = mouse.y * 0.2;
            targetRotation.y = mouse.x * 0.2;

            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.05;

            // Animate particles
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

            // Rings rotation
            ringBlue.rotation.z += 0.002;
            ringRed.rotation.z -= 0.002;

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
                wireframeMaterial.opacity = 0.25;
                dotMaterial.color.setHex(0xffffff);
                dotMaterial.opacity = 0.8;
            } else {
                wireframeMaterial.color.setHex(0x1f2937);
                wireframeMaterial.opacity = 0.3;
                dotMaterial.color.setHex(0x1f2937);
                dotMaterial.opacity = 0.7;
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
