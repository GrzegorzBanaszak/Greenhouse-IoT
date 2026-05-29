# ESP32 Greenhouse Controller

Firmware dla ESP32 DevKit sterujący pompą, dwoma zaworami i czujnikiem poziomu wody JSN-SR04T.

## Piny

| Funkcja | GPIO |
| --- | --- |
| Pompa, przekaźnik IN1 | 16 |
| Zawór 1, przekaźnik IN2 | 17 |
| Zawór 2, przekaźnik IN3 | 18 |
| JSN-SR04T TRIG | 32 |
| JSN-SR04T ECHO | 33 |

GPIO 32/33 sa ustawione zgodnie z dzialajacym szkicem testowym czujnika. Przy zmianie okablowania zmien `TRIG_PIN` i `ECHO_PIN` w wersji PlatformIO oraz Arduino IDE.

## Access Point

- SSID: `Greenhouse_ESP32_01`
- Hasło: `greenhouse123`
- IP: `192.168.4.1`

## Build

```powershell
pio run
pio run -t upload
pio device monitor
```

## Arduino IDE

Jeżeli nie używasz PlatformIO, otwórz sketch:

```text
esp32-controller/arduino/greenhouse_controller/greenhouse_controller.ino
```

W Arduino IDE wybierz płytkę `ESP32 Dev Module`, zainstaluj bibliotekę `ArduinoJson` 6.x i użyj `Upload/Wgraj`.

## API

- `GET /api/status`
- `GET /api/water-level`
- `POST /api/pump/on`
- `POST /api/pump/off`
- `POST /api/valve1/on`
- `POST /api/valve1/off`
- `POST /api/valve2/on`
- `POST /api/valve2/off`
- `POST /api/all/off`
- `GET /api/schedules`
- `POST /api/schedules`
- `DELETE /api/schedules/{id}`
- `POST /api/schedules/delete`

`POST /api/schedules/delete` przyjmuje JSON:

```json
{ "id": "morning-valve-1" }
```

Harmonogramy są zapisywane w NVS. Ich automatyczne uruchamianie wymaga poprawnego czasu systemowego, więc w trybie AP należy w przyszłości dodać synchronizację czasu lub konfigurację czasu z aplikacji.
