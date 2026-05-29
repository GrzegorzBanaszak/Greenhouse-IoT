const SSID_KEY = 'greenhouse.controller.ssid';
const IP_KEY = 'greenhouse.controller.ip';

export const defaultControllerIp = '192.168.4.1';

export function getControllerIp(): string {
  return localStorage.getItem(IP_KEY) ?? defaultControllerIp;
}

export function getControllerSsid(): string {
  return localStorage.getItem(SSID_KEY) ?? 'Greenhouse_ESP32_01';
}

export function saveControllerConnection(ssid: string, ipAddress = defaultControllerIp): void {
  localStorage.setItem(SSID_KEY, ssid);
  localStorage.setItem(IP_KEY, ipAddress);
}
