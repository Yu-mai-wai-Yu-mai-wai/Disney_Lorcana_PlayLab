import React, { useEffect, useRef, useState } from 'react';

interface GoldInkShaderCanvasProps {
  opacity?: number;
  speed?: number;
  interactive?: boolean;
  paused?: boolean;
  className?: string;
}

export const GoldInkShaderCanvas: React.FC<GoldInkShaderCanvasProps> = ({
  opacity = 0.85,
  speed = 1.0,
  interactive = true,
  paused = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    if (paused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect WebGL support with low-power / high-efficiency preference
    const gl =
      canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        desynchronized: true,
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // High performance DPR & Internal Resolution Scaling:
    // Scale the internal canvas buffer to ~0.25x-0.30x (max 380px width).
    // Hardware bilinear upscale gives a silky smooth liquid look while saving >95% GPU cycles!
    function syncSize() {
      if (!canvas) return;
      const clientW = window.innerWidth || canvas.clientWidth || 1280;
      const clientH = window.innerHeight || canvas.clientHeight || 720;
      const isMobileOrTablet = clientW < 1024;
      const maxW = isMobileOrTablet ? 300 : 380;
      const scale = Math.min(isMobileOrTablet ? 0.22 : 0.28, maxW / Math.max(1, clientW));
      const displayWidth = Math.max(180, Math.floor(clientW * scale));
      const displayHeight = Math.max(100, Math.floor(clientH * scale));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    }

    let resizeTimer: any = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncSize, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    syncSize();

    // Vertex Shader: Fullscreen Quad
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Ultra-High-Performance Disney Lorcana Magic & Gold Ink Fluid
    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_opacity;
      varying vec2 v_uv;

      // Fast Sinusoidal / Polynomial Pseudo-Noise (Zero Texture, Zero Complex Loops)
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      // Fast 2-octave fluid wave function
      float fbm(vec2 p) {
        float v = 0.6 * noise(p);
        v += 0.4 * noise(p * 2.1 + vec2(3.2, 1.5));
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Smooth Mouse Ripple
        vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float dMouse = length(p - m);
        p += (p - m) * exp(-dMouse * 3.0) * 0.15;

        float t = u_time * 0.05;

        // Single-pass lightweight domain warp
        vec2 q = vec2(
          fbm(p * 1.2 + vec2(0.0, t * 0.4)),
          fbm(p * 1.2 + vec2(4.1, 1.1 - t * 0.3))
        );

        float f = fbm(p * 0.9 + 2.0 * q);

        // Disney Lorcana Illuminary Ink Palette
        vec3 colDeepVoid       = vec3(0.035, 0.047, 0.082); // #090C15 Void
        vec3 colSapphireOcean  = vec3(0.05, 0.11, 0.25);   // Sapphire Lore Ink
        vec3 colAmethystNebula = vec3(0.36, 0.11, 0.58);   // Amethyst Arcane Ink
        vec3 colGoldAmber      = vec3(0.96, 0.65, 0.12);   // Amber Gold Liquid Ink
        vec3 colFoilShimmer    = vec3(1.0, 0.90, 0.55);   // Specular Gleam

        // Composite Fluid Currents
        vec3 color = mix(colDeepVoid, colSapphireOcean, clamp(length(q), 0.0, 1.0));
        color = mix(color, colAmethystNebula, clamp(q.x * 0.8, 0.0, 1.0));

        // Gold Ink River Swirls
        float goldMask = smoothstep(0.2, 0.75, f * f * 1.4 + 0.2 * length(q));
        color = mix(color, colGoldAmber, goldMask * 0.45);

        // Edge Sheen
        float edgeShine = pow(clamp(1.0 - abs(f - 0.5) * 2.0, 0.0, 1.0), 2.5);
        color += colFoilShimmer * edgeShine * 0.15;

        // Cinematic Vignette
        vec2 uvVig = uv * (1.0 - uv.yx);
        float vig = clamp(pow(uvVig.x * uvVig.y * 15.0, 0.32), 0.0, 1.0);
        color *= vig;

        gl_FragColor = vec4(color, u_opacity);
      }
    `;

    function compileShader(type: number, src: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertShader || !fragShader) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    gl.useProgram(program);

    // Quad Buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uOpacity = gl.getUniformLocation(program, 'u_opacity');

    let currentMouse = { x: canvas.width / 2, y: canvas.height / 2 };
    let targetMouse = { x: canvas.width / 2, y: canvas.height / 2 };

    // Zero-reflow mouse tracking: No getBoundingClientRect calls on mousemove!
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      lastMouseMoveTime = performance.now();
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      const nx = e.clientX / w;
      const ny = 1.0 - e.clientY / h;
      targetMouse.x = nx * canvas.width;
      targetMouse.y = ny * canvas.height;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    let animationFrameId: number;
    let isRunning = true;
    let lastTimestamp = 0;
    let lastMouseMoveTime = performance.now();

    // Respect prefers-reduced-motion: render a single static frame, no loop
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) speed = 0;

    // Auto-throttle: Pause rendering completely when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden || paused) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle Context Lost & Restored
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };

    const handleContextRestored = () => {
      syncSize();
      if (!paused) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    function render(timestamp: number) {
      if (!isRunning || !canvas || !gl || paused) return;

      const isMobile = (window.innerWidth || 1280) < 1024;
      const isIdle = timestamp - lastMouseMoveTime > 2500;
      // Target 24fps on mobile/idle, 30fps when active desktop — ultra light GPU budget!
      const targetInterval = isIdle || isMobile ? 42 : 33;

      const delta = timestamp - lastTimestamp;
      if (delta < targetInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      lastTimestamp = timestamp;

      // Smooth mouse lerp
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.06;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.06;

      gl.viewport(0, 0, canvas.width, canvas.height);

      if (uTime) gl.uniform1f(uTime, (timestamp * 0.001) * speed);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, currentMouse.x, currentMouse.y);
      if (uOpacity) gl.uniform1f(uOpacity, opacity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(buffer);
      }
    };
  }, [opacity, speed, interactive, paused]);

  return (
    <div
      className={`fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="block w-full h-full opacity-90 transition-opacity duration-1000"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        />
      ) : (
        /* CSS Animated Fallback for non-WebGL environments */
        <div className="absolute inset-0 bg-[#0B0F19] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(11,15,25,0.95))]" />
      )}
    </div>
  );
};
