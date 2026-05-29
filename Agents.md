Jesteś Claude Code pracującym w repozytorium projektu IoT Greenhouse Controller.

Twoim zadaniem jest przygotowanie kompletnego projektu składającego się z dwóch części:

1. Firmware dla ESP32 w Arduino/C++ albo PlatformIO.
2. Aplikacja mobilna Android w .NET MAUI/C#.

Projekt ma służyć do sterowania systemem podlewania szklarni. ESP32 będzie sterować pompą, dwoma zaworami oraz mierzyć poziom wody w beczce za pomocą czujnika JSN-SR04T. Aplikacja mobilna ma łączyć się z kontrolerem ESP32, pokazywać poziom wody i umożliwiać ręczne oraz automatyczne sterowanie podlewaniem.

Przed rozpoczęciem implementacji:

1. Przeanalizuj aktualną strukturę repozytorium.
2. Zaproponuj plan zmian.
3. Utwórz lub zaktualizuj plik CLAUDE.md z opisem projektu, zasadami pracy, komendami build/test oraz strukturą katalogów.
4. Następnie wykonuj implementację etapami.
5. Po każdym większym etapie sprawdź, czy projekt się kompiluje.
6. Nie usuwaj istniejącego kodu bez potrzeby.
7. Stosuj czytelne nazwy klas, metod i plików.
8. Dodaj README.md opisujący projekt.

====================================================
CZĘŚĆ 1 — FIRMWARE ESP32
====================================================

Przygotuj firmware ESP32 w Arduino/C++ lub PlatformIO.

Preferowana struktura:

esp32-controller/
├── platformio.ini
├── src/
│ └── main.cpp
└── README.md

Jeżeli repozytorium jest już zorganizowane inaczej, dopasuj się do istniejącej struktury.

ESP32 ma obsługiwać:

- pompę przez przekaźnik,
- zawór 1 przez przekaźnik,
- zawór 2 przez przekaźnik,
- czujnik odległości JSN-SR04T przez konwerter poziomów logicznych.

Mapowanie pinów ESP32:

- GPIO 16 -> przekaźnik IN1 -> pompa
- GPIO 17 -> przekaźnik IN2 -> zawór 1
- GPIO 18 -> przekaźnik IN3 -> zawór 2
- GPIO 12 -> konwerter poziomów -> JSN-SR04T TRIG
- GPIO 13 -> konwerter poziomów -> JSN-SR04T ECHO

Dodaj w kodzie stałe:

#define PUMP_PIN 16
#define VALVE1_PIN 17
#define VALVE2_PIN 18
#define TRIG_PIN 12
#define ECHO_PIN 13

====================================================
PARAMETRY BECZKI
====================================================

System będzie używał plastikowej beczki na wodę/deszczówkę.

Parametry beczki:

- pojemność: 220 litrów,
- wysokość: około 104 cm,
- średnica/szerokość: około 58 cm.

Czujnik JSN-SR04T jest zamontowany od góry beczki i mierzy odległość od czujnika do lustra wody.

Dodaj stałe konfiguracyjne:

const float BARREL_CAPACITY_LITERS = 220.0;
const float BARREL_HEIGHT_CM = 104.0;
const float BARREL_DIAMETER_CM = 58.0;

// JSN-SR04T ma martwą strefę blisko czujnika.
// Dlatego pełna beczka nie oznacza 0 cm od czujnika.
const float FULL_DISTANCE_CM = 25.0;

// Odległość przy pustej beczce.
// Przy wysokości beczki ok. 104 cm zostawiamy margines montażowy.
const float EMPTY_DISTANCE_CM = 100.0;

// Minimalny poziom wody do uruchomienia pompy.
const int MIN_WATER_LEVEL_TO_RUN_PUMP = 10;

Dodaj funkcję obliczania procentowego poziomu wody:

