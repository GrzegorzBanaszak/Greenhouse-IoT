const int TRIG_PIN = 32;
const int ECHO_PIN = 33;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  delay(1000);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(5);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(100);   // zamiast 10
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseInLong(ECHO_PIN, HIGH, 60000);

  if (duration == 0) {
    Serial.println("Brak ECHO");
  } else {
    float distanceCm = duration / 58.0;
    Serial.print("Odleglosc: ");
    Serial.print(distanceCm);
    Serial.println(" cm");
  }

  delay(1000);
}
