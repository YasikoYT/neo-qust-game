/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface SpaceshipSkin {
  id: string;
  name: string;
  color: string;       // Hex color for body
  wingColor: string;   // Hex color for wings
  glowColor: string;   // Hex color for engine glow / particles
  price: number;       // Coin cost
  unlocked: boolean;
  description: string;
}

export interface PlayerStats {
  score: number;
  highScore: number;
  crystals: number;      // Total currency collected
  sessionCrystals: number; // Crystals in current run
  energy: number;       // 0 to 100
  shields: number;      // 0 to 3
  speed: number;        // Current speed factor
  distance: number;     // Distance traveled in meters
  multiplier: number;   // Active score multiplier
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: Difficulty;
  activeSkinId: string;
}
