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

        // ===== ATMOSPHERIC GLOW LAYERS =====
        const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorBlue: { value: new THREE.Color(0x60a5fa) },
                colorRed: { value: new THREE.Color(0xef4444) }
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
                uniform float time;
                uniform vec3 colorBlue;
                uniform vec3 colorRed;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
                    vec3 glow = mix(colorBlue, colorRed, sin(time * 0.3) * 0.5 + 0.5);
                    float pulse = sin(time * 0.5) * 0.15 + 0.85;
                    gl_FragColor = vec4(glow * pulse, intensity * 0.4);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        globeGroup.add(atmosphere);

        // ===== MAIN GLOBE WITH SOPHISTICATED SHADER =====
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128);
        const globeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x0a0e27) },
                glowColorBlue: { value: new THREE.Color(0x60a5fa) },
                glowColorRed: { value: new THREE.Color(0xef4444) },
                mousePos: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform vec3 glowColorBlue;
                uniform vec3 glowColorRed;
                uniform vec2 mousePos;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    // Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
                    
                    // Hexagonal grid pattern
                    float scale = 15.0;
                    vec2 st = vUv * scale;
                    vec2 hex = vec2(st.x - 0.5 * mod(floor(st.y), 2.0), st.y);
                    vec2 fhex = fract(hex);
                    float d = min(min(
                        distance(fhex, vec2(0.0, 0.5)),
                        distance(fhex, vec2(1.0, 0.5))),
                        min(
                            distance(fhex, vec2(0.5, 0.0)),
                            distance(fhex, vec2(0.5, 1.0))
                        )
                    );
                    float hexGrid = smoothstep(0.05, 0.06, d);
                    
                    // Animated scan lines (alternating red/blue)
                    float scanLine = step(0.95, fract((vUv.y * 20.0) - time * 0.5));
                    vec3 scanColor = mix(glowColorBlue, glowColorRed, step(0.5, fract(vUv.y * 10.0)));
                    
                    // Mix colors
                    vec3 glowColor = mix(glowColorBlue, glowColorRed, sin(time * 0.5 + vUv.x * 3.14) * 0.5 + 0.5);
                    
                    // Combine effects
                    vec3 finalColor = mix(baseColor, glowColor, fresnel * 0.4);
                    finalColor = mix(finalColor, glowColor, (1.0 - hexGrid) * 0.25);
                    finalColor += scanColor * scanLine * 0.3;
                    
                    // Edge glow
                    float edgeGlow = fresnel * 0.6;
                    
                    gl_FragColor = vec4(finalColor + glowColor * edgeGlow, 0.98);
                }
            `,
            transparent: true
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globeGroup.add(globe);

        // ===== ELEGANT LATITUDE/LONGITUDE LINES =====
        const createGridLine = (points: THREE.Vector3[], color: THREE.Color, opacity: number) => {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity,
                blending: THREE.AdditiveBlending
            });
            return new THREE.Line(geometry, material);
        };

        const gridColorBlue = new THREE.Color(0x60a5fa);
        const gridColorRed = new THREE.Color(0xef4444);

        // Latitude lines (alternating blue/red)
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
            const color = index % 2 === 0 ? gridColorBlue : gridColorRed;
            globeGroup.add(createGridLine(points, color, 0.3));
        });

        // Longitude lines (alternating blue/red)
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
            const color = (lon / 20) % 2 === 0 ? gridColorBlue : gridColorRed;
            globeGroup.add(createGridLine(points, color, 0.3));
        });

    // ===== DATA NODES WITH ARCS =====
    const nodes: { mesh: THREE.Mesh; ring: THREE.Mesh; position: THREE.Vector3; type: 'secure' | 'threat' }[] = [];
    const nodePositions: THREE.Vector3[] = [];

    for (let i = 0; i < 32; i++) {
        const phi = Math.acos(-1 + (2 * i) / 32);
        const theta = Math.sqrt(32 * Math.PI) * phi;

        const position = new THREE.Vector3(
            GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
            GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta),
            GLOBE_RADIUS * Math.cos(phi)
        );

        const type = Math.random() > 0.85 ? 'threat' : 'secure';
        const color = type === 'threat' ? new THREE.Color(0xff4444) : new THREE.Color(0x44aaff);

        // Node
        const nodeGeo = new THREE.SphereGeometry(0.035, 16, 16);
        const nodeMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.9
        });
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.copy(position);
        globeGroup.add(node);

        // Pulsing ring
        const ringGeo = new THREE.RingGeometry(0.05, 0.055, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        ring.lookAt(0, 0, 0);
        globeGroup.add(ring);

        nodes.push({ mesh: node, ring, position: position.clone(), type });
        nodePositions.push(position);
    }

    // ===== CURVED CONNECTION ARCS =====
    const createArc = (start: THREE.Vector3, end: THREE.Vector3, color: THREE.Color) => {
        const distance = start.distanceTo(end);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(GLOBE_RADIUS + distance * 0.3);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        return new THREE.Line(geometry, material);
    };

    // Create connections
    for (let i = 0; i < 12; i++) {
        const idx1 = Math.floor(Math.random() * nodePositions.length);
        const idx2 = Math.floor(Math.random() * nodePositions.length);
        if (idx1 !== idx2) {
            const arc = createArc(nodePositions[idx1], nodePositions[idx2], new THREE.Color(0x4080ff));
            globeGroup.add(arc);
        }
    }

    // ===== TRAVELING PARTICLES =====
    const particlesCount = 100;
    const particlesGeo = new THREE.BufferGeometry();
    const particlesPos = new Float32Array(particlesCount * 3);
    const particlesColor = new Float32Array(particlesCount * 3);
    const particlesSpeed = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount; i++) {
        const phi = Math.acos(-1 + (2 * Math.random()));
        const theta = Math.random() * Math.PI * 2;
        const r = GLOBE_RADIUS + 0.2 + Math.random() * 1.2;

        particlesPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        particlesPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        particlesPos[i * 3 + 2] = r * Math.cos(phi);

        const color = Math.random() > 0.9 ? new THREE.Color(0xff4444) : new THREE.Color(0x44aaff);
        particlesColor[i * 3] = color.r;
        particlesColor[i * 3 + 1] = color.g;
        particlesColor[i * 3 + 2] = color.b;

        particlesSpeed[i] = 0.001 + Math.random() * 0.002;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlesPos, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(particlesColor, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    globeGroup.add(particles);

    // ===== ELEGANT RING SYSTEM =====
    const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(GLOBE_RADIUS + 1.8, 0.004, 16, 100),
        new THREE.MeshBasicMaterial({
            color: 0x4080ff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        })
    );
    ring1.rotation.x = Math.PI / 2;
    globeGroup.add(ring1);

    // ===== LIGHTING =====
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x4080ff, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // ===== SMOOTH MOUSE INTERACTION =====
    const mouse = new THREE.Vector2();
    const targetRotation = new THREE.Euler(0, 0, 0);
    const currentRotation = new THREE.Euler(0, 0, 0);

    const onMouseMove = (event: MouseEvent) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        targetRotation.x = mouse.y * 0.3;
        targetRotation.y = mouse.x * 0.3;

        globeMaterial.uniforms.mousePos.value.set(mouse.x, mouse.y);
    };

    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener('mousemove', onMouseMove);
    }

    // ===== ANIMATION LOOP =====
    let time = 0;
    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        time += delta;

        // Update uniforms
        atmosphereMaterial.uniforms.time.value = time;
        globeMaterial.uniforms.time.value = time;

        // Smooth rotation
        const isHovering = containerRef.current?.matches(':hover');
        const autoRotateSpeed = isHovering ? 0.1 : 0.05;

        currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;

        globeGroup.rotation.x = currentRotation.x;
        globeGroup.rotation.y += autoRotateSpeed * delta;

        // Pulse nodes
        nodes.forEach((node, i) => {
            const pulse = Math.sin(time * 3 + i * 0.5) * 0.15 + 1;
            node.mesh.scale.setScalar(pulse);
            node.ring.scale.setScalar(pulse);

            if (node.type === 'threat') {
                const threatPulse = Math.sin(time * 5 + i) * 0.3 + 0.7;
                (node.mesh.material as THREE.MeshBasicMaterial).opacity = threatPulse;
            }
        });

        // Animate particles with flow field
        const positions = particlesGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];

            const speed = particlesSpeed[i] * (isHovering ? 1.5 : 1);
            const angle = Math.atan2(z, x);

            positions[i3] = x * Math.cos(speed) - z * Math.sin(speed);
            positions[i3 + 2] = x * Math.sin(speed) + z * Math.cos(speed);
            positions[i3 + 1] = y + Math.sin(time + i) * 0.002;
        }
        particlesGeo.attributes.position.needsUpdate = true;

        // Elegant ring rotation
        ring1.rotation.z += 0.002;

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
            // Dark mode - high contrast
            const baseColor = new THREE.Color(0x0a0e27);
            const glowColorBlue = new THREE.Color(0x60a5fa);
            const glowColorRed = new THREE.Color(0xef4444);

            globeMaterial.uniforms.baseColor.value = baseColor;
            globeMaterial.uniforms.glowColorBlue.value = glowColorBlue;
            globeMaterial.uniforms.glowColorRed.value = glowColorRed;
            atmosphereMaterial.uniforms.colorBlue.value = glowColorBlue;
            atmosphereMaterial.uniforms.colorRed.value = glowColorRed;
        } else {
            // Light mode - visible on white
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

    // ===== CLEANUP =====
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
