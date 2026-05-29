# IoT Greenhouse Controller

## Cel projektu

Repozytorium zawiera kompletny system sterowania podlewaniem szklarni:

- firmware ESP32 w Arduino/PlatformIO,
- aplikację mobilną Android w .NET MAUI/C#.

ESP32 steruje pompą, dwoma zaworami oraz mierzy poziom wody w beczce 220 l czujnikiem JSN-SR04T. Aplikacja mobilna łączy się z Access Pointem ESP32, pokazuje stan kontrolera i umożliwia ręczne oraz automatyczne podlewanie.

## Zasady pracy

- Nie usuwać istniejącego kodu bez potrzeby.
- Trzymać firmware w `esp32-controller/`.
- Trzymać aplikację MAUI w `MobileApp/`.
- Po większych etapach uruchamiać dostępny build.
- Dla funkcji wymagających sprzętu dodawać mock/dev implementation i opisywać ograniczenia w README.
- Zachować czytelne nazwy klas, metod, endpointów i plików.

## Struktura katalogów

```text
esp32-controller/
  platformio.ini
  src/main.cpp
  README.md

MobileApp/
  Models/
  Services/
  ViewModels/
  Views/
  Platforms/Android/
  Resources/

templates/
  botanical_intelligence/
  ekran_powitalny/
  wyszukiwanie_urz_dze/
  panel_sterowania/
  harmonogram_podlewania/
```

## Komendy

Firmware ESP32:

```powershell
cd esp32-controller
pio run
pio run -t upload
pio device monitor
```

Aplikacja Android .NET MAUI:

```powershell
dotnet restore MobileApp/MobileApp.csproj
dotnet build MobileApp/MobileApp.csproj -f net9.0-android
```

Rozwiązanie:

```powershell
dotnet build Szklarnia.sln
```

## Najważniejsze założenia techniczne

- ESP32 pracuje jako Access Point `Greenhouse_ESP32_01` z IP `192.168.4.1`.
- Przekaźniki są domyślnie active LOW.
- Po starcie pompa i zawory są zawsze wyłączone.
- Pompa nie uruchamia się, gdy poziom wody jest poniżej 10% albo pomiar poziomu wody zwraca błąd.
- Maksymalny czas pracy pompy wynosi 5 minut.
- Harmonogramy są przechowywane w RAM i zapisywane w NVS przez `Preferences`.
- Pełne automatyczne harmonogramy wymagają poprawnego czasu systemowego/NTP; w trybie AP przygotowano strukturę pod dalszą synchronizację czasu.

## Aplikacja Ionic + Capacitor

Nowy kierunek dla aplikacji mobilnej to `mobile-ionic/`: Ionic React + TypeScript + Capacitor.
Katalog `MobileApp/` z .NET MAUI pozostaje w repozytorium jako poprzednia implementacja i nie powinien być usuwany bez wyraźnej decyzji.

Struktura:

```text
mobile-ionic/
  capacitor.config.ts
  package.json
  src/
    components/
    models/
    pages/
    services/
    theme/
```

Komendy:

```powershell
cd mobile-ionic
cmd /c npm install
cmd /c npm run dev
cmd /c npm run build
cmd /c npx cap add android
cmd /c npx cap sync android
cmd /c npx cap open android
```

Używaj `cmd /c npm ...`, bo PowerShell na tej maszynie może blokować `npm.ps1` przez ExecutionPolicy.
Jeżeli npm zgłasza `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, uruchamiaj komendy jako `cmd /c "set NODE_OPTIONS=--use-system-ca&& npm ..."` zamiast wyłączać walidację SSL.
