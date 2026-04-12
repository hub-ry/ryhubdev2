import { useEffect, useRef } from 'react'

// ─── Easy color configuration ───────────────────────────────────────────────
// All values are [R, G, B] in 0–1 range (divide a 0–255 hex by 255).
const COLORS = {
  deepPurple:    [0.15, 0.0,  0.3 ],  // base dark fill
  magenta:       [0.6,  0.0,  0.5 ],  // mid swirl
  warmOrange:    [0.95, 0.4,  0.1 ],  // warm accent
  electricPurple:[0.4,  0.1,  0.8 ],  // bright swirl
  highlight:     [0.8,  0.3,  0.9 ],  // fold highlights
  burst1:        [0.9,  0.2,  0.7 ],  // moving glow 1
  burst2:        [0.3,  0.1,  1.0 ],  // moving glow 2
  swirl:         [0.1,  0.0,  0.15],  // chromatic swirl tint
  // Palette offsets (shift hue of the iridescent overlay)
  paletteD:      [0.0,  0.10, 0.20],
  palette2D:     [0.50, 0.20, 0.25],
}
// ─────────────────────────────────────────────────────────────────────────────

function rgb(c) { return `vec3(${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)})` }

const VS = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

function buildFS(C) {
  return `
    precision highp float;
    uniform float u_time;
    uniform vec2  u_resolution;
    uniform vec2  u_mouse;

    vec3 mod289v3(vec3 x) { return x - floor(x*(1.0/289.0))*289.0; }
    vec2 mod289v2(vec2 x) { return x - floor(x*(1.0/289.0))*289.0; }
    vec3 permute(vec3 x) { return mod289v3(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289v2(i);
      vec3 p = permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
      vec3 m = max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0*fract(p*C.www)-1.0;
      vec3 h = abs(x)-0.5;
      vec3 ox = floor(x+0.5);
      vec3 a0 = x-ox;
      m *= 1.79284291400159-0.85373472095314*(a0*a0+h*h);
      vec3 g;
      g.x  = a0.x *x0.x  + h.x *x0.y;
      g.yz = a0.yz*x12.xz + h.yz*x12.yw;
      return 130.0*dot(m,g);
    }

    float fbm(vec2 p) {
      float val=0.0, amp=0.5, freq=1.0;
      for(int i=0;i<6;i++){
        val += amp*snoise(p*freq);
        freq *= 2.1; amp *= 0.48;
        p += vec2(1.7,9.2);
      }
      return val;
    }

    vec3 palette(float t) {
      vec3 a=vec3(0.5,0.5,0.5), b=vec3(0.5,0.5,0.5), c=vec3(1.0,1.0,1.0);
      vec3 d=${rgb(C.paletteD)};
      return a+b*cos(6.28318*(c*t+d));
    }
    vec3 palette2(float t) {
      vec3 a=vec3(0.5,0.5,0.5), b=vec3(0.5,0.5,0.5), c=vec3(2.0,1.0,0.0);
      vec3 d=${rgb(C.palette2D)};
      return a+b*cos(6.28318*(c*t+d));
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5*u_resolution) / min(u_resolution.x, u_resolution.y);
      float t = u_time*0.025;
      vec2 mouse = (u_mouse-0.5)*2.0;

      vec2 q = vec2(
        fbm(p+vec2(0.0,0.0)+t*0.4+mouse*0.1),
        fbm(p+vec2(5.2,1.3)+t*0.3)
      );
      vec2 r = vec2(
        fbm(p+4.0*q+vec2(1.7,9.2)+t*0.2),
        fbm(p+4.0*q+vec2(8.3,2.8)+t*0.25)
      );
      float f = fbm(p+3.5*r);

      vec3 col = mix(${rgb(C.deepPurple)}, ${rgb(C.magenta)}, clamp(f*f*4.0, 0.0, 1.0));
      col = mix(col, ${rgb(C.warmOrange)},    clamp(length(q),   0.0, 1.0));
      col = mix(col, ${rgb(C.electricPurple)}, clamp(length(r.x), 0.0, 1.0));

      vec3 pal  = palette(f*0.8+t*0.5+length(p)*0.3);
      vec3 pal2 = palette2(f*0.6-t*0.3+length(q)*0.5);
      col = mix(col, pal,  0.35);
      col = mix(col, pal2, 0.2);

      float highlight = smoothstep(0.3, 0.8, f*f*3.0);
      col += ${rgb(C.highlight)} * highlight * 0.3;

      float swirl = sin(length(p)*8.0-t*3.0+f*6.0)*0.5+0.5;
      col += ${rgb(C.swirl)} * swirl;

      float burst1 = exp(-3.0*length(p-vec2(sin(t*0.7)*0.5, cos(t*0.5)*0.4)));
      float burst2 = exp(-4.0*length(p-vec2(cos(t*0.9)*0.6, sin(t*0.6)*0.3)));
      col += ${rgb(C.burst1)} * burst1 * 0.5;
      col += ${rgb(C.burst2)} * burst2 * 0.4;

      col = pow(col, vec3(0.85));

      float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453);
      col += (grain-0.5)*0.04;

      col = clamp(col, 0.0, 1.0);
      col = smoothstep(0.0, 1.0, col);

      gl_FragColor = vec4(col, 1.0);
    }
  `
}

export default function PsychBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return

    let W, H, animId

    function resize() {
      const dpr = window.devicePixelRatio || 1
      W = canvas.width  = canvas.offsetWidth  * dpr
      H = canvas.height = canvas.offsetHeight * dpr
      gl.viewport(0, 0, W, H)
    }
    resize()
    window.addEventListener('resize', resize)

    function makeShader(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s))
        return null
      }
      return s
    }

    const vs = makeShader(gl.VERTEX_SHADER,   VS)
    const fs = makeShader(gl.FRAGMENT_SHADER, buildFS(COLORS))
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime  = gl.getUniformLocation(prog, 'u_time')
    const uRes   = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5
    const onMove = e => {
      tmx = e.clientX / window.innerWidth
      tmy = 1.0 - e.clientY / window.innerHeight
    }
    window.addEventListener('mousemove', onMove)

    const t0 = performance.now()
    function render() {
      const elapsed = (performance.now() - t0) / 1000
      mx += (tmx - mx) * 0.03
      my += (tmy - my) * 0.03
      gl.uniform1f(uTime,  elapsed)
      gl.uniform2f(uRes,   W, H)
      gl.uniform2f(uMouse, mx, my)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
