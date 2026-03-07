import React from 'react';
import { INSECTS } from '../game/data';
import { Book, RotateCcw } from 'lucide-react';

export const EndingScreen = ({ discovered, insectCounts, onRestart, onOpenEncyclopedia }: { discovered: string[], insectCounts: Record<string, number>, onRestart: () => void, onOpenEncyclopedia: () => void }) => {
  const progress = Math.round((discovered.length / INSECTS.length) * 100);
  
  let rank = 'C';
  let message = 'はじまりの庭。これからの成長が楽しみな公園';
  if (progress === 100) { rank = 'S'; message = '生命の奇跡！完璧なる原始の森の再現'; }
  else if (progress >= 70) { rank = 'A'; message = '虫たちの楽園！活気あふれるビオトープ'; }
  else if (progress >= 40) { rank = 'B'; message = '自然との共生。憩いの昆虫ガーデン'; }

  let mostFrequentId = INSECTS[0].id;
  let maxScore = -1;
  
  Object.entries(insectCounts).forEach(([id, count]) => {
    const insect = INSECTS.find(i => i.id === id);
    const rarity = insect ? insect.rarity : 1;
    // スコア = 出現回数 × レア度
    const score = count * rarity;
    
    const currentBestInsect = INSECTS.find(i => i.id === mostFrequentId);
    const currentBestRarity = currentBestInsect ? currentBestInsect.rarity : 1;

    // スコアが高い、または同点でもレア度が高い方を優先する
    if (score > maxScore || (score === maxScore && rarity > currentBestRarity)) {
      maxScore = score;
      mostFrequentId = id;
    }
  });
  
  if (maxScore === -1 && discovered.length > 0) {
    mostFrequentId = discovered[0];
  }
  
  const mostFrequentInsect = INSECTS.find(i => i.id === mostFrequentId) || INSECTS[0];
  
  let lvl = 1;
  if (progress >= 90) lvl = 3;
  else if (progress >= 70) lvl = 2;
  
  const imageFilename = `${mostFrequentInsect.id}_lvl${lvl}.png`;

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gradient-to-b from-green-50 to-green-200 overflow-y-auto">
      <div className="text-2xl font-black text-green-800 mb-1 tracking-widest">ランク {rank}</div>
      <h2 className="text-xl font-bold text-green-700 mb-6 drop-shadow-sm">{message}</h2>
      
      <div className="bg-white p-6 rounded-3xl shadow-lg mb-6 w-full max-w-sm flex flex-col items-center">
        <h3 className="text-sm font-bold text-stone-500 mb-3">図鑑コンプリート率</h3>
        <div className="text-4xl font-black text-green-600 mb-6">{progress}<span className="text-xl">%</span></div>
        
        <div className="w-32 h-32 bg-stone-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border-4 border-green-100 relative">
          <img 
            src={imageFilename} 
            alt={mostFrequentInsect.name} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                const fallback = document.createElement('div');
                fallback.className = 'text-6xl absolute inset-0 flex items-center justify-center';
                fallback.innerText = mostFrequentInsect.emoji;
                e.currentTarget.parentElement.appendChild(fallback);
              }
            }} 
          />
        </div>
        <p className="text-sm font-bold text-stone-700 text-center leading-relaxed">
          あなたのパークを象徴する、最高レベルの<br/><span className="text-green-600 text-base">{mostFrequentInsect.name}</span>が現れました！
        </p>
        <p className="text-[10px] text-stone-400 mt-2 break-all">({imageFilename})</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-auto shrink-0">
        <button 
          onClick={onOpenEncyclopedia}
          className="bg-stone-800 hover:bg-stone-700 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
        >
          <Book size={20} />
          最終結果を図鑑で見る
        </button>
        
        <button 
          onClick={onRestart}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          最初から遊ぶ
        </button>
      </div>
    </div>
  );
};
