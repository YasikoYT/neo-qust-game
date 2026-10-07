/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Difficulty, SpaceshipSkin } from '../types';
import { Play, Volume2, VolumeX, Music, Shield, Zap, Coins, Settings } from 'lucide-react';
import { sfx } from '../audio';

interface MainMenuProps {
  difficulty: Difficulty;
  soundEnabled: boolean;
  musicEnabled: boolean;
  activeSkin: SpaceshipSkin;
  onStartGame: () => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onOpenSkins: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  difficulty,
  soundEnabled,
  musicEnabled,
  activeSkin,
  onStartGame,
  onChangeDifficulty,
  onToggleSound,
  onToggleMusic,
  onOpenSkins,
}) => {
  const handleStart = () => {
    sfx.playLevelUp();
    onStartGame();
  };

  return (
    <div id="main-menu-overlay" className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 bg-radial from-slate-900 via-slate-950 to-black select-none overflow-y-auto">
      
      {/* Dynamic Cosmic Background Illusion */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_60%)] pointer-events-none" />

      {/* Top Bar: Settings Quick Controls */}
      <div className="w-full max-w-4xl flex justify-between items-center z-10">
        <div className="flex gap-2">
          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-slate-950 text-slate-500 border-slate-900'
            }`}
            title="Tovushlar"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Music Toggle */}
          <button
            id="toggle-music-btn"
            onClick={onToggleMusic}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
              musicEnabled
                ? 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.15)]'
                : 'bg-slate-950 text-slate-500 border-slate-900'
            }`}
            title="Musiqa"
          >
            <Music className={`w-5 h-5 ${musicEnabled ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* Current Active Ship Status */}
        <button
          id="trigger-skins-btn"
          onClick={onOpenSkins}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer group text-left"
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden bg-slate-950 border border-slate-800 relative">
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[10px]" style={{ borderBottomColor: activeSkin.color }} />
            <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full blur-[1px]" style={{ backgroundColor: activeSkin.glowColor }} />
          </div>
          <div>
            <div className="text-[9px] text-slate-400 uppercase font-mono font-semibold">Dizayn</div>
            <div className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 font-sans">{activeSkin.name}</div>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl w-full z-10 py-8">
        
        {/* Animated Cyber Title */}
        <div className="relative mb-3 group">
          <h1 className="text-4xl sm:text-6xl font-extrabold font-sans tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-blue-600 select-none filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            NEON REYDER
          </h1>
          <div className="absolute -inset-1 blur-lg bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-all duration-300 -z-10" />
        </div>
        <p className="text-sm font-semibold text-cyan-300 font-mono tracking-wider mb-8 uppercase">3D Cheksiz Fazoviy Parvoz</p>

        {/* Big Start Button */}
        <button
          id="start-game-btn"
          onClick={handleStart}
          className="relative group px-12 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-sans font-black text-xl tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] border border-cyan-400/50 cursor-pointer overflow-hidden"
        >
          {/* Hover pulse circle effect */}
          <div className="absolute -inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          <span className="flex items-center gap-2.5 justify-center">
            <Play className="w-5 h-5 fill-slate-950" />
            BOSHLASH
          </span>
        </button>

        {/* Difficulty Selector */}
        <div className="mt-10 w-full max-w-sm">
          <label className="text-[10px] text-slate-400 font-mono font-bold tracking-widest block mb-2.5 uppercase">
            QIYINLIK DARAJASI
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-900 p-1.5 rounded-2xl shadow-inner">
            {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((key) => {
              const diff = Difficulty[key];
              const isSelected = difficulty === diff;
              const styles = {
                [Difficulty.EASY]: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
                [Difficulty.MEDIUM]: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.1)]',
                [Difficulty.HARD]: 'text-rose-400 border-rose-500/30 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]',
              };

              return (
                <button
                  id={`diff-btn-${diff.toLowerCase()}`}
                  key={diff}
                  onClick={() => {
                    sfx.playLaser();
                    onChangeDifficulty(diff);
                  }}
                  className={`py-2 px-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `${styles[diff]} border-current`
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {diff === Difficulty.EASY ? "OSON" : diff === Difficulty.MEDIUM ? "O'RTA" : "QIYIN"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: Rules / Tutorial Icons */}
      <div className="w-full max-w-4xl bg-slate-950/60 border border-slate-900 p-4 rounded-2xl backdrop-blur-md grid grid-cols-3 gap-3 text-center z-10 shadow-lg">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-emerald-400 font-bold">YASHIL ORB</div>
            <div className="text-[9px] text-slate-500 font-sans">Kema energiyasini to'ldiradi</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 border-x border-slate-900">
          <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-amber-400 font-bold">SARIQ KRISTALL</div>
            <div className="text-[9px] text-slate-500 font-sans">Yangi dizaynlar sotib olish uchun</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-rose-400 font-bold">QIZIL TO'SIQLAR</div>
            <div className="text-[9px] text-slate-500 font-sans">Qalqonlarni buzadi, qoching!</div>
          </div>
        </div>
      </div>

    </div>
  );
};
