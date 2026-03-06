import React, { useState } from 'react';
import { Tile, ACTIONS, ActionType } from '../game/data';
import { CanvasMap } from './CanvasMap';

export const PlayScreen = ({ year, grid, onAction }: { year: number, grid: Tile[], onAction: (action: ActionType, plan: string) => void }) => {
  const [plan, setPlan] = useState('');

  return (
    <div className="flex flex-col h-screen p-4 bg-green-50 overflow-y-auto">
      <div className="text-center mb-4 mt-2">
        <h2 className="text-2xl font-bold text-green-800">{year}年目</h2>
      </div>

      <div className="mb-6">
        <CanvasMap grid={grid} season="summer" />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
        <h3 className="text-sm font-bold text-stone-700 mb-2">今年の計画（自由入力）</h3>
        <textarea
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="例：今年は水辺を豊かにして、きれいな花を咲かせたいな。"
          className="w-full h-24 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
        />
        <p className="text-xs text-stone-400 mt-1 text-right">※キーワードで隠し効果があるかも？</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
        <h3 className="text-sm font-bold text-stone-700 mb-3">アクションを選択</h3>
        <div className="space-y-2">
          {ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => onAction(action.id, plan)}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-green-400 hover:bg-green-50 transition-colors flex flex-col"
            >
              <span className="font-bold text-green-800">{action.name}</span>
              <span className="text-xs text-stone-500 mt-1">{action.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
