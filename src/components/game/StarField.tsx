import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  opacity: number;
}

interface CelestialObject {
  x: number;
  y: number;
  radius: number;
  color1: string;
  color2: string;
  speed: number;
  ringColor?: string;
  hasRing: boolean;
}

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    // Layer 1: far stars (small, slow)
    const farStars: Star[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1 + 0.3,
      speed: Math.random() * 0.3 + 0.1,
      brightness: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Layer 2: mid stars (medium, faster)
    const midStars: Star[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5 + 0.8,
      speed: Math.random() * 0.8 + 0.4,
      brightness: Math.random() * 0.4 + 0.5,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Layer 3: near stars (large, fastest) - streak effect
    const nearStars: Star[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 1.5,
      speed: Math.random() * 2 + 1.5,
      brightness: Math.random() * 0.3 + 0.7,
      twinkleSpeed: 0,
      twinkleOffset: 0,
    }));

    // Nebulae
    const nebulae: Nebula[] = [
      { x: w * 0.2, y: -200, radius: 250, color: '280,70%,40%', speed: 0.08, opacity: 0.06 },
      { x: w * 0.7, y: h * 0.3, radius: 300, color: '200,80%,35%', speed: 0.05, opacity: 0.05 },
      { x: w * 0.5, y: h * 0.8, radius: 200, color: '320,70%,45%', speed: 0.07, opacity: 0.04 },
    ];

    // Celestial objects
    const celestials: CelestialObject[] = [
      { x: w * 0.15, y: -300, radius: 20, color1: '#2a1a4e', color2: '#5b3a8e', speed: 0.04, hasRing: false },
      { x: w * 0.8, y: -800, radius: 30, color1: '#1a3a4e', color2: '#3a7a9e', speed: 0.03, hasRing: true, ringColor: 'rgba(100,180,220,0.15)' },
    ];

    let time = 0;
    let animationId: number;

    const drawStar = (star: Star, streak: boolean) => {
      const twinkle = streak ? 1 : 0.6 + 0.4 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.brightness * twinkle;

      if (streak && star.speed > 2) {
        // Motion streak for near stars
        const grad = ctx.createLinearGradient(star.x, star.y, star.x, star.y - star.speed * 4);
        grad.addColorStop(0, `rgba(200,220,255,${alpha})`);
        grad.addColorStop(1, `rgba(200,220,255,0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = star.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x, star.y - star.speed * 4);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();

      // Glow for brighter stars
      if (alpha > 0.6 && star.size > 1) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,200,255,${alpha * 0.15})`;
        ctx.fill();
      }
    };

    const moveStar = (star: Star) => {
      star.y += star.speed;
      if (star.y > h + 10) {
        star.y = -10;
        star.x = Math.random() * w;
      }
    };

    const drawNebula = (neb: Nebula) => {
      const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
      grad.addColorStop(0, `hsla(${neb.color},${neb.opacity + 0.02})`);
      grad.addColorStop(0.5, `hsla(${neb.color},${neb.opacity})`);
      grad.addColorStop(1, `hsla(${neb.color},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(neb.x - neb.radius, neb.y - neb.radius, neb.radius * 2, neb.radius * 2);
    };

    const drawCelestial = (obj: CelestialObject) => {
      const grad = ctx.createRadialGradient(obj.x - obj.radius * 0.3, obj.y - obj.radius * 0.3, 0, obj.x, obj.y, obj.radius);
      grad.addColorStop(0, obj.color2);
      grad.addColorStop(1, obj.color1);
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.4;
      ctx.fill();

      if (obj.hasRing && obj.ringColor) {
        ctx.beginPath();
        ctx.ellipse(obj.x, obj.y, obj.radius * 2, obj.radius * 0.3, 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = obj.ringColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      time++;

      // Gradient background: deep black top → dark blue-purple bottom
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#050510');
      bgGrad.addColorStop(0.5, '#080818');
      bgGrad.addColorStop(1, '#0a0a20');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw nebulae (behind everything)
      nebulae.forEach(neb => {
        drawNebula(neb);
        neb.y += neb.speed;
        if (neb.y - neb.radius > h + 50) {
          neb.y = -neb.radius - 100;
          neb.x = Math.random() * w;
        }
      });

      // Draw celestial objects
      celestials.forEach(obj => {
        drawCelestial(obj);
        obj.y += obj.speed;
        if (obj.y - obj.radius > h + 50) {
          obj.y = -obj.radius - Math.random() * 500 - 200;
          obj.x = Math.random() * w;
        }
      });

      // Draw stars back to front
      farStars.forEach(s => { drawStar(s, false); moveStar(s); });
      midStars.forEach(s => { drawStar(s, false); moveStar(s); });
      nearStars.forEach(s => { drawStar(s, true); moveStar(s); });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default StarField;
