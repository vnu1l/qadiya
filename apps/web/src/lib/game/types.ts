export type GameSceneId =
  | 'menu'
  | 'lobby'
  | 'role-reveal'
  | 'preparation'
  | 'court'
  | 'results';

export type CourtCameraId = 'wide' | 'judge' | 'witness' | 'defense' | 'prosecution';

export interface CourtCameraPreset {
  id: CourtCameraId;
  label: string;
  ariaLabel: string;
  cssClass: `camera-${CourtCameraId}`;
}

export interface LobbySeatView {
  id: string;
  displayName: string;
  status: 'ready' | 'connected' | 'open';
}
