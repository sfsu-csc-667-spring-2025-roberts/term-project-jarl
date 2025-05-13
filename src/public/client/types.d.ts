// src/public/client/types.d.ts

import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    gameSocket: Socket;
    bootstrap: {
      Modal: any;
      Tooltip: any;
      Popover: any;
    };
    utils: {
      formatCurrency: (amount: number) => string;
      showNotification: (message: string, type?: string) => void;
      confirm: (message: string, callback: () => void) => void;
      debounce: (func: Function, wait: number) => Function;
      getUserId: () => number;
      timeSince: (date: string | Date) => string;
    };
  }
  
  interface Document {
    body: HTMLBodyElement & {
      dataset: {
        userId: string;
        username: string;
      };
    };
  }
}

export interface GameData {
  id: number;
  name: string;
  state: 'WAITING' | 'ACTIVE' | 'FINISHED';
  max_players: number;
  current_players: number;
  created_by: number;
  creator_name?: string;
}

export interface JoinGameResponse {
  success: boolean;
  error?: string;
  game_id?: number;
  player_count?: number;
  players?: string[];
  game_state?: string;
}

export interface PlayerJoinedEvent {
  game_id: number;
  user_id: number;
  player_count: number;
  players?: string[];
  game_name?: string;
  created_by?: string;
}

export interface PlayerLeftEvent {
  game_id: number;
  user_id: number;
  player_count: number;
  players?: string[];
  reason?: string;
}

export interface ChatMessageData {
  username: string;
  message: string;
  timestamp: string;
  game_id: string;
}

export interface GameInfoResponse {
  success: boolean;
  game?: GameData & {
    players: Array<{ id: number; username: string }>;
  };
  error?: string;
}

export {};