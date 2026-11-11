import { useEffect, useRef, useState } from 'react';

// Adapted from the uploaded CareerConstellation.tsx. Scene lifetime, visibility,
// reduced motion, keyboard controls, and display modes are handled here.
export default function CareerConstellation({ mode = 'Synapse', paused = false, height = 310 }) {
  const mountRef = useRef(null), sceneRef = useRef(null);
  const stateRef = useRef({ paused, pointerX: 0, pointerY: 0 });
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    stateRef.current.paused = paused;
    sceneRef.current?.syncMotion();
  }, [paused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let cancelled = false, cleanup = () => {};
    setStatus('loading');
    import('three').then(THREE => {
      if (cancelled) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      } catch {
        setStatus('unavailable');
        return;
      }
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
      camera.position.set(0, 0, 26);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.domElement.setAttribute('aria-hidden', 'true');
      container.appendChild(renderer.domElement);
      const group = new THREE.Group(); scene.add(group);
      const resources = new Set();
      const addMesh = (geometry, material, parent = group) => {
        resources.add(geometry); resources.add(material);
        const mesh = new THREE.Mesh(geometry, material); parent.add(mesh); return mesh;
      };
      const core = addMesh(new THREE.SphereGeometry(2.2, 24, 24), new THREE.MeshPhongMaterial({ color: 0x0a66c2, emissive: 0x004182, specular: 0x38bdf8, shininess: 90, transparent: true, opacity: .88 }));
      const ring1 = addMesh(new THREE.TorusGeometry(3.6, .08, 12, 64), new THREE.MeshBasicMaterial({ color: 0x27dfbc }));
      const ring2 = addMesh(new THREE.TorusGeometry(4.4, .06, 12, 64), new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: .75 }));
      ring2.rotation.x = Math.PI / 3;
      addMesh(new THREE.IcosahedronGeometry(7.2, 2), new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: .07 }));
      const nodeCount = mode === 'Density' ? 64 : 38;
      const nodes = [], positions = [], colors = [0x38bdf8, 0x27dfbc, 0x0284c7, 0x60a5fa, 0x55fcd8];
      // Seeded positions keep the same reference scene stable across remounts.
      const random = index => { const n = Math.sin(index * 127.1 + 74.7) * 43758.5453; return n - Math.floor(n); };
      for (let index = 0; index < nodeCount; index++) {
        let position;
        if (mode === 'Orbit') {
          const angle = index / nodeCount * Math.PI * 6, band = index % 3;
          position = new THREE.Vector3(Math.cos(angle) * (5.5 + band), Math.sin(angle) * (5.5 + band), (band - 1) * 3);
        } else {
          const phi = Math.acos(-1 + 2 * index / nodeCount), theta = Math.sqrt(nodeCount * Math.PI) * phi;
          const radius = 7.2 + random(index) * .8 - .4;
          position = new THREE.Vector3(radius * Math.cos(theta) * Math.sin(phi), radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(phi));
        }
        positions.push(position);
        const color = colors[index % colors.length];
        const node = addMesh(new THREE.SphereGeometry(mode === 'Density' ? .22 : .3, 12, 12), new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: .5 }));
        node.position.copy(position); node.userData = { speed: 2 + random(index + 2) * 2, offset: random(index + 5) * Math.PI * 2 }; nodes.push(node);
      }
      const coordinates = [];
      if (mode !== 'Orbit') for (let from = 0; from < nodeCount; from++) for (let to = from + 1; to < nodeCount; to++) {
        if (positions[from].distanceTo(positions[to]) < (mode === 'Density' ? 4 : 4.8)) coordinates.push(...positions[from].toArray(), ...positions[to].toArray());
      }
      const lineGeometry = new THREE.BufferGeometry(); lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: .3 });
      resources.add(lineGeometry); resources.add(lineMaterial); group.add(new THREE.LineSegments(lineGeometry, lineMaterial));
      const starGeometry = new THREE.BufferGeometry(), stars = new Float32Array(120 * 3);
      for (let i = 0; i < stars.length; i++) stars[i] = (random(i + 17) - .5) * 36;
      starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
      const starMaterial = new THREE.PointsMaterial({ color: 0x93c5fd, size: .13, transparent: true, opacity: .55 });
      resources.add(starGeometry); resources.add(starMaterial);
      const starField = new THREE.Points(starGeometry, starMaterial); scene.add(starField);
      scene.add(new THREE.AmbientLight(0xffffff, .9));
      const light = new THREE.PointLight(0x38bdf8, 2.5, 60); light.position.set(10, 12, 14); scene.add(light);
      let frame = 0, elapsed = 0, lastTime = 0, visible = true, contextLost = false;
      const update = () => {
        ring1.rotation.z = elapsed * .8; ring1.rotation.y = elapsed * .5;
        ring2.rotation.z = -elapsed * .6; ring2.rotation.x = Math.PI / 3 + elapsed * .7;
        core.rotation.y = elapsed * .3;
        for (const node of nodes) node.scale.setScalar(1 + .25 * Math.sin(elapsed * node.userData.speed + node.userData.offset));
        group.rotation.y = elapsed * .2 + stateRef.current.pointerX * .6;
        group.rotation.x = Math.sin(elapsed * .25) * .12 + stateRef.current.pointerY * .5;
        starField.rotation.y = -elapsed * .03;
      };
      const draw = () => { if (cancelled || contextLost) return; update(); renderer.render(scene, camera); container.dataset.sceneTime = elapsed.toFixed(3); };
      const running = () => !cancelled && !contextLost && visible && !document.hidden && !stateRef.current.paused;
      const animate = now => {
        frame = 0; if (!running()) { lastTime = 0; return; }
        if (lastTime) elapsed += Math.min((now - lastTime) / 1000, .05);
        lastTime = now; draw(); frame = requestAnimationFrame(animate);
      };
      const syncMotion = () => {
        if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0;
        draw(); if (running()) frame = requestAnimationFrame(animate);
      };
      sceneRef.current = { syncMotion, draw };
      const resize = () => {
        const bounds = container.getBoundingClientRect(); const width = Math.max(1, bounds.width), heightPx = Math.max(1, bounds.height);
        camera.aspect = width / heightPx; camera.updateProjectionMatrix(); renderer.setSize(width, heightPx, false); draw();
      };
      const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
      resizeObserver?.observe(container); window.addEventListener('resize', resize);
      const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; syncMotion(); }, { threshold: 0 }) : null;
      observer?.observe(container); document.addEventListener('visibilitychange', syncMotion);
      const onLost = event => { event.preventDefault(); contextLost = true; if (frame) cancelAnimationFrame(frame); frame = 0; setStatus('unavailable'); };
      renderer.domElement.addEventListener('webglcontextlost', onLost);
      resize(); syncMotion(); setStatus('ready');
      cleanup = () => {
        if (frame) cancelAnimationFrame(frame); frame = 0; sceneRef.current = null;
        resizeObserver?.disconnect(); observer?.disconnect(); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', syncMotion);
        renderer.domElement.removeEventListener('webglcontextlost', onLost);
        for (const resource of resources) resource.dispose();
        renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      };
    }).catch(() => { if (!cancelled) setStatus('unavailable'); });
    return () => { cancelled = true; cleanup(); };
  }, [mode]);

  const move = event => {
    if (paused || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    stateRef.current.pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
    stateRef.current.pointerY = -((event.clientY - rect.top) / rect.height * 2 - 1);
  };
  const reset = () => { stateRef.current.pointerX = 0; stateRef.current.pointerY = 0; sceneRef.current?.draw(); };
  const keyboard = event => {
    const keys = { ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, .15], ArrowDown: [0, -.15] };
    if (keys[event.key]) { event.preventDefault(); stateRef.current.pointerX += keys[event.key][0]; stateRef.current.pointerY += keys[event.key][1]; sceneRef.current?.draw(); }
    if (event.key === 'Home') { event.preventDefault(); reset(); }
  };
  return <div className="constellation-scene" data-testid="career-constellation" data-mode={mode} data-status={status} data-motion={paused ? 'paused' : 'running'} role="img" aria-label={`Interactive 3D career constellation, ${mode} mode. Use arrow keys to tilt and Home to reset.`} tabIndex={0} style={{ height }} onPointerMove={move} onPointerLeave={reset} onKeyDown={keyboard}>
    <div ref={mountRef} className="constellation-mount" />
    {status !== 'ready' && <div className="constellation-fallback" aria-hidden="true"><svg viewBox="0 0 300 220"><defs><radialGradient id="planet"><stop stopColor="#2697DC"/><stop offset="1" stopColor="#0A2540"/></radialGradient></defs><ellipse cx="150" cy="110" rx="100" ry="78" fill="none" stroke="#206D96" strokeDasharray="3 7"/><ellipse cx="150" cy="110" rx="76" ry="38" fill="none" stroke="#00D4B2" transform="rotate(-30 150 110)"/><circle cx="150" cy="110" r="38" fill="url(#planet)" stroke="#38BDF8"/>{Array.from({ length: 16 }, (_, i) => { const x = 150 + Math.cos(i / 16 * Math.PI * 2) * 100, y = 110 + Math.sin(i / 16 * Math.PI * 2) * 78; return <g key={i}><line x1="150" y1="110" x2={x} y2={y} stroke="#38BDF8" opacity=".15"/><circle cx={x} cy={y} r="3" fill={i % 2 ? '#00D4B2' : '#38BDF8'}/></g>; })}</svg></div>}
    <div className="constellation-overlay"><span className="constellation-status"><i />{status === 'unavailable' ? 'STATIC VIEW' : paused ? 'MOTION PAUSED' : 'CAREER CONSTELLATION'}</span><span>{mode.toUpperCase()}</span></div>
    <div className="constellation-hint">{status === 'unavailable' ? '3D unavailable · a static view is shown' : paused ? 'Arrow keys to tilt · Home to reset' : 'Move your pointer or use arrow keys to explore'}</div>
  </div>;
}
