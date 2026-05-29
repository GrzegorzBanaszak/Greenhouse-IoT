export type WeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type ValveMode = 'VALVE1' | 'VALVE2' | 'BOTH';

export interface IrrigationSchedule {
  id: string;
  name: string;
  days: WeekDay[];
  startTime: string;
  valveMode: ValveMode;
  durationSeconds: number;
  isEnabled: boolean;
  preventRunWhenWaterLow: boolean;
}
