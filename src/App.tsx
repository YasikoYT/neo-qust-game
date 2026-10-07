/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, startTransition } from 'react';
import { GameState, Difficulty, PlayerStats, SpaceshipSkin } from './types';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';
import { SkinSelector } from './components/SkinSelector';
import { sfx } from './audio';

const INITIAL_SKINS: SpaceshipSkin[] = [
  {
    id: 'blue_raider',
    name: 'Moviy Reyder',
    color: '#06b6d4',
    wingColor: '#0891b2',
    glowColor: '#38bdf8',
    price: 0,
    unlocked: true,
    description: "Klassik standart modifikatsiyadagi tezkor neon-ko'k kema.",
  },
  {
    id: 'solar_flare',
    name: 'Quyosh To\'lqini',
    color: '#f59e0b',
    wingColor: '#ea580c',
    glowColor: '#f43f5e',
    price: 15,
    unlocked: false,
    description: "Quyosh plazmasi va yong'in izlari bilan jihozlangan tilla tusli kema.",
  },
  {
    id: 'cyber_ghost',
    name: 'Kiber Sharpa',
    color: '#d946ef',
    wingColor: '#a21caf',
    glowColor: '#c084fc',
    price: 35,
    unlocked: false,
    description: "Pushti va binafsha neon chiroqlarga ega maxfiy kiber-texnik kema.",
  },
  {
    id: 'emerald_phantom',
    name: 'Zumrad Yashil',
    color: '#10b981',
    wingColor: '#059669',
    glowColor: '#34d399',
    price: 60,
    unlocked: false,
    description: "Zaharli plazma reaktiv dvigateli bilan ishlaydigan zumradli kema.",
  },
  {
    id: 'dark_matter',
    name: 'Qora Materiya',
    color: '#334155',
    wingColor: '#e11d48',
    glowColor: '#ff0055',
    price: 100,
    unlocked: false,
    description: "Gravitatsion qora materiya va qizil lazer qanotlariga ega afsonaviy kema.",
  },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [activeSkinId, setActiveSkinId] = useState<string>('blue_raider');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);

  const [totalCrystals, setTotalCrystals] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [isSkinsOpen, setIsSkinsOpen] = useState<boolean>(false);

  // Loaded skins array
  const [skins, setSkins] = useState<SpaceshipSkin[]>(INITIAL_SKINS);

  // Running gameplay statistics (updated continuously from the Three.js canvas loop)
  const [currentStats, setCurrentStats] = useState<PlayerStats>({
    score: 0,
    highScore: 0,
    crystals: 0,
    sessionCrystals: 0,
    energy: 100,
    shields: 3,
    speed: 1.0,
    distance: 0,
    multiplier: 1,
  });

  // --- 1. LOAD PERSISTED DATA FROM LOCAL STORAGE ON MOUNT ---
  useEffect(() => {
    try {
      const savedHighScore = localStorage.getItem('neon_high_score');
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }

      const savedCrystals = localStorage.getItem('neon_total_crystals');
      if (savedCrystals) {
        setTotalCrystals(parseInt(savedCrystals, 10));
      }

      const savedSkinId = localStorage.getItem('neon_active_skin_id');
      if (savedSkinId) {
        setActiveSkinId(savedSkinId);
      }

      const savedUnlockedSkins = localStorage.getItem('neon_unlocked_skins');
      if (savedUnlockedSkins) {
        const unlockedIds: string[] = JSON.parse(savedUnlockedSkins);
        setSkins((prev) =>
          prev.map((s) => ({
            ...s,
            unlocked: unlockedIds.includes(s.id) || s.id === 'blue_raider',
          }))
        );
      }
    } catch (e) {
      console.warn('Failed to load local storage', e);
    }
  }, []);

  // Sync SFX state directly with state changes
  useEffect(() => {
    sfx.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    sfx.musicEnabled = musicEnabled;
    if (musicEnabled && gameState === GameState.PLAYING) {
      sfx.startMusic();
    } else {
      sfx.stopMusic();
    }
  }, [musicEnabled, gameState]);

  // Handle active skin loading helper
  const activeSkin = skins.find((s) => s.id === activeSkinId) || skins[0];

  // --- 2. GAME ACTION HANDLERS ---
  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
    setIsNewRecord(false);
    setCurrentStats({
      score: 0,
      highScore,
      crystals: 0,
      sessionCrystals: 0,
      energy: 100,
      shields: 3,
      speed: 1.0,
      distance: 0,
      multiplier: 1,
    });
    
    // Launch engine sounds & background techno loop
    sfx.startEngineHum();
    if (musicEnabled) {
      sfx.startMusic();
    }
  };

  const handleGameOver = (finalStats: PlayerStats) => {
    sfx.stopEngineHum();
    sfx.stopMusic();

    let recordBreaker = false;
    let newHighScore = highScore;

    if (finalStats.score > highScore) {
      recordBreaker = true;
      newHighScore = finalStats.score;
      setHighScore(newHighScore);
      localStorage.setItem('neon_high_score', newHighScore.toString());
    }

    const updatedCrystals = totalCrystals + finalStats.sessionCrystals;
    setTotalCrystals(updatedCrystals);
    localStorage.setItem('neon_total_crystals', updatedCrystals.toString());

    startTransition(() => {
      setIsNewRecord(recordBreaker);
      setGameState(GameState.GAMEOVER);
      setCurrentStats((prev) => ({
        ...prev,
        score: finalStats.score,
        highScore: newHighScore,
        sessionCrystals: finalStats.sessionCrystals,
        distance: finalStats.distance,
      }));
    });
  };

  const handleTogglePause = () => {
    if (gameState !== GameState.PLAYING) return;
    
    setGameState((prev) => {
      const nextState = prev === GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING;
      if (nextState === GameState.PAUSED) {
        sfx.stopEngineHum();
        sfx.stopMusic();
      } else {
        sfx.startEngineHum();
        if (musicEnabled) {
          sfx.startMusic();
        }
      }
      return nextState;
    });
  };

  const handleSelectSkin = (id: string) => {
    setActiveSkinId(id);
    localStorage.setItem('neon_active_skin_id', id);
  };

  const handleUnlockSkin = (id: string, price: number) => {
    const updatedCrystals = totalCrystals - price;
    setTotalCrystals(updatedCrystals);
    localStorage.setItem('neon_total_crystals', updatedCrystals.toString());

    const updatedSkins = skins.map((s) => (s.id === id ? { ...s, unlocked: true } : s));
    setSkins(updatedSkins);

    const unlockedIds = updatedSkins.filter((s) => s.unlocked).map((s) => s.id);
    localStorage.setItem('neon_unlocked_skins', JSON.stringify(unlockedIds));
  };

  return (
    <main id="app-container" className="relative w-screen h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans">
      
      {/* 3D Render Engine Canvas */}
      <GameCanvas
        gameState={gameState}
        difficulty={difficulty}
        activeSkin={activeSkin}
        isPaused={gameState === GameState.PAUSED}
        onStatsUpdate={setCurrentStats}
        onGameOver={handleGameOver}
      />

      {/* Title Menu Overlay */}
      {gameState === GameState.MENU && (
        <MainMenu
          difficulty={difficulty}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          activeSkin={activeSkin}
          onStartGame={handleStartGame}
          onChangeDifficulty={setDifficulty}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onToggleMusic={() => setMusicEnabled(!musicEnabled)}
          onOpenSkins={() => setIsSkinsOpen(true)}
        />
      )}

      {/* Live In-Game HUD (Visible during gameplay or pause) */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <GameHUD
          stats={currentStats}
          isPaused={gameState === GameState.PAUSED}
          onTogglePause={handleTogglePause}
        />
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAMEOVER && (
        <GameOver
          stats={{ ...currentStats, highScore }}
          isNewRecord={isNewRecord}
          onRestart={handleStartGame}
          onGoHome={() => setGameState(GameState.MENU)}
          onOpenSkins={() => setIsSkinsOpen(true)}
        />
      )}

      {/* Skin Customizer Shop Modal */}
      {isSkinsOpen && (
        <SkinSelector
          skins={skins}
          activeSkinId={activeSkinId}
          totalCrystals={totalCrystals}
          onSelectSkin={handleSelectSkin}
          onUnlockSkin={handleUnlockSkin}
          onClose={() => setIsSkinsOpen(false)}
        />
      )}

      {/* Custom Global CSS Styles (for neon font glows and smooth canvas scaling) */}
      <style>{`
        body {
          margin: 0;
          overflow: hidden;
          background-color: #020617;
          user-select: none;
          -webkit-user-select: none;
        }
        #root {
          width: 100vw;
          height: 100vh;
        }
      `}</style>
    </main>
  );
}
