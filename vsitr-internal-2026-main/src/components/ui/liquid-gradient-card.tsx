"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

interface LiquidGradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  radius?: number;
  isDark?: boolean;
}

class TouchTexture {
  size = 64; width = 64; height = 64; maxAge = 64; radius = 0.15; speed = 1/64;
  trail: any[] = []; last: any = null;
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: any;
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width; this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }
  update() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      const f = p.force * this.speed * (1 - p.age / this.maxAge);
      p.x += p.vx * f; p.y += p.vy * f; p.age++;
      if (p.age > this.maxAge) this.trail.splice(i, 1);
      else this.drawPoint(p);
    }
    this.texture.needsUpdate = true;
  }
  addTouch(point: any) {
    let force = 0, vx = 0, vy = 0;
    if (this.last) {
      const dx = point.x - this.last.x, dy = point.y - this.last.y;
      if (dx === 0 && dy === 0) return;
      const d = Math.sqrt(dx*dx + dy*dy);
      vx = dx/d; vy = dy/d;
      force = Math.min((dx*dx + dy*dy) * 20000, 2.0);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }
  drawPoint(p: any) {
    const pos = { x: p.x * this.width, y: (1 - p.y) * this.height };
    let intensity = p.age < this.maxAge * 0.3 
      ? Math.sin((p.age / (this.maxAge * 0.3)) * (Math.PI / 2))
      : -((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) * ((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) - 2));
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const radius = this.radius * this.width;
    this.ctx.shadowOffsetX = this.size * 5;
    this.ctx.shadowOffsetY = this.size * 5;
    this.ctx.shadowBlur = radius;
    this.ctx.shadowColor = `rgba(${color},${0.25 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - this.size * 5, pos.y - this.size * 5, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

class GradientBackground {
  mesh: any = null; uniforms: any; sceneManager: any; isPaused = false;
  constructor(sceneManager: any) {
    this.sceneManager = sceneManager;
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(320, 240) },
      uColor1: { value: new THREE.Vector3(0.757, 0.153, 0.176) },
      uColor2: { value: new THREE.Vector3(0.106, 0.247, 0.545) },
      uColor3: { value: new THREE.Vector3(0.545, 0.137, 0.369) },
      uColor4: { value: new THREE.Vector3(0.106, 0.247, 0.545) },
      uColor5: { value: new THREE.Vector3(0.757, 0.153, 0.176) },
      uColor6: { value: new THREE.Vector3(0.545, 0.137, 0.369) },
      uSpeed: { value: 1.0 }, uIntensity: { value: 1.4 },
      uTouchTexture: { value: null }, uGrainIntensity: { value: 0.04 },
      uDarkNavy: { value: new THREE.Vector3(0.04, 0.05, 0.10) },
      uGradientSize: { value: 0.55 }, uGradientCount: { value: 6.0 },
      uColor1Weight: { value: 0.8 }, uColor2Weight: { value: 1.2 }
    };
  }
  init() {
    const viewSize = this.sceneManager.getViewSize();
    const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `varying vec2 vUv; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vUv = uv; }`,
      fragmentShader: `
        uniform float uTime, uSpeed, uIntensity, uGrainIntensity, uGradientSize, uGradientCount, uColor1Weight, uColor2Weight;
        uniform vec2 uResolution;
        uniform vec3 uColor1, uColor2, uColor3, uColor4, uColor5, uColor6, uDarkNavy;
        uniform sampler2D uTouchTexture;
        varying vec2 vUv;
        
        float grain(vec2 uv, float t) { return fract(sin(dot(uv * uResolution * 0.5 + t, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0; }
        
        vec3 getGradientColor(vec2 uv, float time) {
          vec2 c1 = vec2(0.5 + sin(time * uSpeed * 0.3) * 0.4, 0.5 + cos(time * uSpeed * 0.4) * 0.4);
          vec2 c2 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.5, 0.5 + sin(time * uSpeed * 0.35) * 0.5);
          vec2 c3 = vec2(0.5 + sin(time * uSpeed * 0.25) * 0.45, 0.5 + cos(time * uSpeed * 0.45) * 0.45);
          vec2 c4 = vec2(0.5 + cos(time * uSpeed * 0.4) * 0.4, 0.5 + sin(time * uSpeed * 0.3) * 0.4);
          vec2 c5 = vec2(0.5 + sin(time * uSpeed * 0.6) * 0.35, 0.5 + cos(time * uSpeed * 0.5) * 0.35);
          vec2 c6 = vec2(0.5 + cos(time * uSpeed * 0.35) * 0.5, 0.5 + sin(time * uSpeed * 0.55) * 0.5);
          
          float i1 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c1));
          float i2 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c2));
          float i3 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c3));
          float i4 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c4));
          float i5 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c5));
          float i6 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c6));
          
          vec3 color = vec3(0.0);
          color += uColor1 * i1 * (0.6 + 0.4 * sin(time * uSpeed)) * uColor1Weight;
          color += uColor2 * i2 * (0.6 + 0.4 * cos(time * uSpeed * 1.1)) * uColor2Weight;
          color += uColor3 * i3 * (0.6 + 0.4 * sin(time * uSpeed * 0.7)) * uColor1Weight;
          color += uColor4 * i4 * (0.6 + 0.4 * cos(time * uSpeed * 1.2)) * uColor2Weight;
          color += uColor5 * i5 * (0.6 + 0.4 * sin(time * uSpeed * 1.0)) * uColor1Weight;
          color += uColor6 * i6 * (0.6 + 0.4 * cos(time * uSpeed * 0.8)) * uColor2Weight;
          
          color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
          float lum = dot(color, vec3(0.299, 0.587, 0.114));
          color = mix(vec3(lum), color, 1.25);
          color = pow(color, vec3(0.95));
          float brightness = length(color);
          color = mix(uDarkNavy, color, max(brightness * 1.0, 0.10));
          return color;
        }
        
        void main() {
          vec2 uv = vUv;
          vec4 touchTex = texture2D(uTouchTexture, uv);
          uv.x -= (touchTex.r * 2.0 - 1.0) * 0.4 * touchTex.b;
          uv.y -= (touchTex.g * 2.0 - 1.0) * 0.4 * touchTex.b;
          vec2 center = vec2(0.5);
          float dist = length(uv - center);
          float ripple = sin(dist * 15.0 - uTime * 2.5) * 0.02 * touchTex.b;
          uv += vec2(ripple);
          vec3 color = getGradientColor(uv, uTime);
          color += grain(uv, uTime) * uGrainIntensity;
          color = clamp(color, vec3(0.0), vec3(1.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.sceneManager.scene.add(this.mesh);
  }
  update(delta: number) { if (!this.isPaused) this.uniforms.uTime.value += delta; }
  setTheme(isDark: boolean) {
    if (isDark) {
      this.uniforms.uColor1.value.set(0.757, 0.153, 0.176); // Crimson
      this.uniforms.uColor2.value.set(0.106, 0.247, 0.545); // Navy
      this.uniforms.uColor3.value.set(0.545, 0.137, 0.369); // Purple
      this.uniforms.uColor4.value.set(0.106, 0.247, 0.545);
      this.uniforms.uColor5.value.set(0.757, 0.153, 0.176);
      this.uniforms.uColor6.value.set(0.545, 0.137, 0.369);
      this.uniforms.uDarkNavy.value.set(0.04, 0.05, 0.10);
      if (this.sceneManager.scene) this.sceneManager.scene.background = null;
    } else {
      // Soft high-contrast light pastel colors matching website theme
      this.uniforms.uColor1.value.set(0.98, 0.50, 0.55); // Rose Crimson
      this.uniforms.uColor2.value.set(0.30, 0.55, 0.90); // Sky Navy
      this.uniforms.uColor3.value.set(0.75, 0.45, 0.85); // Light Plum
      this.uniforms.uColor4.value.set(0.30, 0.55, 0.90);
      this.uniforms.uColor5.value.set(0.98, 0.50, 0.55);
      this.uniforms.uColor6.value.set(0.75, 0.45, 0.85);
      this.uniforms.uDarkNavy.value.set(1.0, 1.0, 1.0); // Pure White Base
      if (this.sceneManager.scene) this.sceneManager.scene.background = null;
    }
  }
  onResize(w: number, h: number) {
    const viewSize = this.sceneManager.getViewSize();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
    }
    this.uniforms.uResolution.value.set(w, h);
  }
}

