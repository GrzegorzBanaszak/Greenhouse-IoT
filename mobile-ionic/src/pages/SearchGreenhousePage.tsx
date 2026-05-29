import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonNote,
  IonPage,
  IonToast
} from '@ionic/react';
import { checkmarkCircleOutline, refreshOutline, wifiOutline } from 'ionicons/icons';
import PageHeader from '../components/PageHeader';
import { WifiNetworkInfo } from '../models/WifiNetworkInfo';
import { defaultControllerIp } from '../services/controllerConnection';
import { mockWifiScannerService } from '../services/wifiScannerService';

export default function SearchGreenhousePage() {
  const history = useHistory();
  const [networks, setNetworks] = useState<WifiNetworkInfo[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function scanNetworks() {
    setIsBusy(true);
    try {
      const result = await mockWifiScannerService.scanForGreenhouseNetworks();
      setNetworks(result);
      if (result.length === 0) {
        setMessage('Nie znaleziono szklarni w pobliżu');
      }
    } catch {
      setMessage('Skanowanie sieci Wi-Fi nie powiodło się');
    } finally {
      setIsBusy(false);
    }
  }

  async function connect(network: WifiNetworkInfo) {
    setIsBusy(true);
    try {
      await mockWifiScannerService.connectToNetwork(network.ssid);
      setMessage(`Połączono z ${network.ssid}`);
      history.push('/control');
    } catch {
      setMessage('Nie udało się połączyć z kontrolerem');
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void scanNetworks();
  }, []);

  return (
    <IonPage>
      <PageHeader title="Wyszukaj szklarnię" />
      <IonContent className="app-content">
        <section className="intro-block">
          <div className="radar-mark">
            <IonIcon icon={wifiOutline} />
          </div>
          <p>Aplikacja wyszukuje sieci Wi-Fi zaczynające się od Greenhouse_ESP32.</p>
          <IonNote>Domyślny adres kontrolera po połączeniu: {defaultControllerIp}</IonNote>
        </section>

        <IonList inset className="network-list">
          {networks.map((network) => (
            <IonItem key={network.ssid}>
              <IonIcon icon={network.isConnected ? checkmarkCircleOutline : wifiOutline} slot="start" color={network.isConnected ? 'success' : 'medium'} />
              <IonLabel>
                <h2>{network.ssid}</h2>
                <p>Sygnał: {network.signalStrength}%</p>
              </IonLabel>
              <IonButton slot="end" fill={network.isConnected ? 'clear' : 'solid'} onClick={() => connect(network)}>
                {network.isConnected ? 'Połączono' : 'Połącz'}
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        <div className="page-actions">
          <IonButton expand="block" fill="outline" onClick={scanNetworks}>
            <IonIcon icon={refreshOutline} slot="start" />
            Skanuj ponownie
          </IonButton>
        </div>

        <IonLoading isOpen={isBusy} message="Skanowanie sieci Wi-Fi..." />
        <IonToast isOpen={message.length > 0} message={message} duration={2400} onDidDismiss={() => setMessage('')} />
      </IonContent>
    </IonPage>
  );
}
