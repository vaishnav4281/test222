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
        containerRef.current.appendChild(renderer.domElement);

        // Globe Group
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // ===== MAIN GLOBE SPHERE =====
        const globeRadius = 3.5;
        const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);

        // Glass-like Globe Material
        const globeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.15,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.9,
            thickness: 0.5,
            envMapIntensity: 1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globeGroup.add(globe);

        // ===== LATITUDE & LONGITUDE LINES (Like a Real Globe) =====
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });

        // Latitude lines (horizontal circles)
        for (let lat = -80; lat <= 80; lat += 20) {
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
            const line = new THREE.Line(geometry, lineMaterial);
            globeGroup.add(line);
        }

        // Longitude lines (vertical semi-circles)
        for (let lon = 0; lon < 180; lon += 20) {
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
            const line = new THREE.Line(geometry, lineMaterial);
            globeGroup.add(line);
        }

        // ===== GLOWING INNER CORE =====
        const coreGeometry = new THREE.SphereGeometry(globeRadius * 0.95, 32, 32);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x3b82f6) },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    vec3 glow = glowColor * intensity;
                    float pulse = 0.5 + 0.5 * sin(time);
                    gl_FragColor = vec4(glow, intensity * 0.4 * pulse);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // ===== RED & BLUE PARTICLES (User likes these) =====
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 120;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        const speedArray = new Float32Array(particleCount);

        const colorBlue = new THREE.Color(0x60a5fa);
        const colorRed = new THREE.Color(0xf87171);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = globeRadius + 0.8 + Math.random() * 1.2;

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
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // ===== ORBITAL RINGS =====
        const ringGeo = new THREE.TorusGeometry(globeRadius + 2.2, 0.008, 16, 100);

        const ringMatBlue = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 8;
        globeGroup.add(ringBlue);

        const ringMatRed = new THREE.MeshBasicMaterial({
            color: 0xf87171,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const ringRed = new THREE.Mesh(ringGeo, ringMatRed);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 8;
        globeGroup.add(ringRed);

        // ===== LIGHTING =====
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

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

        // ===== ANIMATION LOOP =====
        let time = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            time += 0.01;

            coreMaterial.uniforms.time.value = time;

            const isHovering = containerRef.current?.matches(':hover');
            const rotationSpeed = isHovering ? 0.005 : 0.002;

            // Smooth rotation
            globeGroup.rotation.y += rotationSpeed;
            targetRotation.x = mouse.y * 0.3;
            targetRotation.y = mouse.x * 0.3;

            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.05;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.05;

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

            // Animate rings
            ringBlue.rotation.z += 0.002;
            ringRed.rotation.z -= 0.002;

            renderer.render(scene, camera);
        };

        animate();

        // ===== RESIZE HANDLER =====
        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // ===== THEME HANDLER =====
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');

            if (isDark) {
                // Dark Mode: White lines, glowing blue
                lineMaterial.color.setHex(0xffffff);
                lineMaterial.opacity = 0.4;
                globeMaterial.color.setHex(0x3b82f6);
                globeMaterial.opacity = 0.2;
                coreMaterial.uniforms.glowColor.value.setHex(0x60a5fa);
            } else {
                // Light Mode: Dark lines, subtle blue
                lineMaterial.color.setHex(0x1f2937);
                lineMaterial.opacity = 0.5;
                globeMaterial.color.setHex(0x3b82f6);
                globeMaterial.opacity = 0.15;
                coreMaterial.uniforms.glowColor.value.setHex(0x3b82f6);
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

            globeGeometry.dispose();
            globeMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: '500px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        />
    );
}
