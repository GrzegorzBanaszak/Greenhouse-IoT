import { ControllerStatus } from '../models/ControllerStatus';
import { IrrigationSchedule } from '../models/IrrigationSchedule';
import { WaterTankStatus } from '../models/WaterTankStatus';

type ApiResult = {
  success?: boolean;
  error?: string;
};

const requestTimeoutMs = 6000;

function baseUrl(ipAddress: string): string {
  const normalized = ipAddress.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `http://${normalized}`;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(payload.error ?? `ESP32 zwrócił błąd HTTP ${response.status}`);
    }

    if (payload.success === false) {
      throw new Error(payload.error ?? 'ESP32 odrzucił komendę');
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('ESP32 nie odpowiada');
    }

    if (error instanceof SyntaxError) {
      throw new Error('ESP32 zwrócił niepoprawny JSON');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function postCommand(ipAddress: string, path: string): Promise<boolean> {
  await requestJson<ApiResult>(`${baseUrl(ipAddress)}${path}`, { method: 'POST' });
  return true;
}

export const esp32ApiService = {
  getStatus(ipAddress: string): Promise<ControllerStatus> {
    return requestJson<ControllerStatus>(`${baseUrl(ipAddress)}/api/status`);
  },

  getWaterLevel(ipAddress: string): Promise<WaterTankStatus> {
    return requestJson<WaterTankStatus>(`${baseUrl(ipAddress)}/api/water-level`);
  },

  turnPumpOn(ipAddress: string): Promise<boolean> {
    return postCommand(ipAddress, '/api/pump/on');
  },

  turnPumpOff(ipAddress: string): Promise<boolean> {
    return postCommand(ipAddress, '/api/pump/off');
  },

  turnValve1On(ipAddress: string): Promise<boolean> {
    return postCommand(ipAddress, '/api/valve1/on');
  },

  turnValve1Off(ipAddress: string): Promise<boolean> {
    return postCommand(ipAddress, '/api/valve1/off');
  },

  turnValve2On(ipAddress: string): Promise<boolean> {
    return postCommand(ipAddress, '/api/valve2/on');
  },

  turnValve2Off(ipAddress: string): Promise<boolean> {
    return postCommand(ipAddress, '/api/valve2/off');
  },

  turnAllOff(ipAddress: string): Promise<boolean> {
    return postCommand(ipAddress, '/api/all/off');
  },

  getSchedules(ipAddress: string): Promise<IrrigationSchedule[]> {
    return requestJson<IrrigationSchedule[]>(`${baseUrl(ipAddress)}/api/schedules`);
  },

  async createSchedule(ipAddress: string, schedule: IrrigationSchedule): Promise<boolean> {
    await requestJson<ApiResult>(`${baseUrl(ipAddress)}/api/schedules`, {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
    return true;
  },

  async deleteSchedule(ipAddress: string, scheduleId: string): Promise<boolean> {
    await requestJson<ApiResult>(`${baseUrl(ipAddress)}/api/schedules/delete`, {
      method: 'POST',
      body: JSON.stringify({ id: scheduleId })
    });
    return true;
  }
};
