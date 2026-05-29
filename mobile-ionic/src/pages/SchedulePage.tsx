import { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonToggle
} from '@ionic/react';
import PageHeader from '../components/PageHeader';
import { IrrigationSchedule, ValveMode, WeekDay } from '../models/IrrigationSchedule';
import { getControllerIp } from '../services/controllerConnection';
import { esp32ApiService } from '../services/esp32ApiService';

const weekDays: { value: WeekDay; label: string }[] = [
  { value: 'MONDAY', label: 'P' },
  { value: 'TUESDAY', label: 'W' },
  { value: 'WEDNESDAY', label: 'Ś' },
  { value: 'THURSDAY', label: 'C' },
  { value: 'FRIDAY', label: 'P' },
  { value: 'SATURDAY', label: 'S' },
  { value: 'SUNDAY', label: 'N' }
];

const sampleSchedules: IrrigationSchedule[] = [
  {
    id: 'morning-valve-1',
    name: 'Poranne podlewanie',
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
    startTime: '06:30',
    valveMode: 'VALVE1',
    durationSeconds: 120,
    isEnabled: true,
    preventRunWhenWaterLow: true
  },
  {
    id: 'evening-valve-2',
    name: 'Wieczorne podlewanie',
    days: ['FRIDAY', 'SATURDAY'],
    startTime: '19:00',
    valveMode: 'VALVE2',
    durationSeconds: 180,
    isEnabled: true,
    preventRunWhenWaterLow: true
  }
];

