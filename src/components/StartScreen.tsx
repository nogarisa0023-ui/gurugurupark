import React from 'react';
import { Book } from 'lucide-react';

export const StartScreen = ({ onStart, onOpenEncyclopedia }: { onStart: () => void, onOpenEncyclopedia: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gradient-to-b from-green-100 to-green-300">
      <div className="text-6xl mb-4 animate-bounce">🌳🪲🌻</div>
      <h1 className="text-4xl font-bold text-green-800 mb-2 drop-shadow-sm">ぐるぐる昆虫パーク</h1>
      <p className="text-green-700 mb-8 font-medium">5年かけて最高の公園を作ろう！</p>
      
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm mb-8 text-left text-sm text-stone-600 space-y-2">
        <p>🌱 <strong>遊び方</strong></p>
        <p>1. 最初に公園のレイアウトを決めます。</p>
        <p>2. 毎年、計画を立ててアクションを選びます。</p>
        <p>3. 環境に合わせて色々な昆虫がやってきます！</p>
        <p>4. 5年間で図鑑コンプリートを目指そう！</p>
      </div>

      <button 
        onClick={onStart}
        className="bg-green-600 hover:bg-green-500 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 mb-4"
      >
        ゲームスタート
      </button>
      
      <button 
        onClick={onOpenEncyclopedia}
        className="flex items-center gap-2 text-green-700 hover:text-green-900 font-medium py-2 px-4 rounded-full hover:bg-green-200/50 transition"
      >
        <Book size={20} />
        図鑑を見る
      </button>
    </div>
  );
};