float calculateWaterLevelPercent(float distanceCm) {
float percent = ((EMPTY_DISTANCE_CM - distanceCm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) \* 100.0;

    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;

    return percent;

}

Dodaj funkcję obliczania ilości wody w litrach:

float calculateWaterLiters(float waterLevelPercent) {
return BARREL_CAPACITY_LITERS \* (waterLevelPercent / 100.0);
}

Ważne:

- wynik w litrach jest szacunkowy,
- beczka nie musi być idealnym walcem,
- w przyszłości można dodać kalibrację wielopunktową.

====================================================
PRZEKAŹNIKI
====================================================

Wiele modułów przekaźnikowych działa jako active LOW, czyli:

- LOW = włączony,
- HIGH = wyłączony.

Dodaj stałą:

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

Stan początkowy:

bool pumpState = false;
bool valve1State = false;
bool valve2State = false;

====================================================
POMIAR ODLEGŁOŚCI JSN-SR04T
====================================================

Dodaj funkcję mierzącą odległość w centymetrach.

Wymagania:

- użyj TRIG_PIN i ECHO_PIN,
- dodaj timeout dla pulseIn,
- w przypadku błędu zwróć wartość specjalną, np. -1,
- wykonuj kilka pomiarów i uśredniaj wynik,
- odfiltruj błędne odczyty.

Przykładowa logika:

1. Ustaw TRIG LOW.
2. Poczekaj kilka mikrosekund.
3. Ustaw TRIG HIGH na 10 mikrosekund.
4. Ustaw TRIG LOW.
5. Odczytaj czas impulsu z ECHO.
6. Przelicz na odległość w cm.
7. Jeżeli brak echo, zwróć błąd pomiaru.

====================================================
WI-FI I TRYB PRACY ESP32
====================================================

Firmware powinien obsługiwać przynajmniej tryb Access Point.

ESP32 powinien wystawiać własną sieć Wi-Fi, np.:

SSID: Greenhouse_ESP32_01
Password: greenhouse123

IP domyślne Access Point:

192.168.4.1

Dzięki temu aplikacja mobilna będzie mogła wyszukiwać sieci Wi-Fi udostępniane przez ESP32.

Opcjonalnie możesz przygotować strukturę kodu pod przyszły tryb STA, gdzie ESP32 łączy się z domowym routerem.

====================================================
HTTP API ESP32
====================================================

ESP32 ma uruchomić lokalny serwer HTTP i udostępniać REST API.

Endpointy:

GET /api/status

POST /api/pump/on
POST /api/pump/off

POST /api/valve1/on
POST /api/valve1/off

POST /api/valve2/on
POST /api/valve2/off

POST /api/all/off

GET /api/water-level

Dodatkowo dodaj endpointy dla harmonogramów podlewania:

GET /api/schedules
POST /api/schedules
DELETE /api/schedules/{id}

Jeżeli implementacja DELETE z parametrem w ścieżce jest trudna w użytej bibliotece, możesz zastosować:

POST /api/schedules/delete

====================================================
FORMAT STATUSU
====================================================

GET /api/status powinien zwracać JSON:

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

GET /api/water-level powinien zwracać JSON:

{
"distanceCm": 52.0,
"waterLevelPercent": 63,
"waterLiters": 139.0,
"barrelCapacityLiters": 220.0
}

====================================================
ZABEZPIECZENIA
====================================================

Dodaj zabezpieczenia:

1. Pompa zawsze wyłączona po starcie.
2. Zawory zawsze zamknięte po starcie.
3. Endpoint awaryjny POST /api/all/off wyłącza pompę i zamyka oba zawory.
4. Maksymalny czas pracy pompy: 5 minut.
5. Blokada uruchomienia pompy, jeżeli poziom wody jest poniżej 10%.
6. Jeżeli pomiar poziomu wody zwraca błąd, nie uruchamiaj pompy.
7. Po przekroczeniu maksymalnego czasu pracy pompy wyłącz ją automatycznie.
8. Po błędzie API zwracaj czytelny JSON.

Dodaj stałą:

const unsigned long MAX_PUMP_RUNTIME_MS = 5 _ 60 _ 1000;

Jeżeli użytkownik próbuje uruchomić pompę przy niskim poziomie wody, zwróć:

{
"success": false,
"error": "Water level too low",
"waterLevelPercent": 8
}

Jeżeli wszystko działa poprawnie, zwracaj:

{
"success": true
}

====================================================
HARMONOGRAMY PODLEWANIA NA ESP32
====================================================

Dodaj podstawowy model harmonogramu podlewania.

Harmonogram powinien zawierać:

- id,
- name,
- days,
- startTime,
- valveMode,
- durationSeconds,
- isEnabled,
- preventRunWhenWaterLow.

Przykładowy JSON:

{
"id": "morning-valve-1",
"name": "Poranne podlewanie",
"days": ["MONDAY", "TUESDAY", "WEDNESDAY"],
"startTime": "06:30",
"valveMode": "VALVE1",
"durationSeconds": 120,
"isEnabled": true,
"preventRunWhenWaterLow": true
}

Na tym etapie możesz przygotować prostą pamięć harmonogramów w RAM.
Jeżeli to możliwe, dodaj zapis do pamięci nieulotnej, np. Preferences/NVS.

Tryby valveMode:

- VALVE1
- VALVE2
- BOTH

Automatyczne podlewanie powinno:

1. Sprawdzić, czy harmonogram jest aktywny.
2. Sprawdzić dzień tygodnia i godzinę.
3. Sprawdzić poziom wody, jeśli preventRunWhenWaterLow = true.
4. Otworzyć wybrany zawór/zawory.
5. Włączyć pompę.
6. Po durationSeconds wyłączyć pompę.
7. Zamknąć zawory.
8. Nie pozwalać na równoczesne uruchomienie kilku harmonogramów.

Jeżeli pełna obsługa czasu rzeczywistego wymaga NTP, przygotuj kod tak, aby później można było dodać synchronizację czasu. Możesz dodać TODO i prosty interfejs czasu.

====================================================
CZĘŚĆ 2 — APLIKACJA MOBILNA .NET MAUI
====================================================

Przygotuj aplikację mobilną Android w .NET MAUI/C#.

Preferowana struktura:

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

Jeżeli projekt .NET MAUI jeszcze nie istnieje, utwórz go.
Jeżeli istnieje, dopasuj się do obecnej struktury.

====================================================
EKRANY APLIKACJI
====================================================

Aplikacja ma mieć 4 główne ekrany:

1. Ekran powitalny
2. Ekran wyszukiwania szklarni
3. Ekran główny sterowania
4. Ekran harmonogramów automatycznego podlewania

Dodaj dolną nawigację:

- Start
- Szukaj
- Sterowanie
- Harmonogram

====================================================
EKRAN 1 — POWITALNY
====================================================

Ekran powitalny powinien zawierać:

- nazwę aplikacji: Greenhouse Controller,
- ikonę lub prostą grafikę szklarni,
- tekst: "Steruj podlewaniem i monitoruj poziom wody",
- przycisk: "Rozpocznij".

Po kliknięciu "Rozpocznij" przejdź do ekranu wyszukiwania szklarni.

====================================================
EKRAN 2 — WYSZUKIWANIE SZKLARNI
====================================================

Ekran wyszukiwania powinien:

- wyszukiwać sieci Wi-Fi udostępniane przez ESP32,
- pokazywać listę znalezionych sieci,
- filtrować sieci zaczynające się od "Greenhouse_ESP32",
- pokazywać nazwę sieci SSID,
- pokazywać siłę sygnału,
- pokazywać status: dostępna / połączono,
- mieć przycisk "Skanuj ponownie",
- mieć przycisk "Połącz".

Przykładowe sieci:

- Greenhouse_ESP32_01
- Greenhouse_ESP32_02

Po połączeniu aplikacja powinna używać domyślnego IP:

192.168.4.1

Uwaga:
Na Androidzie skanowanie Wi-Fi wymaga odpowiednich uprawnień. Dodaj potrzebne permission do AndroidManifest.xml. Jeżeli pełne skanowanie Wi-Fi jest ograniczone przez system Android, przygotuj interfejs WifiScannerService oraz wersję mock/dev, która pozwala testować UI bez fizycznego urządzenia.

====================================================
EKRAN 3 — GŁÓWNY
====================================================

Ekran główny powinien pokazywać:

- status połączenia z kontrolerem,
- nazwę sieci ESP32,
- IP ESP32,
- pojemność beczki: 220 l,
- aktualny poziom wody w procentach,
- aktualną ilość wody w litrach,
- odległość od czujnika w cm,
- status pompy,
- status zaworu 1,
- status zaworu 2.

Wskaźnik wody:

- duży okrągły lub kartowy wskaźnik,
- przykład:
  - Poziom wody: 63%
  - 139 l / 220 l
  - Odległość: 52 cm

Przyciski:

- Włącz pompę
- Wyłącz pompę
- Otwórz zawór 1
- Zamknij zawór 1
- Otwórz zawór 2
- Zamknij zawór 2
- Wyłącz wszystko

Dodaj ostrzeżenie, jeżeli poziom wody jest poniżej 10%:

"Niski poziom wody — pompa zablokowana"

Dodaj informację:

"Maksymalny czas pracy pompy: 5 minut"

Po każdej akcji aplikacja ma automatycznie odświeżyć status z ESP32.

====================================================
EKRAN 4 — HARMONOGRAMY
====================================================

Ekran harmonogramów powinien umożliwiać:

- wyświetlenie listy harmonogramów,
- dodanie nowego harmonogramu,
- usunięcie harmonogramu,
- aktywowanie/dezaktywowanie harmonogramu.

Lista harmonogramów powinna pokazywać:

- nazwę,
- godzinę,
- dni tygodnia,
- wybrany zawór,
- czas pracy,
- status aktywny/nieaktywny.

Przykłady:

1. Poranne podlewanie
   - 06:30
   - Zawór 1
   - 2 min
   - aktywny

2. Wieczorne podlewanie
   - 19:00
   - Zawór 2
   - 3 min
   - aktywny

Formularz dodawania harmonogramu:

- nazwa harmonogramu,
- wybór dni tygodnia,
- godzina uruchomienia,
- wybór zaworu:
  - Zawór 1
  - Zawór 2
  - Oba zawory
- czas pracy pompy w sekundach lub minutach,
- przełącznik aktywny / nieaktywny,
- przełącznik: nie uruchamiaj, jeśli poziom wody poniżej 10%,
- przycisk "Zapisz harmonogram".

====================================================
MODELE C#
====================================================

Dodaj model ControllerStatus:

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
public string Mode { get; set; }
public string Ssid { get; set; }
public string IpAddress { get; set; }
}

