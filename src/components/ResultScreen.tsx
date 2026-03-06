import React, { useState } from 'react';
import { Tile, INSECTS, Combo, Season } from '../game/data';
import { CanvasMap } from './CanvasMap';
import { Book, ChevronRight } from 'lucide-react';

export const ResultScreen = ({ year, grid, appearedInsects, combos, onNext, onOpenEncyclopedia }: { year: number, grid: Tile[], appearedInsects: string[], combos: Combo[], onNext: () => void, onOpenEncyclopedia: () => void }) => {
  const [season, setSeason] = useState<Season>('summer');
  
  const seasonLabels: Record<Season, string> = {
    spring: '春🌸',
    summer: '夏🌻',
    fall: '秋🍁',
    winter: '冬❄️'
  };

  const appearedInsectData = INSECTS.filter(i => appearedInsects.includes(i.id));

  return (
    <div className="flex flex-col h-screen p-4 bg-green-50 overflow-y-auto">
      <div className="text-center mb-4 mt-2">
        <h2 className="text-2xl font-bold text-green-800">{year}年目の結果</h2>
      </div>

      <div className="mb-4">
        <CanvasMap grid={grid} season={season} appearedInsects={appearedInsects} />
      </div>

      {combos.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-2xl mb-4 shadow-sm">
          <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-1">✨ ボーナス発生！</h3>
          <div className="space-y-2">
            {combos.map(combo => (
              <div key={combo.id} className="bg-white/60 p-2 rounded-lg">
                <div className="font-bold text-yellow-900 text-sm">{combo.name}</div>
                <div className="text-xs text-yellow-800 mt-1">{combo.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-stone-700">やってきた昆虫</h3>
          <div className="flex bg-stone-100 rounded-lg p-1">
            {(Object.keys(seasonLabels) as Season[]).map(s => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${season === s ? 'bg-white shadow-sm font-bold text-green-700' : 'text-stone-500 hover:text-stone-700'}`}
              >
                {seasonLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {appearedInsectData.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-sm">
            今年は昆虫が来なかったみたい…<br/>環境を整えてみよう！
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {appearedInsectData.map(insect => {
              const state = insect.stages[season];
              if (state === 'なし') return null;
              return (
                <div key={insect.id} className="bg-stone-50 p-2 rounded-xl border border-stone-100 flex items-center gap-2">
                  <div className="text-2xl bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    {insect.emoji}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-700">{insect.name}</span>
                    <span className="text-[10px] text-green-600 font-medium bg-green-100 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                      {state}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <button 
          onClick={onOpenEncyclopedia}
          className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2"
        >
          <Book size={20} />
          図鑑
        </button>
        <button 
          onClick={onNext}
          className="flex-[2] bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-1"
        >
          {year >= 5 ? 'エンディングへ' : '次の年へ'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
