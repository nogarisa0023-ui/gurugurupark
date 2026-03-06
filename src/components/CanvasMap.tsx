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

    // Perspective settings
    const vx = width / 2;
    const vy = 50; // Vanishing point
    
    const project = (col: number, row: number) => {
      const z = 5 - row; 
      const scale = 1 / (z * 0.35 + 1);
      const x = vx + (col - 2.5) * 180 * scale;
      const y = vy + 450 * scale;
      return { x, y, scale };
    };

    // 1. Draw Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 250);
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
    ctx.fillRect(0, 0, width, 250);

    // Draw Clouds (Summer)
    if (season === 'summer') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(100, 100, 30, 0, Math.PI*2);
      ctx.arc(140, 100, 40, 0, Math.PI*2);
      ctx.arc(180, 110, 30, 0, Math.PI*2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(400, 80, 25, 0, Math.PI*2);
      ctx.arc(430, 70, 35, 0, Math.PI*2);
      ctx.arc(460, 80, 25, 0, Math.PI*2);
      ctx.fill();
    }

    // 2. Draw Ground Base (to fill the horizon gap)
    const horizonY = project(0, 0).y;
    ctx.fillStyle = season === 'winter' ? '#f8fafc' : '#84cc16';
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // 3. Draw Grid Polygons
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
        // Base under tree/flower is grass
        fillColor = season === 'winter' ? '#f1f5f9' : '#86efac';
      }

      ctx.fillStyle = fillColor;
      ctx.fill();
      
      // Grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 4. Collect Objects for Y-Sorting
    const objects: any[] = [];

    grid.forEach((tile, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const center = project(col + 0.5, row + 0.5);

      if (tile.type === 'tree' || tile.type === 'flower') {
        objects.push({ type: tile.type, level: tile.level, ...center });
      } else if (tile.type === 'grass' && tile.level > 1) {
        objects.push({ type: 'grass', level: tile.level, ...center });
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
        objects.push({ type: 'insect', insect: ins, state, ...pos });
      });
    });

    // Sort by Y (Back to Front)
    objects.sort((a, b) => a.y - b.y);

    // 5. Draw Objects
    objects.forEach(obj => {
      const { x, y, scale, type, level, insect, state } = obj;

      // Atmospheric perspective (fade out objects in the back slightly)
      ctx.globalAlpha = Math.min(1, 0.4 + scale * 0.8);

      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(x, y, 30 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      if (type === 'tree') {
        // Trunk
        ctx.fillStyle = '#78350f';
        const trunkW = (10 + level * 2) * scale;
        const trunkH = (20 + level * 8) * scale;
        ctx.fillRect(x - trunkW/2, y - trunkH, trunkW, trunkH);
        
        // Canopy
        let canopyColor = '#15803d'; // summer
        if (season === 'spring') canopyColor = '#84cc16';
        else if (season === 'fall') canopyColor = '#ea580c';
        else if (season === 'winter') canopyColor = '#0f766e'; // dark evergreen

        const radius = (15 + level * 6) * scale;
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
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        const stemH = 20 * scale;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - stemH);
        ctx.stroke();
        
        // Petals
        let petalColor = '#facc15';
        if (season === 'spring') petalColor = '#f472b6';
        else if (season === 'fall') petalColor = '#fb923c';
        else if (season === 'winter') petalColor = '#e5e5e5';

        const numFlowers = Math.min(3, Math.ceil(level / 2));
        const size = (5 + level * 2) * scale;
        
        for(let f=0; f<numFlowers; f++) {
          const fx = x + (f-1)*15*scale * (numFlowers>1?1:0);
          const fy = y - stemH - (f===1?10*scale:0);
          
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

        const height = (10 + level * 6) * scale;
        ctx.strokeStyle = grassColor;
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = 'round';
        
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 5 * scale, y);
          ctx.quadraticCurveTo(
            x + i * 8 * scale + (Math.sin(i)*5*scale), 
            y - height/2, 
            x + i * 12 * scale, 
            y - height
          );
          ctx.stroke();
        }
      }
      else if (type === 'insect') {
        // Draw insect
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
      }
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
    const vy = 50;
    
    const project = (col: number, row: number) => {
      const z = 5 - row; 
      const scale = 1 / (z * 0.35 + 1);
      const x = vx + (col - 2.5) * 180 * scale;
      const y = vy + 450 * scale;
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
