/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats } from '../types';
import { Shield, Battery, Coins, Zap, Pause, Play } from 'lucide-react';

interface GameHUDProps {
  stats: PlayerStats;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ stats, isPaused, onTogglePause }) => {
  const shieldColors = ['text-rose-600', 'text-rose-500', 'text-rose-400', 'text-emerald-400'];
  const energyPercent = Math.max(0, Math.min(100, stats.energy));
  const isEnergyLow = energyPercent < 25;

  return (
    <div id="game-hud-overlay" className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 font-mono select-none">
      
      {/* Top HUD Row */}
      <div className="flex justify-between items-start w-full gap-4">
        
        {/* Left Side: Shield and Energy (Fuel) */}
        <div className="flex flex-col gap-2.5 pointer-events-auto bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl backdrop-blur-md max-w-xs w-full shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {/* Shields */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400 animate-pulse" /> QALQON
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-5 h-2.5 rounded-sm border transition-all duration-300 ${
                    s <= stats.shields
                      ? 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Energy / Fuel */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                <Battery className={`w-3.5 h-3.5 ${isEnergyLow ? 'text-rose-500 animate-bounce' : 'text-emerald-400'}`} /> 
                ENERGIYA
              </span>
              <span className={`text-[11px] font-bold ${isEnergyLow ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                {Math.round(energyPercent)}%
              </span>
            </div>
            
            {/* Energy Bar */}
            <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-800 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  isEnergyLow
                    ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-pulse'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                }`}
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Distance and Speed */}
        <div className="hidden sm:flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/80 py-2 px-6 rounded-xl backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-center">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">MASOFA</div>
          <div className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]">
            {Math.round(stats.distance)} M
          </div>
          <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" /> 
            TEZLIK: <span className="text-yellow-400">{Math.round(stats.speed * 100)} KM/S</span>
          </div>
        </div>

        {/* Right Side: Score and Crystals */}
        <div className="flex flex-col gap-2.5 pointer-events-auto items-end bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl backdrop-blur-md max-w-[200px] w-full shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {/* Score */}
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">HISOB</span>
            <div className="flex items-baseline gap-1.5">
              {stats.multiplier > 1 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse font-extrabold">
                  x{stats.multiplier}
                </span>
              )}
              <span className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                {stats.score}
              </span>
            </div>
          </div>

          {/* Crystals */}
          <div className="flex items-center gap-2 justify-end w-full border-t border-slate-900 pt-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold">KRISTALLAR</span>
            <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">{stats.sessionCrystals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Alert (e.g. LOW ENERGY WARNING) */}
      {isEnergyLow && (
        <div id="low-energy-warning" className="self-center mt-auto mb-auto animate-pulse bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs md:text-sm font-bold px-6 py-2.5 rounded-lg backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-500 animate-bounce" />
          ENERGIYA KAM! YASHIL ORBLARNI TO'PLANG!
        </div>
      )}

      {/* Bottom HUD Row: Pause button and basic controls help */}
      <div className="flex justify-between items-center w-full mt-auto">
        {/* Controls Help */}
        <div className="pointer-events-auto bg-slate-950/40 px-3.5 py-2 rounded-lg text-[10px] text-slate-400 border border-slate-900/60 backdrop-blur-sm max-w-xs">
          Harakat: <span className="text-cyan-400 font-bold">← →</span> yoki <span className="text-cyan-400 font-bold">A D</span> / Sichqoncha surish
        </div>

        {/* Speed & Distance on mobile (when top center is hidden) */}
        <div className="block sm:hidden text-right text-[10px] text-slate-400 pr-2">
          <span>{Math.round(stats.distance)} M | {Math.round(stats.speed * 100)} KM/S</span>
        </div>

        {/* Pause Button */}
        <button
          id="pause-button"
          onClick={onTogglePause}
          className="pointer-events-auto w-10 h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-cyan-400 border border-cyan-500/30 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>

    </div>
  );
};
