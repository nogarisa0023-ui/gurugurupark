import React, { useState } from 'react';
import { Tile, INSECTS, COMBOS, ACTIONS, calculateHiddenPoints, getMapStats, ActionType, Combo } from './game/data';
import { StartScreen } from './components/StartScreen';
import { PlacementScreen } from './components/PlacementScreen';
import { PlayScreen } from './components/PlayScreen';
import { ResultScreen } from './components/ResultScreen';
import { Encyclopedia } from './components/Encyclopedia';
import { EndingScreen } from './components/EndingScreen';

export type ScreenType = 'start' | 'placement' | 'play' | 'result' | 'encyclopedia' | 'ending';

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('start');
  const [year, setYear] = useState(1);
  const [grid, setGrid] = useState<Tile[]>(Array(25).fill({ type: 'dirt', level: 1 }));
  const [discoveredInsects, setDiscoveredInsects] = useState<string[]>([]);
  const [insectCounts, setInsectCounts] = useState<Record<string, number>>({});
  const [currentYearInsects, setCurrentYearInsects] = useState<string[]>([]);
  const [currentCombos, setCurrentCombos] = useState<Combo[]>([]);
  const [planText, setPlanText] = useState('');
  const [encyclopediaReturnScreen, setEncyclopediaReturnScreen] = useState<ScreenType>('start');

  const startGame = () => {
    setYear(1);
    setGrid(Array(25).fill({ type: 'dirt', level: 1 }));
    setDiscoveredInsects([]);
    setInsectCounts({});
    setScreen('placement');
  };

  const finishPlacement = (newGrid: Tile[]) => {
    setGrid(newGrid);
    setScreen('play');
  };

  const executeAction = (action: ActionType, plan: string) => {
    setPlanText(plan);
    const hiddenPoints = calculateHiddenPoints(plan);
    
    // Apply action to grid
    let newGrid = grid.map(tile => {
      const newTile = { ...tile };
      switch (action) {
        case 'water':
          if (tile.type === 'pond' || tile.type === 'flower') newTile.level = Math.min(5, tile.level + 1);
          break;
        case 'fertilize':
          if (tile.type === 'tree' || tile.type === 'flower') newTile.level = Math.min(5, tile.level + 1);
          break;
        case 'mow':
          if (tile.type === 'grass') newTile.level = 1;
          break;
        case 'plant':
          if (tile.type === 'dirt' && Math.random() > 0.5) {
            newTile.type = Math.random() > 0.5 ? 'grass' : 'flower';
            newTile.level = 1;
          }
          break;
        case 'observe':
          if (tile.type !== 'dirt' && tile.type !== 'pond') {
            if (Math.random() > 0.3) newTile.level = Math.min(5, tile.level + 1);
          }
          break;
      }
      
      // Natural growth
      if (newTile.type === 'grass' && action !== 'mow') {
        newTile.level = Math.min(5, newTile.level + 1);
      }
      if (newTile.type === 'tree' && action !== 'fertilize') {
         if (Math.random() > 0.5) newTile.level = Math.min(5, newTile.level + 1);
      }
      return newTile;
    });

    setGrid(newGrid);

    // Evaluate insects
    const stats = getMapStats(newGrid, hiddenPoints);
    const appearedInsects = INSECTS.filter(insect => insect.checkAppearance(stats, newGrid)).map(i => i.id);
    setCurrentYearInsects(appearedInsects);

    // Update discovered
    setDiscoveredInsects(prev => Array.from(new Set([...prev, ...appearedInsects])));
    
    // Update counts
    setInsectCounts(prev => {
      const next = { ...prev };
      appearedInsects.forEach(id => {
        next[id] = (next[id] || 0) + 1;
      });
      return next;
    });

    // Evaluate combos
    const combos = COMBOS.filter(combo => combo.check(stats, appearedInsects));
    setCurrentCombos(combos);

    setScreen('result');
  };

  const nextYear = () => {
    if (year >= 5) {
      setScreen('ending');
    } else {
      setYear(year + 1);
      setPlanText('');
      setScreen('play');
    }
  };

  const openEncyclopedia = (returnTo: ScreenType) => {
    setEncyclopediaReturnScreen(returnTo);
    setScreen('encyclopedia');
  };

  const closeEncyclopedia = () => {
    setScreen(encyclopediaReturnScreen);
  };

  return (
    <div className="min-h-screen bg-green-50 text-stone-800 font-sans selection:bg-green-200">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
        {screen === 'start' && <StartScreen onStart={startGame} onOpenEncyclopedia={() => openEncyclopedia('start')} />}
        {screen === 'placement' && <PlacementScreen initialGrid={grid} onComplete={finishPlacement} />}
        {screen === 'play' && <PlayScreen year={year} grid={grid} onAction={executeAction} />}
        {screen === 'result' && <ResultScreen year={year} grid={grid} appearedInsects={currentYearInsects} combos={currentCombos} onNext={nextYear} onOpenEncyclopedia={() => openEncyclopedia('result')} />}
        {screen === 'encyclopedia' && <Encyclopedia discovered={discoveredInsects} onClose={closeEncyclopedia} />}
        {screen === 'ending' && <EndingScreen discovered={discoveredInsects} insectCounts={insectCounts} onRestart={startGame} onOpenEncyclopedia={() => openEncyclopedia('ending')} />}
      </div>
    </div>
  );
}
