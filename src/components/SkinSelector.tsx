/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SpaceshipSkin } from '../types';
import { Sparkles, Check, Lock, Coins } from 'lucide-react';
import { sfx } from '../audio';

interface SkinSelectorProps {
  skins: SpaceshipSkin[];
  activeSkinId: string;
  totalCrystals: number;
  onSelectSkin: (id: string) => void;
  onUnlockSkin: (id: string, price: number) => void;
  onClose: () => void;
}

export const SkinSelector: React.FC<SkinSelectorProps> = ({
  skins,
  activeSkinId,
  totalCrystals,
  onSelectSkin,
  onUnlockSkin,
  onClose,
}) => {
  const handleSelect = (skin: SpaceshipSkin) => {
    if (skin.unlocked) {
      sfx.playLaser();
      onSelectSkin(skin.id);
    }
  };

  const handleUnlock = (skin: SpaceshipSkin) => {
    if (!skin.unlocked && totalCrystals >= skin.price) {
      sfx.playLevelUp();
      onUnlockSkin(skin.id, skin.price);
    } else {
      sfx.playShieldLost(); // error buzz
    }
  };

  return (
    <div id="skin-selector-modal" className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-cyan-950 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-sans text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-6 h-6 animate-pulse" />
              KEMA DIZAYNLARI
            </h2>
            <p className="text-xs text-slate-400 mt-1">Kosmik kemangizni moslashtiring va yangi ranglarni faollashtiring</p>
          </div>
          
          <div className="flex items-center gap-2 bg-cyan-950/50 border border-cyan-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-amber-400 font-bold text-sm">{totalCrystals} <span className="text-[10px] text-cyan-300">kristall</span></span>
          </div>
        </div>

        {/* Grid of Skins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow mb-6">
          {skins.map((skin) => {
            const isActive = skin.id === activeSkinId;
            const canAfford = totalCrystals >= skin.price;

            return (
              <div
                id={`skin-card-${skin.id}`}
                key={skin.id}
                className={`relative border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 bg-slate-950/40 hover:bg-slate-950/75 hover:scale-[1.02] ${
                  isActive
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                    : 'border-slate-800'
                }`}
              >
                {/* Visual indicator of the colors */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl relative flex items-center justify-center overflow-hidden border border-slate-800 bg-slate-900/80">
                    {/* Glowing Engine Glow Background */}
                    <div
                      className="absolute bottom-1 w-6 h-6 rounded-full blur-[6px] animate-pulse"
                      style={{ backgroundColor: skin.glowColor }}
                    />
                    {/* 2D Representation of the spaceship */}
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] z-10 filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]"
                      style={{ borderBottomColor: skin.color }}
                    />
                    {/* Wing color dots */}
                    <div className="absolute w-2 h-2 rounded-full left-3 top-7" style={{ backgroundColor: skin.wingColor }} />
                    <div className="absolute w-2 h-2 rounded-full right-3 top-7" style={{ backgroundColor: skin.wingColor }} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-sans font-bold text-slate-100 text-base flex items-center gap-2">
                      {skin.name}
                      {isActive && <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/50 px-2 py-0.5 rounded-full">Faol</span>}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{skin.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-900 pt-3">
                  <div className="flex items-center gap-1.5">
                    {!skin.unlocked && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="font-mono text-sm font-bold">{skin.price}</span>
                      </div>
                    )}
                    {skin.unlocked && (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Qulfdan ochilgan
                      </span>
                    )}
                  </div>

                  {skin.unlocked ? (
                    <button
                      id={`select-btn-${skin.id}`}
                      onClick={() => handleSelect(skin)}
                      disabled={isActive}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-950/40 text-cyan-600 border border-cyan-950 cursor-default'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer'
                      }`}
                    >
                      {isActive ? "Tanlangan" : "Tanlash"}
                    </button>
                  ) : (
                    <button
                      id={`unlock-btn-${skin.id}`}
                      onClick={() => handleUnlock(skin)}
                      disabled={!canAfford}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      Sotib olish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-4 border-t border-slate-900">
          <button
            id="close-skins-btn"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all duration-200 cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
