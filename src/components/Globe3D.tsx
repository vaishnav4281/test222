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
        camera.position.z = 14; // Slightly closer but globe will be smaller

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

        // 1. Modern Dot-Matrix Globe (Replacing Wireframe)
        // Using a high-detail sphere for dot positions
        const globeGeo = new THREE.SphereGeometry(4.0, 48, 48); // Reduced size to 4.0

        // Create a custom shader material for the dots to have a "digital" pulse
        const dotsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffffff) },
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                varying float vAlpha;
                void main() {
                    vec3 newPos = position;
                    // Subtle breathing effect
                    newPos += normal * (sin(time * 2.0 + position.y * 4.0) * 0.05);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
                    gl_PointSize = 2.5; // Fixed dot size
                    
                    // Fade out at edges for a softer look
                    vec3 viewNormal = normalize(normalMatrix * normal);
                    vAlpha = 0.6 + 0.4 * dot(viewNormal, vec3(0, 0, 1)); 
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float vAlpha;
                void main() {
                    // Circular dots
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if(length(coord) > 0.5) discard;
                    
                    gl_FragColor = vec4(color, vAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending // Good for dark mode, might need adjustment for light
        });

        // Convert geometry to points
        const dots = new THREE.Points(globeGeo, dotsMaterial);
        globeGroup.add(dots);

        // 2. Inner Core - Smaller & Sharper
        const coreGeometry = new THREE.SphereGeometry(3.6, 64, 64);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x3b82f6) },
                viewVector: { value: camera.position },
                opacity: { value: 0.5 },
                time: { value: 0 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float time;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    float pulse = 0.4 + 0.1 * sin(time * 3.0);
                    intensity = pow(pulse - dot(vNormal, vNormel), 5.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float opacity;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, opacity * intensity);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        globeGroup.add(core);

        // 3. Floating Data Particles (Red & Blue) - User Liked This
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 180;
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
            const r = 4.8 + Math.random() * 1.5; // Adjusted for smaller globe

            posArray[i3] = r * Math.cos(theta) * Math.sin(phi);
            posArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            posArray[i3 + 2] = r * Math.cos(phi);

            const color = Math.random() > 0.5 ? colorBlue : colorRed;
            colorArray[i3] = color.r;
            colorArray[i3 + 1] = color.g;
            colorArray[i3 + 2] = color.b;

            sizeArray[i] = 0.6 + Math.random() * 0.6;
            speedArray[i] = 0.002 + Math.random() * 0.004;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 4. Rings - Thinner & Cleaner
        const ringGeo = new THREE.TorusGeometry(6.5, 0.008, 16, 100); // Smaller radius

        const ringMatBlue = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        const ringBlue = new THREE.Mesh(ringGeo, ringMatBlue);
        ringBlue.rotation.x = Math.PI / 2;
        ringBlue.rotation.y = Math.PI / 10;
        globeGroup.add(ringBlue);

        const ringMatRed = new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
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
            dotsMaterial.uniforms.time.value = time;
            coreMaterial.uniforms.time.value = time;

            const isHovering = containerRef.current?.matches(':hover');
            const rotationSpeed = isHovering ? 0.004 : 0.001; // Slightly faster for dots
            targetRotation.x = (mouse.y * 0.00015);
            targetRotation.y = (mouse.x * 0.00015);

            globeGroup.rotation.y += rotationSpeed;
            globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.08;
            globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.08;

            // Particle Orbit
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

            const r = (Math.sin(time * 0.5) + 1) * 0.5;
            const coreColor = new THREE.Color().lerpColors(new THREE.Color(0x3b82f6), new THREE.Color(0xef4444), r);
            coreMaterial.uniforms.glowColor.value.copy(coreColor);

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
                // Dark Mode: White Dots
                dotsMaterial.uniforms.color.value.setHex(0xffffff);
                dotsMaterial.blending = THREE.AdditiveBlending;

                coreMaterial.uniforms.opacity.value = 0.6;
                particlesMaterial.opacity = 1.0;
                ringMatBlue.opacity = 0.5;
                ringMatRed.opacity = 0.5;
            } else {
                // Light Mode: Black Dots - No Additive Blending for visibility
                dotsMaterial.uniforms.color.value.setHex(0x000000);
                dotsMaterial.blending = THREE.NormalBlending; // Normal blending for black dots

                coreMaterial.uniforms.opacity.value = 0.7;
                particlesMaterial.opacity = 1.0;
                ringMatBlue.opacity = 0.6;
                ringMatRed.opacity = 0.6;
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
            globeGeo.dispose();
            dotsMaterial.dispose();
            coreGeometry.dispose();
            coreMaterial.dispose();
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