export default function SchedulePage() {
  const ipAddress = getControllerIp();
  const [schedules, setSchedules] = useState<IrrigationSchedule[]>(sampleSchedules);
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>(['MONDAY', 'WEDNESDAY', 'FRIDAY']);
  const [startTime, setStartTime] = useState('08:00');
  const [valveMode, setValveMode] = useState<ValveMode>('VALVE1');
  const [durationMinutes, setDurationMinutes] = useState(2);
  const [isEnabled, setIsEnabled] = useState(true);
  const [preventRunWhenWaterLow, setPreventRunWhenWaterLow] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');

  const durationSeconds = useMemo(() => Math.max(1, durationMinutes) * 60, [durationMinutes]);

  async function loadSchedules() {
    setIsBusy(true);
    try {
      setSchedules(await esp32ApiService.getSchedules(ipAddress));
    } catch {
      setMessage('Nie udało się pobrać harmonogramów z ESP32. Pokazuję dane dev.');
    } finally {
      setIsBusy(false);
    }
  }

  async function addSchedule() {
    if (!name.trim()) {
      setMessage('Podaj nazwę harmonogramu');
      return;
    }

    if (selectedDays.length === 0) {
      setMessage('Wybierz co najmniej jeden dzień');
      return;
    }

    const schedule: IrrigationSchedule = {
      id: name.trim().toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      days: selectedDays,
      startTime,
      valveMode,
      durationSeconds,
      isEnabled,
      preventRunWhenWaterLow
    };

    setIsBusy(true);
    try {
      await esp32ApiService.createSchedule(ipAddress, schedule);
      setSchedules((current) => [...current.filter((item) => item.id !== schedule.id), schedule]);
      setName('');
      setMessage('Harmonogram został zapisany');
    } catch (error) {
      setSchedules((current) => [...current.filter((item) => item.id !== schedule.id), schedule]);
      setMessage(error instanceof Error ? `${error.message}. Dodano lokalnie w trybie dev.` : 'Dodano lokalnie w trybie dev.');
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteSchedule(scheduleId: string) {
    setIsBusy(true);
    try {
      await esp32ApiService.deleteSchedule(ipAddress, scheduleId);
    } catch {
      setMessage('Usuwam lokalnie. ESP32 nie potwierdził operacji.');
    } finally {
      setSchedules((current) => current.filter((item) => item.id !== scheduleId));
      setIsBusy(false);
    }
  }

  function toggleDay(day: WeekDay, checked: boolean) {
    setSelectedDays((current) => checked ? [...new Set([...current, day])] : current.filter((item) => item !== day));
  }

  function toggleSchedule(schedule: IrrigationSchedule, checked: boolean) {
    setSchedules((current) => current.map((item) => item.id === schedule.id ? { ...item, isEnabled: checked } : item));
  }

  useEffect(() => {
    void loadSchedules();
  }, []);

  return (
    <IonPage>
      <PageHeader title="Harmonogram" />
      <IonContent className="app-content">
        <section className="section-heading">
          <h2>Automatyczne podlewanie</h2>
          <p>Zarządzaj harmonogramami zapisanymi w kontrolerze ESP32.</p>
        </section>

        <IonList inset>
          {schedules.map((schedule) => (
            <IonItem key={schedule.id}>
              <IonLabel>
                <h2>{schedule.name}</h2>
                <p>{schedule.startTime} - {formatValve(schedule.valveMode)} - {Math.round(schedule.durationSeconds / 60)} min</p>
                <p>{schedule.days.join(', ')}</p>
              </IonLabel>
              <IonToggle checked={schedule.isEnabled} onIonChange={(event) => toggleSchedule(schedule, event.detail.checked)} />
              <IonButton color="danger" fill="clear" slot="end" onClick={() => deleteSchedule(schedule.id)}>Usuń</IonButton>
            </IonItem>
          ))}
        </IonList>

        <section className="surface-card form-card">
          <h3>Dodaj harmonogram</h3>
          <IonInput label="Nazwa" labelPlacement="stacked" value={name} placeholder="np. Popołudniowe podlewanie" onIonInput={(event) => setName(event.detail.value ?? '')} />
          <div className="day-selector">
            {weekDays.map((day) => (
              <IonCheckbox
                key={day.value}
                checked={selectedDays.includes(day.value)}
                onIonChange={(event) => toggleDay(day.value, event.detail.checked)}
              >
                {day.label}
              </IonCheckbox>
            ))}
          </div>
          <IonInput label="Godzina" labelPlacement="stacked" type="time" value={startTime} onIonInput={(event) => setStartTime(event.detail.value ?? '08:00')} />
          <IonSelect label="Zawór" labelPlacement="stacked" value={valveMode} onIonChange={(event) => setValveMode(event.detail.value)}>
            <IonSelectOption value="VALVE1">Zawór 1</IonSelectOption>
            <IonSelectOption value="VALVE2">Zawór 2</IonSelectOption>
            <IonSelectOption value="BOTH">Oba zawory</IonSelectOption>
          </IonSelect>
          <IonInput
            label="Czas pracy (minuty)"
            labelPlacement="stacked"
            type="number"
            min={1}
            value={durationMinutes}
            onIonInput={(event) => setDurationMinutes(Number(event.detail.value ?? 1))}
          />
          <IonToggle checked={isEnabled} onIonChange={(event) => setIsEnabled(event.detail.checked)}>Aktywny</IonToggle>
          <IonToggle checked={preventRunWhenWaterLow} onIonChange={(event) => setPreventRunWhenWaterLow(event.detail.checked)}>
            Nie uruchamiaj, jeśli poziom wody poniżej 10%
          </IonToggle>
          <IonButton expand="block" size="large" onClick={addSchedule}>Zapisz harmonogram</IonButton>
        </section>

        <IonLoading isOpen={isBusy} message="Łączenie z kontrolerem..." />
        <IonToast isOpen={message.length > 0} message={message} duration={3200} onDidDismiss={() => setMessage('')} />
      </IonContent>
    </IonPage>
  );
}

function formatValve(mode: ValveMode): string {
  if (mode === 'VALVE1') return 'Zawór 1';
  if (mode === 'VALVE2') return 'Zawór 2';
  return 'Oba zawory';
}
