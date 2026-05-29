# Greenhouse Controller

Kompletny projekt sterowania podlewaniem szklarni. Składa się z firmware dla ESP32 oraz aplikacji mobilnej Android w .NET MAUI.

## Technologie

- ESP32 DevKit
- Arduino framework przez PlatformIO
- JSN-SR04T do pomiaru odległości do lustra wody
- Przekaźniki active LOW dla pompy i dwóch zaworów
- REST API HTTP na ESP32
- .NET 9 MAUI dla aplikacji Android
- MVVM, serwisy HTTP i mock/dev Wi-Fi scanner

## Schemat działania

ESP32 tworzy Access Point `Greenhouse_ESP32_01` z adresem `192.168.4.1`, mierzy poziom wody w beczce i udostępnia API HTTP. Aplikacja wyszukuje sieci `Greenhouse_ESP32*`, łączy się z kontrolerem, pokazuje status i wysyła komendy sterujące.

## Mapowanie pinów ESP32

| GPIO | Funkcja |
| --- | --- |
| GPIO 16 | przekaźnik IN1, pompa |
| GPIO 17 | przekaźnik IN2, zawór 1 |
| GPIO 18 | przekaźnik IN3, zawór 2 |
| GPIO 32 | JSN-SR04T TRIG przez konwerter poziomów |
| GPIO 33 | JSN-SR04T ECHO przez konwerter poziomów |

Aktualny kod uzywa GPIO 32/33 dla JSN-SR04T, bo ta para pinow zostala zweryfikowana w szkicu testowym `czyjnik_odleglo`. Jezeli czujnik zostanie przepiety na inne GPIO, trzeba zmienic `TRIG_PIN` i `ECHO_PIN` w `esp32-controller/src/main.cpp` oraz w szkicu Arduino IDE.

## Parametry beczki

- Pojemność: 220 l
- Wysokość: około 104 cm
- Średnica: około 58 cm
- `FULL_DISTANCE_CM = 25 cm`
- `EMPTY_DISTANCE_CM = 100 cm`
- Minimalny poziom wody do uruchomienia pompy: 10%

## Liczenie poziomu wody

JSN-SR04T jest zamontowany od góry i mierzy odległość od czujnika do lustra wody.

```cpp
float percent = ((EMPTY_DISTANCE_CM - distanceCm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) * 100.0;
```

Wynik jest ograniczany do zakresu 0-100%. Ilość wody jest szacowana liniowo:

```cpp
float liters = BARREL_CAPACITY_LITERS * (percent / 100.0);
```

Beczka nie musi być idealnym walcem, więc w przyszłości warto dodać kalibrację wielopunktową.

## API ESP32

Status:

- `GET /api/status`
- `GET /api/water-level`

Sterowanie:

- `POST /api/pump/on`
- `POST /api/pump/off`
- `POST /api/valve1/on`
- `POST /api/valve1/off`
- `POST /api/valve2/on`
- `POST /api/valve2/off`
- `POST /api/all/off`

Harmonogramy:

- `GET /api/schedules`
- `POST /api/schedules`
- `DELETE /api/schedules/{id}`
- `POST /api/schedules/delete`

Przykład statusu:

```json
{
  "pump": false,
  "valve1": false,
  "valve2": false,
  "distanceCm": 52.0,
  "waterLevelPercent": 63,
  "waterLiters": 139.0,
  "barrelCapacityLiters": 220.0,
  "wifiRssi": -55,
  "uptimeMs": 123456,
  "mode": "AP",
  "ssid": "Greenhouse_ESP32_01",
  "ipAddress": "192.168.4.1"
}
```

## Aplikacja mobilna

Aplikacja ma cztery ekrany i dolną nawigację:

- Start: ekran powitalny z nazwą `Greenhouse Controller`.
- Szukaj: skanowanie sieci `Greenhouse_ESP32*`, siła sygnału i połączenie.
- Sterowanie: poziom wody, litry, odległość czujnika, status pompy i zaworów, ręczne komendy.
- Harmonogram: lista, dodawanie, usuwanie i aktywowanie harmonogramów.

