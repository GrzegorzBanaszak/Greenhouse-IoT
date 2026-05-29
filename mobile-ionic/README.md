# Greenhouse Controller Ionic

Startowy projekt aplikacji mobilnej Ionic React + Capacitor dla kontrolera szklarni ESP32.

## Co zawiera

- Ionic React z dolną nawigacją: Start, Szukaj, Sterowanie, Harmonogram.
- Capacitor skonfigurowany pod Androida.
- Serwis REST do API ESP32 pod `http://192.168.4.1`.
- Mock skanera Wi-Fi z sieciami `Greenhouse_ESP32_01` i `Greenhouse_ESP32_02`.
- Modele TypeScript dla statusu kontrolera, poziomu wody, Wi-Fi i harmonogramów.
- Ekrany odwzorowane pod istniejące szablony HTML z katalogu `templates/`.

## Komendy

```powershell
cd mobile-ionic
cmd /c npm install
cmd /c npm run dev
cmd /c npm run build
```

Jeżeli npm zwraca `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, użyj systemowego magazynu certyfikatów:

```powershell
cmd /c "set NODE_OPTIONS=--use-system-ca&& npm install"
cmd /c "set NODE_OPTIONS=--use-system-ca&& npm run build"
```

Android przez Capacitor:

```powershell
cd mobile-ionic
cmd /c npm run build
cmd /c npx cap add android
cmd /c npx cap sync android
cmd /c npx cap open android
```

## Ograniczenia startowego projektu

- Skanowanie Wi-Fi jest mockiem dev. Android wymaga natywnych uprawnień i często ogranicza automatyczne łączenie z siecią.
- Przy braku ESP32 ekran sterowania pokazuje dane przykładowe, a błędy API są prezentowane jako komunikaty.
- Folder `android/` jest generowany przez `npx cap add android` po zainstalowaniu zależności.