Dodaj model IrrigationSchedule:

public class IrrigationSchedule
{
public string Id { get; set; }
public string Name { get; set; }
public List<DayOfWeek> Days { get; set; }
public TimeSpan StartTime { get; set; }
public string ValveMode { get; set; }
public int DurationSeconds { get; set; }
public bool IsEnabled { get; set; }
public bool PreventRunWhenWaterLow { get; set; }
}

Dodaj model WifiNetworkInfo:

public class WifiNetworkInfo
{
public string Ssid { get; set; }
public int SignalStrength { get; set; }
public bool IsConnected { get; set; }
}

====================================================
SERWIS HTTP
====================================================

Dodaj klasę Esp32ApiService.

Metody:

Task<ControllerStatus?> GetStatusAsync(string ipAddress);

Task<bool> TurnPumpOnAsync(string ipAddress);
Task<bool> TurnPumpOffAsync(string ipAddress);

Task<bool> TurnValve1OnAsync(string ipAddress);
Task<bool> TurnValve1OffAsync(string ipAddress);

Task<bool> TurnValve2OnAsync(string ipAddress);
Task<bool> TurnValve2OffAsync(string ipAddress);

Task<bool> TurnAllOffAsync(string ipAddress);

Task<List<IrrigationSchedule>> GetSchedulesAsync(string ipAddress);
Task<bool> CreateScheduleAsync(string ipAddress, IrrigationSchedule schedule);
Task<bool> DeleteScheduleAsync(string ipAddress, string scheduleId);

