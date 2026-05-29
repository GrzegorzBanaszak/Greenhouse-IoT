import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonLoading,
  IonPage,
  IonToast
} from '@ionic/react';
import { powerOutline, refreshOutline, waterOutline } from 'ionicons/icons';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import WaterGauge from '../components/WaterGauge';
import { ControllerStatus } from '../models/ControllerStatus';
import { getControllerIp, getControllerSsid } from '../services/controllerConnection';
import { esp32ApiService } from '../services/esp32ApiService';

const fallbackStatus: ControllerStatus = {
  pump: false,
  valve1: false,
  valve2: false,
  distanceCm: 52,
  waterLevelPercent: 63,
  waterLiters: 139,
  barrelCapacityLiters: 220,
  wifiRssi: -55,
  uptimeMs: 0,
  mode: 'DEV',
  ssid: 'Greenhouse_ESP32_01',
  ipAddress: '192.168.4.1'
};

export default function ControlPage() {
  const ipAddress = getControllerIp();
  const [status, setStatus] = useState<ControllerStatus>(fallbackStatus);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshStatus() {
    setIsBusy(true);
    try {
      const result = await esp32ApiService.getStatus(ipAddress);
      setStatus(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ESP32 nie odpowiada');
    } finally {
      setIsBusy(false);
    }
  }

  async function runCommand(command: () => Promise<boolean>, successMessage: string) {
    setIsBusy(true);
    try {
      await command();
      setMessage(successMessage);
      await refreshStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nie udało się wykonać komendy');
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  const waterLow = status.waterLevelPercent < 10;

  return (
    <IonPage>
      <PageHeader title="Sterowanie" />
      <IonContent className="app-content">
        <section className="connection-pill">
          <span className="online-dot" />
          <div>
            <strong>{status.ssid || getControllerSsid()}</strong>
            <small>IP: {status.ipAddress || ipAddress}</small>
          </div>
          <IonButton fill="clear" size="small" onClick={refreshStatus}>
            <IonIcon icon={refreshOutline} slot="icon-only" />
          </IonButton>
        </section>

        <section className="surface-card water-card">
          <h2>Główny zbiornik</h2>
          <WaterGauge percent={status.waterLevelPercent} />
          <div className="metrics-row">
            <div>
              <span>Pojemność</span>
              <strong>{Math.round(status.waterLiters)} l / {Math.round(status.barrelCapacityLiters)} l</strong>
            </div>
            <div>
              <span>Odległość</span>
              <strong>{status.distanceCm.toFixed(1)} cm</strong>
            </div>
          </div>
          {waterLow && <p className="warning-text">Niski poziom wody - pompa zablokowana</p>}
          <p className="hint-text">Maksymalny czas pracy pompy: 5 minut</p>
        </section>

        <section className="control-grid">
          <DeviceCard
            title="Pompa główna"
            icon={waterOutline}
            active={status.pump}
            activeText="Włączona"
            inactiveText="Wyłączona"
            onEnable={() => runCommand(() => esp32ApiService.turnPumpOn(ipAddress), 'Pompa została włączona')}
            onDisable={() => runCommand(() => esp32ApiService.turnPumpOff(ipAddress), 'Pompa została wyłączona')}
          />
          <DeviceCard
            title="Zawór 1"
            icon={waterOutline}
            active={status.valve1}
            activeText="Otwarty"
            inactiveText="Zamknięty"
            onEnable={() => runCommand(() => esp32ApiService.turnValve1On(ipAddress), 'Zawór 1 został otwarty')}
            onDisable={() => runCommand(() => esp32ApiService.turnValve1Off(ipAddress), 'Zawór 1 został zamknięty')}
          />
          <DeviceCard
            title="Zawór 2"
            icon={waterOutline}
            active={status.valve2}
            activeText="Otwarty"
            inactiveText="Zamknięty"
            onEnable={() => runCommand(() => esp32ApiService.turnValve2On(ipAddress), 'Zawór 2 został otwarty')}
            onDisable={() => runCommand(() => esp32ApiService.turnValve2Off(ipAddress), 'Zawór 2 został zamknięty')}
          />
        </section>

        <IonButton color="danger" expand="block" size="large" onClick={() => runCommand(() => esp32ApiService.turnAllOff(ipAddress), 'Wszystkie urządzenia zostały wyłączone')}>
          <IonIcon icon={powerOutline} slot="start" />
          Wyłącz wszystko
        </IonButton>

        <IonLoading isOpen={isBusy} message="Łączenie z kontrolerem..." />
        <IonToast isOpen={message.length > 0} message={message} duration={2600} onDidDismiss={() => setMessage('')} />
      </IonContent>
    </IonPage>
  );
}

type DeviceCardProps = {
  title: string;
  icon: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
  onEnable: () => void;
  onDisable: () => void;
};

function DeviceCard({ title, icon, active, activeText, inactiveText, onEnable, onDisable }: DeviceCardProps) {
  return (
    <article className={active ? 'surface-card device-card device-card-active' : 'surface-card device-card'}>
      <div className="device-card-top">
        <IonIcon icon={icon} />
        <StatusPill active={active} activeText={activeText} inactiveText={inactiveText} />
      </div>
      <h3>{title}</h3>
      <div className="split-actions">
        <IonButton expand="block" onClick={onEnable}>Włącz</IonButton>
        <IonButton expand="block" fill="outline" onClick={onDisable}>Wyłącz</IonButton>
      </div>
    </article>
  );
}
