import React from 'react';
import { INSECTS } from '../game/data';
import { X, BookOpen } from 'lucide-react';

export const Encyclopedia = ({ discovered, onClose }: { discovered: string[], onClose: () => void }) => {
  const progress = Math.round((discovered.length / INSECTS.length) * 100);

  return (
    <div className="absolute inset-0 bg-stone-50 z-50 flex flex-col h-full overflow-hidden">
      <div className="bg-green-700 text-white p-4 flex items-center justify-between shadow-md shrink-0">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} /> 昆虫図鑑</h2>
          <div className="text-xs text-green-200 mt-1">
            収集率: {progress}% ({discovered.length}/{INSECTS.length})
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-green-600 rounded-full transition">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {INSECTS.map(insect => {
          const isDiscovered = discovered.includes(insect.id);
          
          return (
            <div 
              key={insect.id} 
              className={`p-4 rounded-2xl border ${isDiscovered ? 'bg-white border-green-200 shadow-sm' : 'bg-stone-100 border-stone-200 opacity-80'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl shrink-0 ${isDiscovered ? 'bg-green-50 shadow-inner' : 'bg-stone-200 grayscale'}`}>
                  {isDiscovered ? insect.emoji : '❓'}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 ${isDiscovered ? 'text-green-900' : 'text-stone-500'}`}>
                    {isDiscovered ? insect.name : '？？？'}
                  </h3>
                  
                  {!isDiscovered && (
                    <div className="text-xs text-stone-600 bg-stone-200/50 p-2 rounded-lg mt-2">
                      <p className="font-bold mb-1 text-stone-500">💡 ヒント</p>
                      <p>{insect.hint}</p>
                    </div>
                  )}
                  
                  {isDiscovered && (
                    <div className="text-xs text-stone-600 mt-2">
                      <p className="font-medium text-green-700 mb-1">生息環境</p>
                      <p>{insect.hint}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