class App {
  renderer: any; camera: any; scene: any; clock: any;
  touchTexture: TouchTexture; gradientBackground: GradientBackground;
  animationId: number | null = null; container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
    // Set alpha to true to allow transparency and set transparent initial background
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();
    // Do not set scene.background to keep transparent WebGL workspace
    this.scene.background = null;
    this.clock = new THREE.Clock();
    this.touchTexture = new TouchTexture();
    this.gradientBackground = new GradientBackground(this);
    this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture;
    this.init();
  }
  setTheme(isDark: boolean) { this.gradientBackground.setTheme(isDark); }
  setPaused(paused: boolean) { this.gradientBackground.isPaused = paused; }
  getViewSize() {
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(this.camera.position.z * Math.tan(fov / 2) * 2);
    return { width: height * this.camera.aspect, height };
  }
  init() {
    this.gradientBackground.init();
    const c = this.container;
    const onMove = (x: number, y: number) => {
      this.touchTexture.addTouch({ x: x / c.clientWidth, y: 1 - y / c.clientHeight });
    };
    c.addEventListener("mousemove", (e) => onMove(e.offsetX, e.offsetY));
    c.addEventListener("touchmove", (e) => {
      const rect = c.getBoundingClientRect();
      onMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    });
    
    // Resize observer wrapper
    const resizeObserver = new ResizeObserver(() => {
      if (!c.clientWidth || !c.clientHeight) return;
      this.camera.aspect = c.clientWidth / c.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(c.clientWidth, c.clientHeight);
      this.gradientBackground.onResize(c.clientWidth, c.clientHeight);
    });
    resizeObserver.observe(c);
    
    this.tick();
  }
  tick() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.touchTexture.update();
    this.gradientBackground.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(() => this.tick());
  }
  cleanup() { 
    if (this.animationId) cancelAnimationFrame(this.animationId); 
    this.renderer.dispose(); 
    if (this.container && this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export function LiquidGradientCard({
  children,
  radius = 16,
  isDark = false,
  className,
  ...props
}: LiquidGradientCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<App | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    appRef.current = new App(container);
    appRef.current.setTheme(isDark);

    return () => {
      if (appRef.current) {
        appRef.current.cleanup();
        appRef.current = null;
      }
    };
  }, [isDark]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden shadow-md bg-white border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800/80",
        className
      )}
      style={{
        borderRadius: `${radius}px`,
      }}
      {...props}
    >
      {/* Canvas container positioned absolute inset-0 */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 pointer-events-none rounded-[inherit] overflow-hidden bg-white dark:bg-slate-950"
      />
      
      {/* Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/5 backdrop-blur-xs z-1 pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full p-5 pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

export default LiquidGradientCard;
