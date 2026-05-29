import { WifiNetworkInfo } from '../models/WifiNetworkInfo';
import { saveControllerConnection } from './controllerConnection';

export interface WifiScannerService {
  scanForGreenhouseNetworks(): Promise<WifiNetworkInfo[]>;
  connectToNetwork(ssid: string): Promise<boolean>;
}

const mockNetworks: WifiNetworkInfo[] = [
  { ssid: 'Greenhouse_ESP32_01', signalStrength: 90, isConnected: false },
  { ssid: 'Greenhouse_ESP32_02', signalStrength: 64, isConnected: false }
];

export const mockWifiScannerService: WifiScannerService = {
  async scanForGreenhouseNetworks() {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const connectedSsid = localStorage.getItem('greenhouse.controller.ssid');

    return mockNetworks.map((network) => ({
      ...network,
      isConnected: network.ssid === connectedSsid
    }));
  },

  async connectToNetwork(ssid: string) {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    saveControllerConnection(ssid);
    return true;
  }
};
