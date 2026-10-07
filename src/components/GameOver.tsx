/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats } from '../types';
import { RotateCcw, Home, Sparkles, Trophy, Coins, Compass } from 'lucide-react';
import { sfx } from '../audio';

interface GameOverProps {
  stats: PlayerStats;
  isNewRecord: boolean;
  onRestart: () => void;
  onGoHome: () => void;
  onOpenSkins: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  stats,
  isNewRecord,
  onRestart,
  onGoHome,
  onOpenSkins,
}) => {
  const handleRestart = () => {
    sfx.playLevelUp();
    onRestart();
  };

  const handleGoHome = () => {
    sfx.playLaser();
    onGoHome();
  };

  return (
    <div id="game-over-overlay" className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md select-none overflow-y-auto">
      
      {/* Glow highlight */}
      <div className="absolute w-[350px] h-[350px] rounded-full blur-[80px] bg-rose-600/10 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/85 border border-rose-500/30 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_50px_rgba(244,63,94,0.15)] z-10">
        
        {/* Title */}
        {isNewRecord ? (
          <div className="mb-4 animate-bounce">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 justify-center w-fit mx-auto">
              <Sparkles className="w-3.5 h-3.5" /> YANGI REKORD
            </span>
          </div>
        ) : null}

        <h2 className="text-3xl sm:text-4xl font-extrabold font-sans tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 filter drop-shadow-[0_0_10px_rgba(244,63,94,0.3)] mb-6">
          KEMA TO'QNASHDI!
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8 bg-slate-950/80 border border-slate-900 p-4 rounded-2xl">
          
          {/* Score */}
          <div className="flex flex-col items-center p-3 border-r border-slate-900">
            <Trophy className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-mono font-bold">UMUMIY HISOB</span>
            <span className="text-xl font-black text-cyan-400 font-mono mt-0.5">{stats.score}</span>
          </div>

          {/* High Score */}
          <div className="flex flex-col items-center p-3">
            <Trophy className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-mono font-bold">ENG YUQORI HISOB</span>
            <span className="text-xl font-black text-amber-400 font-mono mt-0.5">{stats.highScore}</span>
          </div>

          {/* Distance */}
          <div className="flex flex-col items-center p-3 border-t border-r border-slate-900 pt-3">
            <Compass className="w-5 h-5 text-blue-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-mono font-bold">MASOFA</span>
            <span className="text-lg font-bold text-slate-200 font-mono mt-0.5">{Math.round(stats.distance)} M</span>
          </div>

          {/* Crystals Earned */}
          <div className="flex flex-col items-center p-3 border-t border-slate-900 pt-3">
            <Coins className="w-5 h-5 text-yellow-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-mono font-bold">TO'PLANGAN KRISTALLAR</span>
            <span className="text-lg font-bold text-yellow-400 font-mono mt-0.5">+{stats.sessionCrystals}</span>
          </div>

        </div>

        {/* Quick skins shop link */}
        <div className="mb-8 p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 flex justify-between items-center text-left">
          <div>
            <div className="text-[11px] font-bold text-slate-200">Keling, dizaynni o'zgartiramiz!</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Crystals bilan yangi kema qulflarini oching</div>
          </div>
          <button
            id="go-skins-from-gameover-btn"
            onClick={onOpenSkins}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-sans"
          >
            Sotib Olish →
          </button>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-3">
          {/* Try Again */}
          <button
            id="restart-game-btn-gameover"
            onClick={handleRestart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-sans font-black text-base tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_4px_20px_rgba(244,63,94,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-950 stroke-[3px]" />
            QAYTA O'YNASH
          </button>

          {/* Home / Menu */}
          <button
            id="go-home-btn"
            onClick={handleGoHome}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-sm font-bold border border-slate-700 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            BOSH SAHIFA
          </button>
        </div>

      </div>
    </div>
  );
};
