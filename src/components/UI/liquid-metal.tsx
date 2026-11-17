import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export function LiquidMetalDemo() {
  return (
    <LiquidMetalButton
      icon={<ArrowRight className="w-5 h-5" />}
      metalConfig={{
        colorBack: '#3b82f6',
        colorTint: '#93c5fd',
      }}
    >
      Click Me
    </LiquidMetalButton>
  )
}

export interface LiquidMetalConfig {
  colorBack?: string
  colorTint?: string
  speed?: number
  distortion?: number
  repetition?: number
}

export interface LiquidMetalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  icon?: React.ReactNode
  metalConfig?: LiquidMetalConfig
  borderWidth?: number
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

function hexToRgb(hex: string, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(clean, 16)
  if (Number.isNaN(num)) return fallback
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255]
}

const VERTEX_SHADER_SRC = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = (position + 1.0) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColorBack;
uniform vec3 uColorTint;
uniform float uSpeed;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float f = 0.0;
  f += 0.5000 * snoise(p); p *= 2.02;
  f += 0.2500 * snoise(p); p *= 2.03;
  f += 0.1250 * snoise(p); p *= 2.01;
  return f;
}

void main() {
  vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * uSpeed;
  
  vec2 q = vec2(fbm(st + vec2(0.0, t * 0.12)), fbm(st + vec2(t * 0.15, 0.0)));
  vec2 r = vec2(fbm(st + 3.0 * q + vec2(t * 0.25, t * 0.1)), fbm(st + 3.0 * q + vec2(0.0, t * 0.2)));
  float f = fbm(st + 4.0 * r);
  
  float specular = pow(clamp(f * 1.6 + 0.35, 0.0, 1.0), 3.5);
  float rim = pow(1.0 - abs(f), 2.2);
  
  vec3 col = mix(uColorBack, uColorTint, clamp((f * f) * 3.5, 0.0, 1.0));
  col += vec3(specular * 0.85) + vec3(rim * 0.45);
  
  gl_FragColor = vec4(col, 1.0);
}
`

export function LiquidMetalCanvas({
  colorBack = '#3b82f6',
  colorTint = '#93c5fd',
  speed = 0.8,
  isHovered = false,
}: {
  colorBack?: string
  colorTint?: string
  speed?: number
  isHovered?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

    if (!gl) {
      // 2D Canvas fallback
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      let animId: number
      let t = 0
      const render2d = () => {
        t += 0.02 * (isHovered ? 1.8 : 1.0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const grad = ctx.createLinearGradient(
          0,
          0,
          canvas.width * Math.sin(t),
          canvas.height * Math.cos(t),
        )
        grad.addColorStop(0, colorBack)
        grad.addColorStop(0.5, colorTint)
        grad.addColorStop(1, colorBack)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        animId = requestAnimationFrame(render2d)
      }
      render2d()
      return () => cancelAnimationFrame(animId)
    }

    function createShader(type: number, src: string) {
      if (!gl) return null
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC)
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const posAttr = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    const uTimeLoc = gl.getUniformLocation(program, 'uTime')
    const uResLoc = gl.getUniformLocation(program, 'uResolution')
    const uColorBackLoc = gl.getUniformLocation(program, 'uColorBack')
    const uColorTintLoc = gl.getUniformLocation(program, 'uColorTint')
    const uSpeedLoc = gl.getUniformLocation(program, 'uSpeed')

    const backRgb = hexToRgb(colorBack, [0.23, 0.51, 0.96])
    const tintRgb = hexToRgb(colorTint, [0.58, 0.77, 0.99])

    gl.uniform3f(uColorBackLoc, backRgb[0], backRgb[1], backRgb[2])
    gl.uniform3f(uColorTintLoc, tintRgb[0], tintRgb[1], tintRgb[2])

    let animationFrameId: number
    const startTime = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(canvas.clientWidth * dpr, 100)
      const height = Math.max(canvas.clientHeight * dpr, 40)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
        gl.uniform2f(uResLoc, width, height)
      }
    }

    resize()

    const render = () => {
      resize()
      const elapsed = (performance.now() - startTime) * 0.001
      const currentSpeed = speed * (isHovered ? 1.7 : 1.0)
      gl.uniform1f(uTimeLoc, elapsed)
      gl.uniform1f(uSpeedLoc, currentSpeed)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      if (vs) gl.deleteShader(vs)
      if (fs) gl.deleteShader(fs)
    }
  }, [colorBack, colorTint, speed, isHovered])

  return <canvas ref={canvasRef} className="absolute inset-0 size-full pointer-events-none" />
}

export function LiquidMetalButton({
  children,
  icon,
  metalConfig,
  borderWidth = 2,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...rest
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-11 px-5 text-sm',
    lg: 'h-13 px-6 text-base',
  }[size]

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses} ${className}`}
      {...rest}
    >
      {/* Liquid Metal Shader Canvas Background */}
      <div className="absolute inset-0 -z-20 overflow-hidden rounded-full">
        <LiquidMetalCanvas
          colorBack={metalConfig?.colorBack}
          colorTint={metalConfig?.colorTint}
          speed={metalConfig?.speed ?? 0.8}
          isHovered={isHovered}
        />
      </div>

      {/* Subtle outer glow on hover */}
      <div
        className="absolute -inset-1 -z-30 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
        style={{
          background: `radial-gradient(circle, ${metalConfig?.colorTint || '#93c5fd'} 0%, transparent 70%)`,
        }}
      />

      {/* Inner surface layer framing the metallic border */}
      <div
        className="absolute inset-0 -z-10 rounded-full bg-[#1c1917]/90 backdrop-blur-md transition-colors duration-200 group-hover:bg-[#1c1917]/85"
        style={{
          margin: `${borderWidth}px`,
        }}
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2 font-semibold text-white drop-shadow-sm">
        {icon && <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>}
        {children && <span>{children}</span>}
      </span>
    </button>
  )
}