Bazowy adres ESP32:

http://192.168.4.1

Albo dynamicznie:

http://{ipAddress}

Dodaj obsługę:

- timeout HTTP,
- błędów połączenia,
- błędów JSON,
- błędów API zwracanych przez ESP32.

====================================================
WIFI SCANNER SERVICE
====================================================

Dodaj interfejs:

public interface IWifiScannerService
{
Task<List<WifiNetworkInfo>> ScanForGreenhouseNetworksAsync();
Task<bool> ConnectToNetworkAsync(string ssid);
}

Dodaj implementację mock/dev, która zwraca przykładowe sieci:

- Greenhouse_ESP32_01
- Greenhouse_ESP32_02

Jeżeli jesteś w stanie dodać implementację Android, dodaj ją z odpowiednimi uprawnieniami.
Jeżeli Android ogranicza automatyczne łączenie z Wi-Fi, przygotuj kod tak, aby użytkownik mógł wybrać sieć i przejść do ustawień Wi-Fi.

====================================================
VIEWMODELE
====================================================

Dodaj ViewModele:

WelcomeViewModel
SearchGreenhouseViewModel
MainViewModel
ScheduleViewModel

Użyj MVVM.

Każdy ViewModel powinien obsługiwać:

- IsBusy,
- ErrorMessage,
- podstawową walidację,
- komendy użytkownika.

MainViewModel powinien mieć komendy:

