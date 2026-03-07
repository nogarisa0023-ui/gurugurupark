import React, { useEffect, useRef } from 'react';
import { Tile, Season, Insect, INSECTS } from '../game/data';

interface CanvasMapProps {
  grid: Tile[];
  season?: Season;
  interactive?: boolean;
  onTileClick?: (index: number) => void;
  appearedInsects?: string[];
}

export const CanvasMap: React.FC<CanvasMapProps> = ({ 
  grid, 
  season = 'summer' as Season, 
  interactive = false, 
  onTileClick,
  appearedInsects = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Perspective settings - adjusted for better visibility (less extreme foreshortening)
    const vx = width / 2;
    const vy = -150; // Moved vanishing point further up
    
    const project = (col: number, row: number) => {
      // Reduced depth scaling for better visibility of back rows
      const z = 6 - row; 
      const scale = 1 / (z * 0.2 + 1);
      // Adjusted spread to fit within canvas
      const x = vx + (col - 2.5) * 140 * scale;
      // Adjusted vertical position to prevent bottom cutoff
      const y = vy + 600 * scale;
      return { x, y, scale };
    };

    // 1. Draw Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 200);
    if (season === 'summer') {
      skyGradient.addColorStop(0, '#3b82f6');
      skyGradient.addColorStop(1, '#93c5fd');
    } else if (season === 'winter') {
      skyGradient.addColorStop(0, '#94a3b8');
      skyGradient.addColorStop(1, '#f1f5f9');
    } else if (season === 'fall') {
      skyGradient.addColorStop(0, '#f97316');
      skyGradient.addColorStop(1, '#fde047');
    } else { // spring
      skyGradient.addColorStop(0, '#60a5fa');
      skyGradient.addColorStop(1, '#bfdbfe');
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, 200);

    // Draw Clouds (Summer)
    if (season === 'summer') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(100, 80, 30, 0, Math.PI*2);
      ctx.arc(140, 80, 40, 0, Math.PI*2);
      ctx.arc(180, 90, 30, 0, Math.PI*2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(400, 60, 25, 0, Math.PI*2);
      ctx.arc(430, 50, 35, 0, Math.PI*2);
      ctx.arc(460, 60, 25, 0, Math.PI*2);
      ctx.fill();
    }

    // 2. Draw Ground Base (to fill the horizon gap)
    const horizonY = project(0, 0).y;
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    if (season === 'winter') {
      groundGrad.addColorStop(0, '#f8fafc'); groundGrad.addColorStop(0.3, '#f1f5f9'); groundGrad.addColorStop(0.7, '#e2e8f0'); groundGrad.addColorStop(1, '#cbd5e1');
    } else {
      groundGrad.addColorStop(0, '#bef264'); groundGrad.addColorStop(0.3, '#a3e635'); groundGrad.addColorStop(0.7, '#84cc16'); groundGrad.addColorStop(1, '#65a30d');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Draw Road in foreground (Asphalt with texture)
    const roadP1 = project(-5, 5.2);
    const roadP2 = project(10, 5.2);
    const roadP3 = project(10, 10);
    const roadP4 = project(-5, 10);

    ctx.beginPath();
    ctx.moveTo(roadP1.x, roadP1.y);
    ctx.lineTo(roadP2.x, roadP2.y);
    ctx.lineTo(roadP3.x, roadP3.y);
    ctx.lineTo(roadP4.x, roadP4.y);
    ctx.closePath();

    const roadGrad = ctx.createLinearGradient(0, roadP1.y, 0, roadP3.y);
    if (season === 'winter') {
      roadGrad.addColorStop(0, '#cbd5e1'); roadGrad.addColorStop(0.3, '#94a3b8'); roadGrad.addColorStop(0.7, '#64748b'); roadGrad.addColorStop(1, '#475569');
    } else {
      roadGrad.addColorStop(0, '#94a3b8'); roadGrad.addColorStop(0.3, '#64748b'); roadGrad.addColorStop(0.7, '#475569'); roadGrad.addColorStop(1, '#334155');
    }
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // Asphalt Texture (Bumpy)
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 800; i++) {
      const rx = pseudoRandom(i * 11) * width;
      const ry = roadP1.y + pseudoRandom(i * 22) * (roadP3.y - roadP1.y);
      const isDark = pseudoRandom(i * 33) > 0.5;
      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(rx, ry, 1 + pseudoRandom(i * 44) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Road lines
    ctx.strokeStyle = season === 'winter' ? '#f8fafc' : '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    ctx.beginPath();
    const lineP1 = project(-5, 6.5);
    const lineP2 = project(10, 6.5);
    ctx.moveTo(lineP1.x, lineP1.y);
    ctx.lineTo(lineP2.x, lineP2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Grid Polygons (Seamless blending with 4-color gradients)
    grid.forEach((tile, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      
      const p1 = project(col - 0.05, row - 0.05);
      const p2 = project(col + 1.05, row - 0.05);
      const p3 = project(col + 1.05, row + 1.05);
      const p4 = project(col - 0.05, row + 1.05);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();

      const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
      const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
      const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
      const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
      
      const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
      
      if (tile.type === 'dirt') {
        if (season === 'winter') {
          grad.addColorStop(0, '#f8fafc'); grad.addColorStop(0.3, '#f1f5f9'); grad.addColorStop(0.7, '#e2e8f0'); grad.addColorStop(1, '#cbd5e1');
        } else {
          grad.addColorStop(0, '#fcd34d'); grad.addColorStop(0.3, '#f59e0b'); grad.addColorStop(0.7, '#d97706'); grad.addColorStop(1, '#b45309');
        }
      } else if (tile.type === 'pond') {
        if (season === 'winter') {
          grad.addColorStop(0, '#e0f2fe'); grad.addColorStop(0.3, '#bae6fd'); grad.addColorStop(0.7, '#7dd3fc'); grad.addColorStop(1, '#38bdf8');
        } else {
          grad.addColorStop(0, '#93c5fd'); grad.addColorStop(0.3, '#60a5fa'); grad.addColorStop(0.7, '#3b82f6'); grad.addColorStop(1, '#2563eb');
        }
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        if (season === 'winter') {
          grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.3, '#f8fafc'); grad.addColorStop(0.7, '#f1f5f9'); grad.addColorStop(1, '#e2e8f0');
        } else if (season === 'fall') {
          grad.addColorStop(0, '#d9f99d'); grad.addColorStop(0.3, '#bef264'); grad.addColorStop(0.7, '#a3e635'); grad.addColorStop(1, '#84cc16');
        } else if (season === 'spring') {
          grad.addColorStop(0, '#bbf7d0'); grad.addColorStop(0.3, '#86efac'); grad.addColorStop(0.7, '#4ade80'); grad.addColorStop(1, '#22c55e');
        } else {
          grad.addColorStop(0, '#86efac'); grad.addColorStop(0.3, '#4ade80'); grad.addColorStop(0.7, '#22c55e'); grad.addColorStop(1, '#16a34a');
        }
      }

      if (tile.type !== 'pond') {
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Add texture for dirt
      if (tile.type === 'dirt') {
        ctx.save();
        ctx.clip();
        for (let j = 0; j < 50; j++) {
          const seed1 = (i + 1) * 137 + j * 19;
          const seed2 = (i + 1) * 251 + j * 37;
          const seed3 = (i + 1) * 331 + j * 41;
          const seed4 = (i + 1) * 409 + j * 47;
          const tx = minX + pseudoRandom(seed1) * (maxX - minX);
          const ty = minY + pseudoRandom(seed2) * (maxY - minY);
          const isDark = pseudoRandom(seed3) > 0.5;
          if (season === 'winter') {
            ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(255, 255, 255, 0.4)';
          } else {
            ctx.fillStyle = isDark ? 'rgba(120, 53, 15, 0.3)' : 'rgba(251, 191, 36, 0.3)';
          }
          ctx.beginPath();
          ctx.arc(tx, ty, 1 + pseudoRandom(seed4) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      
      // Add horizontal lines for pond (sparkle)
      if (tile.type === 'pond') {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = season === 'winter' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        for (let j = 0; j < 15; j++) {
          const seed1 = (i + 1) * 113 + j * 17;
          const seed2 = (i + 1) * 199 + j * 23;
          const seed3 = (i + 1) * 277 + j * 29;
          const ty = minY + pseudoRandom(seed1) * (maxY - minY);
          const tx = minX + pseudoRandom(seed2) * (maxX - minX);
          const len = 10 + pseudoRandom(seed3) * 30;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + len, ty);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Add diagonal lines for grass
      if (tile.type === 'grass') {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = season === 'winter' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(20, 83, 45, 0.2)';
        ctx.lineWidth = 2;
        for (let j = 0; j < 20; j++) {
          const seed1 = (i + 1) * 101 + j * 13;
          const seed2 = (i + 1) * 151 + j * 31;
          const seed3 = (i + 1) * 211 + j * 43;
          const tx = minX + pseudoRandom(seed1) * (maxX - minX);
          const ty = minY + pseudoRandom(seed2) * (maxY - minY);
          const len = 15 + pseudoRandom(seed3) * 20;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + len * 0.7, ty - len);
          ctx.stroke();
        }
        ctx.restore();
      }
    });

    // Second pass: Draw soft gradients at edges to blend tiles
    // (Removed pond radial gradient)

    // Draw grid lines only in placement mode for clarity
    if (interactive) {
      grid.forEach((tile, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const p1 = project(col, row);
        const p2 = project(col + 1, row);
        const p3 = project(col + 1, row + 1);
        const p4 = project(col, row + 1);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // 4. Collect Objects for Y-Sorting
    const objects: any[] = [];

    grid.forEach((tile, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const seedBase = i * 100;

      if (tile.type === 'tree') {
        const count = 3;
        for (let j = 0; j < count; j++) {
          const offsetX = (pseudoRandom(seedBase + j) - 0.5) * 0.7;
          const offsetY = (pseudoRandom(seedBase + j + 50) - 0.5) * 0.7;
          const pos = project(col + 0.5 + offsetX, row + 0.5 + offsetY);
          const sizeMod = 0.7 + pseudoRandom(seedBase + j + 100) * 0.5;
          objects.push({ type: 'tree', level: tile.level, sizeMod, ...pos });
        }
      } else if (tile.type === 'flower') {
        const count = 5;
        for (let j = 0; j < count; j++) {
          const offsetX = (pseudoRandom(seedBase + j) - 0.5) * 0.8;
          const offsetY = (pseudoRandom(seedBase + j + 50) - 0.5) * 0.8;
          const pos = project(col + 0.5 + offsetX, row + 0.5 + offsetY);
          const sizeMod = 0.6 + pseudoRandom(seedBase + j + 100) * 0.6;
          objects.push({ type: 'flower', level: tile.level, sizeMod, ...pos });
        }
      } else if (tile.type === 'grass' && tile.level > 1) {
        const count = 4;
        for (let j = 0; j < count; j++) {
          const offsetX = (pseudoRandom(seedBase + j) - 0.5) * 0.8;
          const offsetY = (pseudoRandom(seedBase + j + 50) - 0.5) * 0.8;
          const pos = project(col + 0.5 + offsetX, row + 0.5 + offsetY);
          const sizeMod = 0.7 + pseudoRandom(seedBase + j + 100) * 0.5;
          objects.push({ type: 'grass', level: tile.level, sizeMod, ...pos });
        }
      }
    });

    // Add House (Right side)
    objects.push({ type: 'house', x: project(5.6, 1.5).x, y: project(5.6, 1.5).y, scale: project(5.6, 1.5).scale, sizeMod: 1, level: 1 });

    // Add Insects
    const insectData = appearedInsects.map(id => INSECTS.find(i => i.id === id)).filter(Boolean) as Insect[];
    const insectsByHabitat: Record<string, Insect[]> = {};
    insectData.forEach(ins => {
      if (!insectsByHabitat[ins.habitat]) insectsByHabitat[ins.habitat] = [];
      insectsByHabitat[ins.habitat].push(ins);
    });

    Object.entries(insectsByHabitat).forEach(([habitat, insects]) => {
      const matchingTiles = grid.map((t, i) => ({ t, i })).filter(item => item.t.type === habitat);
      if (matchingTiles.length === 0) return;

      insects.forEach((ins, idx) => {
        const state = ins.stages[season];
        if (state === 'なし') return;

        const tileInfo = matchingTiles[idx % matchingTiles.length];
        const col = tileInfo.i % 5;
        const row = Math.floor(tileInfo.i / 5);
        
        const seed = ins.id.charCodeAt(0) + season.charCodeAt(0);
        const offsetCol = (Math.sin(seed) * 0.3);
        const offsetRow = (Math.cos(seed) * 0.3);
        
        const pos = project(col + 0.5 + offsetCol, row + 0.5 + offsetRow);
        
        // Adjust Y position so insects sit ON the objects instead of at the base
        let displayY = pos.y;
        const level = tileInfo.t.level;
        if (habitat === 'tree') displayY -= (20 + level * 8) * pos.scale;
        else if (habitat === 'flower') displayY -= 20 * pos.scale;
        else if (habitat === 'grass') displayY -= 10 * pos.scale;

        objects.push({ type: 'insect', insect: ins, state, sizeMod: 1, x: pos.x, y: displayY, scale: pos.scale });
      });
    });

    // Add seasonal decorations
    if (season === 'spring') {
      for (let i = 0; i < 60; i++) {
        const col = pseudoRandom(i * 123) * 8 - 1.5;
        const row = 5 + pseudoRandom(i * 321) * 3;
        const pos = project(col, row);
        objects.push({ type: 'decoration', decType: 'sakura', ...pos, seed: i, sizeMod: 1 });
      }
    } else if (season === 'summer') {
      for (let i = 0; i < 20; i++) {
        const col = pseudoRandom(i * 444) * 8 - 1.5;
        const row = 5 + pseudoRandom(i * 555) * 3;
        const pos = project(col, row);
        objects.push({ type: 'decoration', decType: 'weed', ...pos, seed: i, sizeMod: 1 });
      }
    } else if (season === 'fall') {
      for (let i = 0; i < 50; i++) {
        const col = pseudoRandom(i * 111) * 8 - 1.5;
        const row = 5 + pseudoRandom(i * 222) * 3;
        const pos = project(col, row);
        objects.push({ type: 'decoration', decType: 'leaf', ...pos, seed: i, sizeMod: 1 });
      }
    } else if (season === 'winter') {
      const pos1 = project(1, 5.8);
      objects.push({ type: 'decoration', decType: 'snowman', ...pos1, sizeMod: 1 });
      const pos2 = project(3.5, 5.3);
      objects.push({ type: 'decoration', decType: 'snowman', ...pos2, sizeMod: 1 });
    }

    // Sort by Y (Back to Front)
    objects.sort((a, b) => a.y - b.y);

    // 5. Draw Environment Objects
    objects.forEach(obj => {
      if (obj.type === 'insect') return;
      
      const { x, y, scale, type, level, sizeMod } = obj;

      // Atmospheric perspective (fade out objects in the back slightly)
      ctx.globalAlpha = Math.min(1, 0.4 + scale * 0.8);

      // Drop Shadow
      const noShadowTypes = ['sakura', 'leaf', 'weed'];
      if (!(type === 'decoration' && noShadowTypes.includes(obj.decType)) && type !== 'house') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y, 30 * scale * sizeMod, 10 * scale * sizeMod, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (type === 'tree') {
        // Trunk
        const trunkGrad = ctx.createLinearGradient(x - 10*scale, y - 20*scale, x + 10*scale, y);
        trunkGrad.addColorStop(0, '#92400e'); trunkGrad.addColorStop(0.3, '#78350f'); trunkGrad.addColorStop(0.7, '#451a03'); trunkGrad.addColorStop(1, '#270f01');
        ctx.fillStyle = trunkGrad;
        const trunkW = (10 + level * 2) * scale * sizeMod;
        const trunkH = (20 + level * 8) * scale * sizeMod;
        ctx.fillRect(x - trunkW/2, y - trunkH, trunkW, trunkH);
        
        // Canopy
        const radius = (15 + level * 6) * scale * sizeMod;
        const cy = y - trunkH;
        const canopyGrad = ctx.createRadialGradient(x, cy - radius/2, 0, x, cy, radius * 1.5);
        if (season === 'spring') {
          canopyGrad.addColorStop(0, '#d9f99d'); canopyGrad.addColorStop(0.3, '#bef264'); canopyGrad.addColorStop(0.7, '#84cc16'); canopyGrad.addColorStop(1, '#4d7c0f');
        } else if (season === 'summer') {
          canopyGrad.addColorStop(0, '#86efac'); canopyGrad.addColorStop(0.3, '#4ade80'); canopyGrad.addColorStop(0.7, '#15803d'); canopyGrad.addColorStop(1, '#14532d');
        } else if (season === 'fall') {
          canopyGrad.addColorStop(0, '#fdba74'); canopyGrad.addColorStop(0.3, '#f97316'); canopyGrad.addColorStop(0.7, '#c2410c'); canopyGrad.addColorStop(1, '#7c2d12');
        } else { // winter
          canopyGrad.addColorStop(0, '#5eead4'); canopyGrad.addColorStop(0.3, '#14b8a6'); canopyGrad.addColorStop(0.7, '#0f766e'); canopyGrad.addColorStop(1, '#115e59');
        }
        
        ctx.fillStyle = canopyGrad;
        ctx.beginPath();
        ctx.arc(x, cy, radius, 0, Math.PI*2);
        ctx.arc(x - radius*0.6, cy + radius*0.3, radius*0.8, 0, Math.PI*2);
        ctx.arc(x + radius*0.6, cy + radius*0.3, radius*0.8, 0, Math.PI*2);
        ctx.arc(x, cy - radius*0.5, radius*0.9, 0, Math.PI*2);
        ctx.fill();

        // Snow on tree
        if (season === 'winter') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, cy - radius*0.5, radius*0.8, 0, Math.PI*2);
          ctx.arc(x - radius*0.5, cy + radius*0.1, radius*0.6, 0, Math.PI*2);
          ctx.arc(x + radius*0.5, cy + radius*0.1, radius*0.6, 0, Math.PI*2);
          ctx.fill();
        }
      } 
      else if (type === 'flower') {
        // Stem
        const stemGrad = ctx.createLinearGradient(x, y - 20*scale, x, y);
        stemGrad.addColorStop(0, '#4ade80'); stemGrad.addColorStop(1, '#14532d');
        ctx.strokeStyle = stemGrad;
        ctx.lineWidth = 3 * scale * sizeMod;
        ctx.beginPath();
        const stemH = 20 * scale * sizeMod;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - stemH);
        ctx.stroke();
        
        // Petals
        const numFlowers = Math.min(3, Math.ceil(level / 2));
        const size = (5 + level * 2) * scale * sizeMod;
        
        for(let f=0; f<numFlowers; f++) {
          const fx = x + (f-1)*15*scale*sizeMod * (numFlowers>1?1:0);
          const fy = y - stemH - (f===1?10*scale*sizeMod:0);
          
          if (season !== 'winter') {
            const petalGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, size);
            if (season === 'spring') {
              petalGrad.addColorStop(0, '#fbcfe8'); petalGrad.addColorStop(0.3, '#f472b6'); petalGrad.addColorStop(0.7, '#ec4899'); petalGrad.addColorStop(1, '#be185d');
            } else if (season === 'summer') {
              petalGrad.addColorStop(0, '#fef08a'); petalGrad.addColorStop(0.3, '#facc15'); petalGrad.addColorStop(0.7, '#eab308'); petalGrad.addColorStop(1, '#a16207');
            } else if (season === 'fall') {
              petalGrad.addColorStop(0, '#fed7aa'); petalGrad.addColorStop(0.3, '#fb923c'); petalGrad.addColorStop(0.7, '#ea580c'); petalGrad.addColorStop(1, '#9a3412');
            }
            ctx.fillStyle = petalGrad;
            for (let i = 0; i < 5; i++) {
              ctx.beginPath();
              const angle = (i * Math.PI * 2) / 5;
              ctx.arc(fx + Math.cos(angle)*size, fy + Math.sin(angle)*size, size, 0, Math.PI*2);
              ctx.fill();
            }
            ctx.fillStyle = '#a16207';
            ctx.beginPath();
            ctx.arc(fx, fy, size*0.7, 0, Math.PI*2);
            ctx.fill();
          } else {
            const winterGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, size);
            winterGrad.addColorStop(0, '#f4f4f5'); winterGrad.addColorStop(0.3, '#e4e4e7'); winterGrad.addColorStop(0.7, '#d4d4d8'); winterGrad.addColorStop(1, '#a1a1aa');
            ctx.fillStyle = winterGrad;
            ctx.beginPath();
            ctx.arc(fx, fy, size*0.5, 0, Math.PI*2);
            ctx.fill();
          }
        }
      }
      else if (type === 'grass') {
        const height = (10 + level * 6) * scale * sizeMod;
        const grassGrad = ctx.createLinearGradient(x, y - height, x, y);
        if (season === 'spring') {
          grassGrad.addColorStop(0, '#bbf7d0'); grassGrad.addColorStop(0.3, '#86efac'); grassGrad.addColorStop(0.7, '#4ade80'); grassGrad.addColorStop(1, '#22c55e');
        } else if (season === 'summer') {
          grassGrad.addColorStop(0, '#86efac'); grassGrad.addColorStop(0.3, '#4ade80'); grassGrad.addColorStop(0.7, '#22c55e'); grassGrad.addColorStop(1, '#16a34a');
        } else if (season === 'fall') {
          grassGrad.addColorStop(0, '#d9f99d'); grassGrad.addColorStop(0.3, '#bef264'); grassGrad.addColorStop(0.7, '#a3e635'); grassGrad.addColorStop(1, '#84cc16');
        } else { // winter
          grassGrad.addColorStop(0, '#ffffff'); grassGrad.addColorStop(0.3, '#f8fafc'); grassGrad.addColorStop(0.7, '#e2e8f0'); grassGrad.addColorStop(1, '#cbd5e1');
        }
        
        ctx.strokeStyle = grassGrad;
        ctx.lineWidth = 3 * scale * sizeMod;
        ctx.lineCap = 'round';
        
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 5 * scale * sizeMod, y);
          ctx.quadraticCurveTo(
            x + i * 8 * scale * sizeMod + (Math.sin(i)*5*scale*sizeMod), 
            y - height/2, 
            x + i * 12 * scale * sizeMod, 
            y - height
          );
          ctx.stroke();
        }
      }
      else if (type === 'decoration') {
        const { decType, seed } = obj;
        if (decType === 'sakura') {
          const grad = ctx.createRadialGradient(x, y, 0, x, y, 6 * scale);
          grad.addColorStop(0, '#fce7f3'); grad.addColorStop(0.5, '#fbcfe8'); grad.addColorStop(1, '#f472b6');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(x, y, 6 * scale, 3 * scale, pseudoRandom(seed) * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        } else if (decType === 'leaf') {
          const isRed = pseudoRandom(seed) > 0.5;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, 8 * scale);
          if (isRed) {
            grad.addColorStop(0, '#fca5a5'); grad.addColorStop(0.5, '#ef4444'); grad.addColorStop(1, '#991b1b');
          } else {
            grad.addColorStop(0, '#fde047'); grad.addColorStop(0.5, '#eab308'); grad.addColorStop(1, '#a16207');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(x, y, 8 * scale, 4 * scale, pseudoRandom(seed) * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        } else if (decType === 'snowman') {
          const bodyGrad = ctx.createRadialGradient(x - 5*scale, y - 15*scale, 0, x, y - 15*scale, 18*scale);
          bodyGrad.addColorStop(0, '#ffffff'); bodyGrad.addColorStop(0.7, '#f1f5f9'); bodyGrad.addColorStop(1, '#cbd5e1');
          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.arc(x, y - 15*scale, 18*scale, 0, Math.PI*2);
          ctx.fill();
          
          const headGrad = ctx.createRadialGradient(x - 3*scale, y - 38*scale, 0, x, y - 38*scale, 14*scale);
          headGrad.addColorStop(0, '#ffffff'); headGrad.addColorStop(0.7, '#f1f5f9'); headGrad.addColorStop(1, '#cbd5e1');
          ctx.fillStyle = headGrad;
          ctx.beginPath();
          ctx.arc(x, y - 38*scale, 14*scale, 0, Math.PI*2);
          ctx.fill();
          
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(x - 5*scale, y - 40*scale, 2*scale, 0, Math.PI*2);
          ctx.arc(x + 5*scale, y - 40*scale, 2*scale, 0, Math.PI*2);
          ctx.fill();
          
          const noseGrad = ctx.createLinearGradient(x, y - 36*scale, x + 8*scale, y - 36*scale);
          noseGrad.addColorStop(0, '#f97316'); noseGrad.addColorStop(1, '#c2410c');
          ctx.fillStyle = noseGrad;
          ctx.beginPath();
          ctx.moveTo(x, y - 38*scale);
          ctx.lineTo(x + 10*scale, y - 35*scale);
          ctx.lineTo(x, y - 34*scale);
          ctx.fill();
        } else if (decType === 'weed') {
          const height = 12 * scale;
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 2 * scale;
          ctx.lineCap = 'round';
          
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 3 * scale, y);
            ctx.quadraticCurveTo(
              x + i * 5 * scale + (Math.sin(i)*2*scale), 
              y - height/2, 
              x + i * 6 * scale, 
              y - height
            );
            ctx.stroke();
          }
        }
      }
      else if (type === 'house') {
        const w = 120 * scale;
        const h = 100 * scale;
        
        // Wall
        ctx.fillStyle = season === 'winter' ? '#e2e8f0' : '#fef3c7';
        ctx.fillRect(x - w/2, y - h, w, h);
        
        // Roof
        ctx.fillStyle = season === 'winter' ? '#f8fafc' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(x - w/2 - 10*scale, y - h);
        ctx.lineTo(x, y - h - 60*scale);
        ctx.lineTo(x + w/2 + 10*scale, y - h);
        ctx.closePath();
        ctx.fill();
        
        // Door
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 15*scale, y - 40*scale, 30*scale, 40*scale);
        
        // Window
        ctx.fillStyle = season === 'winter' ? '#bae6fd' : '#fef08a';
        ctx.fillRect(x - 40*scale, y - 70*scale, 25*scale, 25*scale);
        ctx.fillRect(x + 15*scale, y - 70*scale, 25*scale, 25*scale);
      }
    });

    // 6. Draw Insects (Always on top)
    objects.forEach(obj => {
      if (obj.type !== 'insect') return;
      
      const { x, y, scale, insect, state } = obj;
      
      ctx.globalAlpha = 1; // Insects should be fully opaque to stand out
      
      const fontSize = Math.max(16, 36 * scale);
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Glow/Background for visibility
      ctx.beginPath();
      ctx.arc(x, y - 10*scale, fontSize*0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
      ctx.stroke();

      ctx.fillText(insect.emoji, x, y - 10*scale);
      
      // State text
      ctx.font = `bold ${Math.max(10, 14 * scale)}px Arial`;
      ctx.fillStyle = '#1f2937';
      
      // Text outline
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'white';
      ctx.strokeText(state, x, y + fontSize*0.6);
      ctx.fillText(state, x, y + fontSize*0.6);
    });

    ctx.globalAlpha = 1;

  }, [grid, season, appearedInsects]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onTileClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    const vx = canvas.width / 2;
    const vy = -150;
    
    const project = (col: number, row: number) => {
      const z = 6 - row; 
      const scale = 1 / (z * 0.2 + 1);
      const x = vx + (col - 2.5) * 140 * scale;
      const y = vy + 600 * scale;
      return { x, y };
    };

    // Check which polygon was clicked
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = 24; i >= 0; i--) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      
      const p1 = project(col, row);
      const p2 = project(col + 1, row);
      const p3 = project(col + 1, row + 1);
      const p4 = project(col, row + 1);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();

      if (ctx.isPointInPath(clickX, clickY)) {
        onTileClick(i);
        break;
      }
    }
  };

  return (
    <canvas 
      ref={canvasRef}
      width={500}
      height={500}
      onClick={handleCanvasClick}
      className={`w-full max-w-[400px] aspect-square rounded-2xl shadow-lg mx-auto ${interactive ? 'cursor-pointer' : ''}`}
      style={{ touchAction: 'none' }}
    />
  );
};
