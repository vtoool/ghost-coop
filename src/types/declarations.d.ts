// Type declarations for libraries without official types

declare module 'playroomkit' {
  import type { FC, CSSProperties } from 'react';
  
  export interface Player {
    id: string;
    getState: <T>(key: string) => T | undefined;
    setState: <T>(key: string, value: T, reliable?: boolean) => void;
    getJoystick: () => { x: number; y: number; isActive: boolean } | null;
  }

  export interface JoystickData {
    x: number;
    y: number;
    isActive: boolean;
  }

  export interface Roles {
    hunter: string | null;
    operator: string | null;
  }

  export interface JoystickProps {
    style?: CSSProperties;
  }

  export const Joystick: FC<JoystickProps>;
  
  export type { Player };
  export function myPlayer(): Player;
  export function usePlayersList(reactives?: boolean): Player[];
  export function isHost(): boolean;
  export function useMultiplayerState<T>(key: string, defaultValue?: T): [T, (value: T | ((prev: T) => T)) => void];
  export function insertCoin(options?: { skipLobby?: boolean; streamMode?: boolean }): Promise<void>;
}

declare module 'clsx' {
  function clsx(...inputs: Array<string | number | boolean | undefined | null | Record<string, boolean>>): string;
  export = clsx;
}

declare module 'tailwind-merge' {
  export function twMerge(...classes: Array<string | undefined | null>): string;
}

declare module 'react' {
  export = React;
  export as namespace React;
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
