import React, { useState } from 'react';
import { Tile, TileType, TILE_EMOJIS } from '../game/data';
import { CanvasMap } from './CanvasMap';

export const PlacementScreen = ({ initialGrid, onComplete }: { initialGrid: Tile[], onComplete: (grid: Tile[]) => void }) => {
  const [grid, setGrid] = useState<Tile[]>(initialGrid);
  const [selectedTool, setSelectedTool] = useState<TileType>('tree');

  const handleTileClick = (index: number) => {
    const newGrid = [...grid];
    newGrid[index] = { type: selectedTool, level: 1 };
    setGrid(newGrid);
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-green-50 overflow-y-auto">
      <div className="text-center mb-4 mt-2">
        <h2 className="text-2xl font-bold text-green-800">1年目：公園づくり</h2>
        <p className="text-sm text-stone-600 mt-1">好きなものを配置して公園の基礎を作ろう</p>
      </div>

      <div className="mb-4">
        <CanvasMap grid={grid} onTileClick={handleTileClick} interactive={true} season="spring" />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
        <h3 className="text-sm font-bold text-stone-500 mb-3 text-center">配置ツール</h3>
        <div className="flex justify-center gap-2 flex-wrap">
          {(Object.entries(TILE_EMOJIS) as [TileType, string][]).map(([type, emoji]) => (
            <button
              key={type}
              onClick={() => setSelectedTool(type as TileType)}
              className={`w-12 h-12 sm:w-14 sm:h-14 text-2xl rounded-xl flex items-center justify-center transition-all ${
                selectedTool === type 
                  ? 'bg-green-200 ring-2 ring-green-500 scale-110 shadow-md' 
                  : 'bg-stone-100 hover:bg-stone-200'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => onComplete(grid)}
        className="w-full bg-green-600 hover:bg-green-500 text-white text-lg font-bold py-4 rounded-2xl shadow-lg transform transition active:scale-95 mt-auto shrink-0"
      >
        この配置で開始する
      </button>
    </div>
  );
};
