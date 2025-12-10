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
        camera.position.z = 16;

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

        // 1. Main Wireframe Sphere
        const geometry = new THREE.IcosahedronGeometry(5.5, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x333333, // Dark base
            wireframe: true,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // 2. Inner Core - Dark with Red/Blue hint
        const coreGeometry = new THREE.SphereGeometry(5, 32, 32);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x3b82f6) }, // Blue default
                viewVector: { value: camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.55 - dot(vNormal, vNormel), 4.5);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 0.6);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Dual-Color Particles (Red & Blue)
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 120;
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);

        const colorBlue = new THREE.Color(0x3b82f6);
        const colorRed = new THREE.Color(0xef4444);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = 5.8 + Math.random() * 0.4;

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            // Mix of Red and Blue particles
            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true, // Enable vertex colors
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Orbital Rings - One Blue, One Red
        const ringGeo = new THREE.TorusGeometry(7.5, 0.015, 16, 100);

        // Blue Ring
        const ringMatBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 8;
        globeGroup.add(ringBlue);

        // Red Ring
        const ringMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
        const ringRed = new THREE.Mesh(ringGeo, ringMatRed);
        ringRed.rotation.x = Math.PI / 2;
        ringRed.rotation.y = -Math.PI / 8;
        globeGroup.add(ringRed);

        // Mouse Interaction
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

            // Interaction Logic
            const isHovering = containerRef.current?.matches(':hover');

            // Rotation speed increases on hover
            const rotationSpeed = isHovering ? 0.003 : 0.001;

            targetRotation.x = (mouse.y * 0.0002);
            targetRotation.y = (mouse.x * 0.0002);

            globeGroup.rotation.y += rotationSpeed;
            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.05;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.05;

            // Particles float
            particlesMesh.rotation.y -= 0.0005;

            // Rings breathe
            const scale = 1 + Math.sin(time) * 0.02;
            ringBlue.scale.setScalar(scale);
            ringRed.scale.setScalar(scale);

            // Dynamic color shift for core based on time
            const r = (Math.sin(time * 0.5) + 1) * 0.5; // 0 to 1
            const coreColor = new THREE.Color().lerpColors(colorBlue, colorRed, r);
            coreMaterial.uniforms.glowColor.value.copy(coreColor);

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Theme handling
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                material.color.setHex(0x404040);
                material.opacity = 0.1;
            } else {
                material.color.setHex(0xcccccc);
                material.opacity = 0.3;
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
