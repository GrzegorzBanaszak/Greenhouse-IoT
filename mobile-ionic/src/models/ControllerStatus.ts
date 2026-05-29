export interface ControllerStatus {
  pump: boolean;
  valve1: boolean;
  valve2: boolean;
  distanceCm: number;
  waterLevelPercent: number;
  waterLiters: number;
  barrelCapacityLiters: number;
  wifiRssi: number;
  uptimeMs: number;
  mode: string;
  ssid: string;
  ipAddress: string;
}