UI bazuje na wzorcach z `templates/`: jasne tło sage, botaniczna zieleń, zaokrąglone karty i duże przyciski.

## Uruchomienie firmware

Wymagane: PlatformIO.

```powershell
cd esp32-controller
pio run
pio run -t upload
pio device monitor
```

Po uruchomieniu ESP32 wystawia sieć:

- SSID: `Greenhouse_ESP32_01`
- Hasło: `greenhouse123`
- IP: `192.168.4.1`

## Uruchomienie aplikacji .NET MAUI

Wymagane: .NET 9 SDK z workloadami MAUI i Android.

```powershell
dotnet restore MobileApp/MobileApp.csproj
dotnet build MobileApp/MobileApp.csproj -f net9.0-android
```

Uruchomienie na emulatorze lub telefonie można wykonać z Visual Studio albo poleceniem `dotnet build -t:Run` po wskazaniu urządzenia Android.

## Zasady bezpieczeństwa

- Pompa jest wyłączona po starcie.
- Zawory są zamknięte po starcie.
- Przekaźniki obsługują tryb active LOW.
- `POST /api/all/off` awaryjnie wyłącza pompę i zamyka zawory.
- Maksymalny czas pracy pompy wynosi 5 minut.
- Pompa nie uruchamia się przy poziomie wody poniżej 10%.
- Pompa nie uruchamia się, jeśli pomiar JSN-SR04T zwraca błąd.
- Po przekroczeniu limitu czasu pompa i zawory są wyłączane.

## Ograniczenia bez sprzętu

- Pełny test pomiaru JSN-SR04T wymaga fizycznego czujnika i beczki.
- Pełny test przekaźników wymaga modułu przekaźnikowego, pompy i zaworów.
- Android ogranicza automatyczne łączenie z Wi-Fi; aplikacja ma implementację Android scan oraz fallback mock/dev, a po wyborze sieci może otworzyć ustawienia Wi-Fi.
- Harmonogramy na ESP32 są gotowe strukturalnie, ale automatyczne uruchamianie wymaga poprawnego czasu systemowego/NTP. W trybie AP dodano TODO pod synchronizację czasu.

## Plan dalszego rozwoju

- Dodać konfigurację czasu/NTP z aplikacji.
- Dodać tryb STA, aby ESP32 łączył się z routerem domowym.
- Dodać wielopunktową kalibrację beczki.
- Dodać historię podlewania i wykres poziomu wody.
- Dodać autoryzację API i zmianę hasła Access Pointa.
- Dodać testy jednostkowe dla serwisów MAUI oraz testy integracyjne API ESP32.

## Alternatywna aplikacja Ionic + Capacitor

Repozytorium zawiera nowy startowy projekt `mobile-ionic/` oparty o Ionic React, TypeScript i Capacitor. Jest to rekomendowany kierunek, jeżeli priorytetem jest wierne odwzorowanie layoutów HTML/CSS z katalogu `templates/`.

Uruchomienie:

```powershell
cd mobile-ionic
cmd /c npm install
cmd /c npm run dev
cmd /c npm run build
```

Na tej maszynie npm może wymagać systemowych certyfikatów:

```powershell
cmd /c "set NODE_OPTIONS=--use-system-ca&& npm install"
cmd /c "set NODE_OPTIONS=--use-system-ca&& npm run build"
```

Android przez Capacitor:

```powershell
cd mobile-ionic
cmd /c npx cap add android
cmd /c npx cap sync android
cmd /c npx cap open android
```

Projekt zawiera cztery ekrany: Start, Szukaj, Sterowanie i Harmonogram. Skanowanie Wi-Fi jest na start mockiem dev; natywna implementacja Android powinna zostać dodana jako plugin/usługa Capacitor po wyborze docelowego sposobu łączenia z siecią ESP32.
