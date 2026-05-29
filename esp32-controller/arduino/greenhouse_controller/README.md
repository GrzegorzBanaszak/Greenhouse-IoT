# Arduino IDE upload

Ten folder zawiera wersję firmware jako sketch Arduino IDE:

```text
greenhouse_controller/
  greenhouse_controller.ino
```

Sketch testowy samego czujnika jest oddzielnie w:

```text
esp32-controller/arduino/czyjnik_odleglo/czyjnik_odleglo.ino
```

Nie trzymaj go w folderze `greenhouse_controller`, poniewaz Arduino IDE scala pliki `.ino` z jednego katalogu w jeden sketch.

## Jak wgrać na ESP32

1. Otwórz w Arduino IDE plik `greenhouse_controller.ino`.
2. Zainstaluj obsługę płytek ESP32, jeśli nie jest jeszcze dostępna.
3. Zainstaluj bibliotekę `ArduinoJson` w wersji 6.x.
4. Wybierz płytkę `ESP32 Dev Module` albo odpowiedni wariant Twojego ESP32.
5. Wybierz port COM.
6. Kliknij `Upload/Wgraj`.

Ustawienia typowe:

- Upload Speed: `921600` albo `115200`, jeśli upload jest niestabilny.
- Flash Frequency: `80 MHz`.
- Partition Scheme: domyślny.

Wersja PlatformIO nadal znajduje się w `esp32-controller/src/main.cpp`.