RefreshStatusCommand
TurnPumpOnCommand
TurnPumpOffCommand
TurnValve1OnCommand
TurnValve1OffCommand
TurnValve2OnCommand
TurnValve2OffCommand
TurnAllOffCommand

ScheduleViewModel powinien mieć komendy:

LoadSchedulesCommand
AddScheduleCommand
DeleteScheduleCommand
ToggleScheduleCommand

SearchGreenhouseViewModel powinien mieć komendy:

ScanNetworksCommand
ConnectCommand

====================================================
UI / UX
====================================================

Styl aplikacji:

- nowoczesny,
- prosty,
- jasny,
- motyw smart greenhouse,
- kolory: zieleń, jasne tło, delikatne karty,
- duże przyciski,
- czytelne statusy,
- zaokrąglone karty,
- ikony dla wody, pompy, zaworów i Wi-Fi.

Dodaj komunikaty:

- "Łączenie z kontrolerem..."
- "Skanowanie sieci Wi-Fi..."
- "Nie znaleziono szklarni w pobliżu"
- "ESP32 nie odpowiada"
- "Niski poziom wody — pompa zablokowana"
- "Wszystkie urządzenia zostały wyłączone"

====================================================
README
====================================================

Przygotuj README.md w głównym katalogu projektu.

README ma zawierać:

1. Opis projektu.
2. Użyte technologie.
3. Schemat działania.
4. Mapowanie pinów ESP32.
5. Parametry beczki:
   - 220 l,
   - wysokość około 104 cm,
   - średnica około 58 cm,
   - FULL_DISTANCE_CM = 25 cm,
   - EMPTY_DISTANCE_CM = 100 cm.
6. Sposób liczenia poziomu wody.
7. Endpointy API.
8. Opis ekranów aplikacji mobilnej.
9. Instrukcję uruchomienia firmware ESP32.
10. Instrukcję uruchomienia aplikacji .NET MAUI.
11. Zasady bezpieczeństwa.
12. Plan dalszego rozwoju.

====================================================
KRYTERIA AKCEPTACJI
====================================================

Projekt uznaj za gotowy, jeżeli:

1. Firmware ESP32 kompiluje się.
2. Wszystkie piny są skonfigurowane zgodnie ze specyfikacją.
3. Po starcie pompa i zawory są wyłączone.
4. ESP32 tworzy sieć Wi-Fi Greenhouse_ESP32_01.
5. ESP32 udostępnia API HTTP.
6. GET /api/status zwraca poprawny JSON.
7. GET /api/water-level zwraca procent i litry wody.
8. POST /api/pump/on uruchamia pompę tylko wtedy, gdy poziom wody jest bezpieczny.
9. POST /api/all/off wyłącza pompę i zamyka zawory.
10. Aplikacja mobilna ma 4 ekrany:
    - powitalny,
    - wyszukiwania szklarni,
    - główny,
    - harmonogramów.
11. Ekran główny pokazuje:
    - poziom wody w procentach,
    - ilość wody w litrach,
    - 139 l / 220 l lub podobny format,
    - status pompy,
    - status zaworu 1,
    - status zaworu 2.
12. Aplikacja obsługuje błędy połączenia.
13. README opisuje cały projekt.
14. Kod jest czytelny i podzielony na warstwy.
15. Jeżeli nie da się czegoś w pełni zaimplementować bez fizycznego ESP32 albo telefonu Android, dodaj mock/dev implementation oraz opisz ograniczenie w README.

====================================================
KOLEJNOŚĆ PRACY
====================================================

Pracuj w następującej kolejności:

1. Przeanalizuj repozytorium.
2. Utwórz lub zaktualizuj CLAUDE.md.
3. Utwórz strukturę projektu.
4. Zaimplementuj firmware ESP32:
   - piny,
   - przekaźniki,
   - pomiar JSN-SR04T,
   - obliczanie poziomu wody,
   - HTTP API,
   - zabezpieczenia.
5. Zaimplementuj aplikację .NET MAUI:
   - modele,
   - serwisy,
   - ViewModele,
   - widoki,
   - nawigację.
6. Dodaj mock Wi-Fi scanner.
7. Dodaj obsługę harmonogramów.
8. Dodaj README.
9. Uruchom build/test, jeżeli środowisko na to pozwala.
10. Na końcu podsumuj:
    - jakie pliki utworzono,
    - jakie funkcje działają,
    - czego nie udało się zweryfikować bez sprzętu,
    - co należy przetestować na fizycznym ESP32.
