import type { CourtCameraId, CourtCameraPreset } from './types';

export const COURT_CAMERA_PRESETS: Readonly<Record<CourtCameraId, CourtCameraPreset>> = {
  wide: {
    id: 'wide',
    label: 'المحكمة',
    ariaLabel: 'المنظر الشامل للمحكمة',
    cssClass: 'camera-wide',
  },
  judge: {
    id: 'judge',
    label: 'القاضي',
    ariaLabel: 'التركيز على منصة القاضي',
    cssClass: 'camera-judge',
  },
  witness: {
    id: 'witness',
    label: 'الشاهد',
    ariaLabel: 'التركيز على منصة الشاهد',
    cssClass: 'camera-witness',
  },
  defense: {
    id: 'defense',
    label: 'الدفاع',
    ariaLabel: 'التركيز على طاولة الدفاع',
    cssClass: 'camera-defense',
  },
  prosecution: {
    id: 'prosecution',
    label: 'الادعاء',
    ariaLabel: 'التركيز على طاولة الادعاء',
    cssClass: 'camera-prosecution',
  },
};

export const COURT_CAMERA_ORDER: readonly CourtCameraId[] = [
  'wide',
  'judge',
  'witness',
  'defense',
  'prosecution',
];
