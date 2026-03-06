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
    ctx.fillStyle = season === 'winter' ? '#f8fafc' : '#84cc16';
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // 3. Draw Grid Polygons (Seamless blending)
    // First pass: Draw base colors with slight overlap to prevent gaps
    grid.forEach((tile, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      
      // Expand polygons slightly for overlap
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

      // Colors
      let fillColor = '#a3e635'; // grass default
      if (tile.type === 'dirt') fillColor = season === 'winter' ? '#e2e8f0' : '#d97706';
      else if (tile.type === 'pond') fillColor = season === 'winter' ? '#bae6fd' : '#3b82f6';
      else if (tile.type === 'grass') {
        if (season === 'winter') fillColor = '#f1f5f9';
        else if (season === 'fall') fillColor = '#bef264';
        else if (season === 'spring') fillColor = '#86efac';
        else fillColor = '#4ade80';
      }
      else if (tile.type === 'tree' || tile.type === 'flower') {
        fillColor = season === 'winter' ? '#f1f5f9' : '#86efac';
      }

      ctx.fillStyle = fillColor;
      ctx.fill();
    });

    // Second pass: Draw soft gradients at edges to blend tiles
    grid.forEach((tile, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      
      if (tile.type === 'pond') {
        const center = project(col + 0.5, row + 0.5);
        const gradient = ctx.createRadialGradient(
          center.x, center.y, 0,
          center.x, center.y, 60 * center.scale
        );
        const pondColor = season === 'winter' ? '#bae6fd' : '#3b82f6';
        gradient.addColorStop(0.5, pondColor);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)'); // fade out
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, 70 * center.scale, 35 * center.scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

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

    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

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

    // Sort by Y (Back to Front)
    objects.sort((a, b) => a.y - b.y);

    // 5. Draw Environment Objects
    objects.forEach(obj => {
      if (obj.type === 'insect') return;
      
      const { x, y, scale, type, level, sizeMod } = obj;

      // Atmospheric perspective (fade out objects in the back slightly)
      ctx.globalAlpha = Math.min(1, 0.4 + scale * 0.8);

      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(x, y, 30 * scale * sizeMod, 10 * scale * sizeMod, 0, 0, Math.PI * 2);
      ctx.fill();

      if (type === 'tree') {
        // Trunk
        ctx.fillStyle = '#78350f';
        const trunkW = (10 + level * 2) * scale * sizeMod;
        const trunkH = (20 + level * 8) * scale * sizeMod;
        ctx.fillRect(x - trunkW/2, y - trunkH, trunkW, trunkH);
        
        // Canopy
        let canopyColor = '#15803d'; // summer
        if (season === 'spring') canopyColor = '#84cc16';
        else if (season === 'fall') canopyColor = '#ea580c';
        else if (season === 'winter') canopyColor = '#0f766e'; // dark evergreen

        const radius = (15 + level * 6) * scale * sizeMod;
        const cy = y - trunkH;
        
        ctx.fillStyle = canopyColor;
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
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3 * scale * sizeMod;
        ctx.beginPath();
        const stemH = 20 * scale * sizeMod;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - stemH);
        ctx.stroke();
        
        // Petals
        let petalColor = '#facc15';
        if (season === 'spring') petalColor = '#f472b6';
        else if (season === 'fall') petalColor = '#fb923c';
        else if (season === 'winter') petalColor = '#e5e5e5';

        const numFlowers = Math.min(3, Math.ceil(level / 2));
        const size = (5 + level * 2) * scale * sizeMod;
        
        for(let f=0; f<numFlowers; f++) {
          const fx = x + (f-1)*15*scale*sizeMod * (numFlowers>1?1:0);
          const fy = y - stemH - (f===1?10*scale*sizeMod:0);
          
          if (season !== 'winter') {
            ctx.fillStyle = petalColor;
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
            ctx.fillStyle = '#d4d4d8';
            ctx.beginPath();
            ctx.arc(fx, fy, size*0.5, 0, Math.PI*2);
            ctx.fill();
          }
        }
      }
      else if (type === 'grass') {
        let grassColor = '#22c55e';
        if (season === 'spring') grassColor = '#4ade80';
        else if (season === 'fall') grassColor = '#84cc16';
        else if (season === 'winter') grassColor = '#e2e8f0';

        const height = (10 + level * 6) * scale * sizeMod;
        ctx.strokeStyle = grassColor;
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
