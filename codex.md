Przygotuj projekt składający się z dwóch części:

1. Firmware ESP32 w Arduino/C++ lub PlatformIO.
2. Aplikacja mobilna Android w .NET MAUI/C#.

Projekt ma umożliwiać sterowanie systemem podlewania szklarni:

- pompą,
- dwoma zaworami,
- pomiarem poziomu wody w beczce za pomocą czujnika JSN-SR04T.

Do kontrolera ESP32 będą podłączone:

- GPIO 16 -> przekaźnik IN1 -> pompa
- GPIO 17 -> przekaźnik IN2 -> zawór 1
- GPIO 18 -> przekaźnik IN3 -> zawór 2
- GPIO 12 -> konwerter poziomów -> JSN-SR04T TRIG
- GPIO 13 -> konwerter poziomów -> JSN-SR04T ECHO

Beczka na wodę:

- typ: plastikowa beczka na deszczówkę/wodę
- pojemność: 220 litrów
- wysokość: około 104 cm
- szerokość/średnica: około 58 cm

Założenia pomiaru poziomu wody:
Czujnik JSN-SR04T jest zamontowany od góry beczki i mierzy odległość od czujnika do lustra wody.

W kodzie ESP32 dodaj następujące stałe konfiguracyjne:

const float BARREL_CAPACITY_LITERS = 220.0;
const float BARREL_HEIGHT_CM = 104.0;
const float BARREL_DIAMETER_CM = 58.0;

// JSN-SR04T nie powinien mierzyć odległości bardzo bliskich czujnikowi.
// Dlatego pełna beczka nie oznacza 0 cm, tylko bezpieczny margines.
const float FULL_DISTANCE_CM = 25.0;

// Odległość przy pustej beczce.
// Przy wysokości beczki ok. 104 cm zostawiamy mały margines montażowy.
const float EMPTY_DISTANCE_CM = 100.0;

// Minimalny poziom wody wymagany do uruchomienia pompy.
const int MIN_WATER_LEVEL_TO_RUN_PUMP = 10;

Dodaj funkcję obliczania procentowego poziomu wody:

float calculateWaterLevelPercent(float distanceCm) {
float percent = ((EMPTY_DISTANCE_CM - distanceCm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) \* 100.0;

    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;

    return percent;

}

Dodaj funkcję obliczania szacowanej ilości wody w litrach:

float calculateWaterLiters(float waterLevelPercent) {
return BARREL_CAPACITY_LITERS \* (waterLevelPercent / 100.0);
}

Status zwracany przez ESP32 powinien zawierać:

{
"pump": false,
"valve1": false,
"valve2": false,
"distanceCm": 52.0,
"waterLevelPercent": 63,
"waterLiters": 139,
"barrelCapacityLiters": 220,
"wifiRssi": -55,
"uptimeMs": 123456
}

Firmware ESP32:

- połącz z Wi-Fi,
- uruchom lokalny serwer HTTP,
- udostępnij REST API,
- obsłuż przekaźniki,
- obsłuż czujnik JSN-SR04T,
- oblicz poziom wody w procentach,
- oblicz ilość wody w litrach,
- zabezpiecz pompę przed pracą przy niskim poziomie wody.

Endpointy API:

GET /api/status

POST /api/pump/on
POST /api/pump/off

POST /api/valve1/on
POST /api/valve1/off

POST /api/valve2/on
POST /api/valve2/off

POST /api/all/off

GET /api/water-level

Dodaj obsługę przekaźników active LOW przez stałą:

const bool RELAY_ACTIVE_LOW = true;

Dodaj funkcję:

void setRelay(int pin, bool state) {
if (RELAY_ACTIVE_LOW) {
digitalWrite(pin, state ? LOW : HIGH);
} else {
digitalWrite(pin, state ? HIGH : LOW);
}
}

Po starcie ESP32 wszystkie urządzenia mają być wyłączone:

setRelay(PUMP_PIN, false);
setRelay(VALVE1_PIN, false);
setRelay(VALVE2_PIN, false);

Dodaj zabezpieczenia:

- pompa wyłączona po starcie,
- zawory zamknięte po starcie,
- endpoint awaryjny wyłączający wszystko,
- maksymalny czas pracy pompy: 5 minut,
- blokada włączenia pompy, jeżeli poziom wody jest poniżej 10%,
- po przekroczeniu maksymalnego czasu pracy pompa ma wyłączyć się automatycznie.

Dodaj stałą:

const unsigned long MAX_PUMP_RUNTIME_MS = 5 _ 60 _ 1000;

Jeżeli użytkownik próbuje uruchomić pompę przy niskim poziomie wody, API powinno zwrócić błąd:

{
"error": "Water level too low",
"waterLevelPercent": 8
}

Aplikacja mobilna:
Przygotuj aplikację Android w .NET MAUI/C#.

Aplikacja ma mieć 4 główne ekrany:

1. Ekran powitalny

- nazwa aplikacji: Greenhouse Controller
- ikona lub grafika szklarni
- tekst: "Steruj podlewaniem i monitoruj poziom wody"
- przycisk: "Rozpocznij"

2. Ekran wyszukiwania szklarni

- aplikacja powinna wyszukiwać sieci Wi-Fi udostępniane przez ESP32
- lista znalezionych urządzeń/sieci, np.:
  - Greenhouse_ESP32_01
  - Greenhouse_ESP32_02
- pokaż siłę sygnału Wi-Fi
- pokaż status: dostępna / połączono
- przycisk: "Skanuj ponownie"
- przycisk: "Połącz"
- po połączeniu przejdź do ekranu głównego

3. Ekran główny

- pokaż status połączenia z kontrolerem
- pokaż IP ESP32
- pokaż pojemność beczki:
  - 220 l
- pokaż aktualny poziom wody:
  - procent, np. 63%
  - litry, np. 139 l / 220 l
  - odległość z czujnika, np. 52 cm
- pokaż status pompy:
  - włączona / wyłączona
- pokaż status zaworu 1:
  - otwarty / zamknięty
- pokaż status zaworu 2:
  - otwarty / zamknięty
- dodaj przyciski:
  - Włącz pompę
  - Wyłącz pompę
  - Otwórz zawór 1
  - Zamknij zawór 1
  - Otwórz zawór 2
  - Zamknij zawór 2
  - Wyłącz wszystko
- pokaż ostrzeżenie, jeżeli poziom wody jest poniżej 10%

4. Ekran planowania automatycznego podlewania

- użytkownik może dodać harmonogram automatycznego podlewania
- formularz powinien zawierać:
  - nazwę harmonogramu
  - wybór dni tygodnia
  - godzinę uruchomienia
  - wybór zaworu: zawór 1 / zawór 2 / oba zawory
  - czas pracy pompy w sekundach lub minutach
  - przełącznik aktywny / nieaktywny
  - opcję: nie uruchamiaj, jeśli poziom wody poniżej 10%
- lista zapisanych harmonogramów, np.:
  - Poranne podlewanie, 06:30, zawór 1, 2 min, aktywny
  - Wieczorne podlewanie, 19:00, zawór 2, 3 min, aktywny

Dolna nawigacja aplikacji:

- Start
- Szukaj
- Sterowanie
- Harmonogram

Struktura aplikacji mobilnej:

MobileApp/
├── Models/
│ ├── ControllerStatus.cs
│ ├── WaterTankStatus.cs
│ └── IrrigationSchedule.cs
├── Services/
│ ├── Esp32ApiService.cs
│ └── WifiScannerService.cs
├── ViewModels/
│ ├── WelcomeViewModel.cs
│ ├── SearchGreenhouseViewModel.cs
│ ├── MainViewModel.cs
│ └── ScheduleViewModel.cs
├── Views/
│ ├── WelcomePage.xaml
│ ├── SearchGreenhousePage.xaml
│ ├── MainPage.xaml
│ └── SchedulePage.xaml
└── App.xaml

Model ControllerStatus powinien zawierać:

public class ControllerStatus
{
public bool Pump { get; set; }
public bool Valve1 { get; set; }
public bool Valve2 { get; set; }
public double DistanceCm { get; set; }
public int WaterLevelPercent { get; set; }
public double WaterLiters { get; set; }
public double BarrelCapacityLiters { get; set; }
public int WifiRssi { get; set; }
public long UptimeMs { get; set; }
}

Model harmonogramu:

public class IrrigationSchedule
{
public string Name { get; set; }
public List<DayOfWeek> Days { get; set; }
public TimeSpan StartTime { get; set; }
public string ValveMode { get; set; }
public int DurationSeconds { get; set; }
public bool IsEnabled { get; set; }
public bool PreventRunWhenWaterLow { get; set; }
}

Serwis Esp32ApiService powinien mieć metody:

Task<ControllerStatus?> GetStatusAsync(string ipAddress);

Task<bool> TurnPumpOnAsync(string ipAddress);
Task<bool> TurnPumpOffAsync(string ipAddress);

Task<bool> TurnValve1OnAsync(string ipAddress);
Task<bool> TurnValve1OffAsync(string ipAddress);

Task<bool> TurnValve2OnAsync(string ipAddress);
Task<bool> TurnValve2OffAsync(string ipAddress);

Task<bool> TurnAllOffAsync(string ipAddress);

Task<bool> CreateScheduleAsync(string ipAddress, IrrigationSchedule schedule);
Task<List<IrrigationSchedule>> GetSchedulesAsync(string ipAddress);
Task<bool> DeleteScheduleAsync(string ipAddress, string scheduleName);

Dodaj obsługę błędów:

- brak połączenia z ESP32,
- nieprawidłowy adres IP,
- ESP32 nie odpowiada,
- brak znalezionych sieci Wi-Fi,
- niski poziom wody,
- przekroczony maksymalny czas pracy pompy.

W README.md opisz:

- cel projektu,
- użyte elementy,
- mapowanie pinów,
- parametry beczki,
- sposób obliczania poziomu wody,
- endpointy API,
- sposób uruchomienia firmware ESP32,
- sposób uruchomienia aplikacji mobilnej,
- zasady bezpieczeństwa.
