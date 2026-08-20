import React, { useEffect, useRef, useState } from 'react';

interface GoldInkShaderCanvasProps {
  opacity?: number;
  speed?: number;
  interactive?: boolean;
  className?: string;
}

export const GoldInkShaderCanvas: React.FC<GoldInkShaderCanvasProps> = ({
  opacity = 0.85,
  speed = 1.0,
  interactive = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect WebGL support
    const gl =
      canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // High performance DPR clamp (Max 1.25x to avoid 4K GPU overhead)
    const getDPR = () => Math.min(window.devicePixelRatio || 1, 1.25);

    function syncSize() {
      if (!canvas) return;
      const dpr = getDPR();
      const displayWidth = Math.floor((canvas.clientWidth || window.innerWidth) * dpr);
      const displayHeight = Math.floor((canvas.clientHeight || window.innerHeight) * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncSize());
      resizeObserver.observe(canvas);
    }
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

    // Fragment Shader: Disney Lorcana Magic & Gold Ink Liquid / Chromatic Lore Shimmer
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_opacity;
      varying vec2 v_uv;

      // 2D Simplex Noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x  = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Multi-Octave Fractal Brownian Motion
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.87758, 0.47942, -0.47942, 0.87758);
        for (int i = 0; i < 4; ++i) {
          v += a * snoise(p);
          p = rot * p * 2.0 + vec2(100.0);
          a *= 0.5;
        }
        return v;
      }

      // Fast Pseudo-Random for Starlight
      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Smooth Mouse Ripple Force
        vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float dMouse = length(p - m);
        vec2 mouseForce = (p - m) * exp(-dMouse * 2.2) * 0.22;
        p += mouseForce;

        float t = u_time * 0.07;

        // Domain Warping for Liquid Ink Streams
        vec2 q = vec2(
          fbm(p * 1.1 + vec2(0.0, t * 0.5)),
          fbm(p * 1.1 + vec2(5.2, 1.3 - t * 0.35))
        );

        vec2 r = vec2(
          fbm(p * 1.6 + 3.8 * q + vec2(1.7 - t * 0.25, 9.2)),
          fbm(p * 1.6 + 3.8 * q + vec2(8.3, 2.8 + t * 0.4))
        );

        float f = fbm(p * 0.75 + 3.2 * r);

        // Disney Lorcana Illuminary Ink Color Palette
        vec3 colDeepVoid       = vec3(0.035, 0.047, 0.082); // #090C15 Void
        vec3 colSapphireOcean  = vec3(0.05, 0.11, 0.25);   // Sapphire Lore Ink
        vec3 colAmethystNebula = vec3(0.36, 0.11, 0.58);   // Amethyst Arcane Ink
        vec3 colEmeraldGlow    = vec3(0.05, 0.42, 0.28);   // Emerald Alchemy Ink
        vec3 colRubyEmber      = vec3(0.58, 0.09, 0.20);   // Ruby Dragonfire Ink
        vec3 colGoldAmber      = vec3(0.96, 0.65, 0.12);   // Amber Gold Liquid Ink
        vec3 colFoilShimmer    = vec3(1.0, 0.90, 0.55);   // Gold Core Specular Gleam

        // Composite Fluid Currents
        vec3 color = mix(colDeepVoid, colSapphireOcean, clamp(length(q), 0.0, 1.0));
        color = mix(color, colAmethystNebula, clamp(length(r.x) * 0.75, 0.0, 1.0));
        color = mix(color, colEmeraldGlow, clamp(r.y * 0.5 + 0.15, 0.0, 0.5) * 0.35);

        // Gold Ink River Swirls
        float goldMask = smoothstep(0.12, 0.82, f * f * 1.55 + 0.28 * length(q));
        color = mix(color, colGoldAmber, goldMask * 0.52);

        // Chromatic Lore Foil Wave Edge Sheen
        float edgeShine = pow(clamp(1.0 - abs(f - 0.5) * 2.0, 0.0, 1.0), 3.2);
        color += colFoilShimmer * edgeShine * 0.20;
        color += colRubyEmber * (r.x * r.y) * 0.28;

        // Twinkling Starlight / Lore Sparks
        vec2 sparkCoord = p * 12.0 + vec2(sin(t * 0.8 + p.y), cos(t * 0.8 + p.x));
        vec2 sparkCell = floor(sparkCoord);
        vec2 sparkFract = fract(sparkCoord) - 0.5;
        float sparkHash = hash12(sparkCell);
        float isSpark = smoothstep(0.47, 0.495, sparkHash);
        float sparkGlow = isSpark * (0.012 / (length(sparkFract) + 0.018));
        float twinkle = 0.5 + 0.5 * sin(u_time * 2.8 + sparkHash * 6.28);
        color += colFoilShimmer * sparkGlow * twinkle * 0.42;

        // Cinematic Vignette (Darker Edges for UI Contrast)
        vec2 uvVig = uv * (1.0 - uv.yx);
        float vig = uvVig.x * uvVig.y * 15.0;
        vig = clamp(pow(vig, 0.32), 0.0, 1.0);
        color *= vig;

        // Contrast balancing with master opacity control
        color = clamp(color * 0.94, 0.0, 1.0);

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
        console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
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
      console.warn('Program link error:', gl.getProgramInfoLog(program));
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

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas || !interactive) return;
      const dpr = getDPR();
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = 1.0 - (e.clientY - rect.top) / rect.height;
        targetMouse.x = nx * canvas.width;
        targetMouse.y = ny * canvas.height;
      }
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    let animationFrameId: number;
    let isRunning = true;
    let lastTimestamp = 0;

    // Auto-throttle: Pause rendering completely when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
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
      isRunning = true;
      animationFrameId = requestAnimationFrame(render);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    function render(timestamp: number) {
      if (!isRunning || !canvas || !gl) return;

      // Throttle to 60fps max to save battery
      const delta = timestamp - lastTimestamp;
      if (delta < 15) {
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeObserver) resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(buffer);
      }
    };
  }, [opacity, speed, interactive]);

  return (
    <div
      className={`fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="block w-full h-full opacity-90 transition-opacity duration-1000"
          style={{ willChange: 'transform' }}
        />
      ) : (
        /* CSS Animated Fallback for non-WebGL environments */
        <div className="absolute inset-0 bg-[#0B0F19] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(11,15,25,0.95))]" />
      )}
    </div>
  );
};
