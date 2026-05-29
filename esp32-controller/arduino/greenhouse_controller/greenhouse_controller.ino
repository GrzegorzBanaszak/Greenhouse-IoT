// Arduino IDE sketch generated from esp32-controller/src/main.cpp.
// Open this folder in Arduino IDE and upload to an ESP32 Dev Module.

#include <Arduino.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>
#include <ctype.h>
#include <math.h>
#include <time.h>
#include <vector>

#define PUMP_PIN 16
#define VALVE1_PIN 17
#define VALVE2_PIN 18
#define TRIG_PIN 32
#define ECHO_PIN 33

const float BARREL_CAPACITY_LITERS = 220.0;
const float BARREL_HEIGHT_CM = 104.0;
const float BARREL_DIAMETER_CM = 58.0;

// JSN-SR04T has a blind zone close to the sensor, so full barrel is not 0 cm.
const float FULL_DISTANCE_CM = 25.0;

// Distance when the barrel is empty, leaving a small mounting margin.
const float EMPTY_DISTANCE_CM = 100.0;

const int MIN_WATER_LEVEL_TO_RUN_PUMP = 10;
const bool RELAY_ACTIVE_LOW = true;
const unsigned long MAX_PUMP_RUNTIME_MS = 5 * 60 * 1000UL;

const char *AP_SSID = "Greenhouse_ESP32_01";
const char *AP_PASSWORD = "greenhouse123";
const char *MODE_NAME = "AP";

const unsigned long ECHO_TIMEOUT_US = 60000UL;
const unsigned long SCHEDULE_CHECK_INTERVAL_MS = 1000UL;
const size_t MAX_SCHEDULES = 8;

WebServer server(80);
Preferences preferences;

bool pumpState = false;
bool valve1State = false;
bool valve2State = false;
unsigned long pumpStartedAtMs = 0;

struct WaterSnapshot
{
    float distanceCm;
    int waterLevelPercent;
    float waterLiters;
    bool isValid;
};

struct IrrigationSchedule
{
    String id;
    String name;
    std::vector<String> days;
    String startTime;
    String valveMode;
    int durationSeconds;
    bool isEnabled;
    bool preventRunWhenWaterLow;
    unsigned long lastRunMinuteKey;
};

std::vector<IrrigationSchedule> schedules;
String activeScheduleId = "";
unsigned long activeScheduleEndsAtMs = 0;
unsigned long lastScheduleCheckMs = 0;

float calculateWaterLevelPercent(float distanceCm);
float calculateWaterLiters(float waterLevelPercent);
float roundToOneDecimal(float value);
void setRelay(int pin, bool state);
void applyPumpState(bool state);
void applyValve1State(bool state);
void applyValve2State(bool state);
void stopAllDevices();
float readDistanceOnceCm();
float measureDistanceCm();
WaterSnapshot readWaterSnapshot();
String normalizeToken(String value);
String makeScheduleId(String name);
void addCorsHeaders();
void sendJson(int statusCode, const String &payload);
void sendSuccess();
void sendError(int statusCode, const String &message);
void sendWaterLevelError(int waterLevelPercent);
bool tryStartPump(String &errorMessage, int &waterLevelPercent);
void appendWaterFields(JsonDocument &doc, const WaterSnapshot &snapshot);
void handleStatus();
void handleWaterLevel();
void handlePumpOn();
void handlePumpOff();
void handleValve1On();
void handleValve1Off();
void handleValve2On();
void handleValve2Off();
void handleAllOff();
bool parseStartTimeMinutes(const String &startTime, int &minutes);
bool isValidValveMode(const String &valveMode);
bool readScheduleFromJson(JsonObject obj, IrrigationSchedule &schedule, String &errorMessage);
void writeScheduleToJson(JsonObject obj, const IrrigationSchedule &schedule);
int findScheduleIndexById(const String &id);
void saveSchedules();
void loadSchedules();
void handleGetSchedules();
void handleCreateSchedule();
void deleteScheduleById(const String &id);
void handleDeleteSchedulePost();
bool getCurrentScheduleTime(String &day, int &minutesOfDay, unsigned long &minuteKey);
bool scheduleContainsDay(const IrrigationSchedule &schedule, const String &day);
bool startSchedule(IrrigationSchedule &schedule);
void processSchedules();
void enforcePumpTimeout();
void handleNotFound();
void setupRoutes();

float calculateWaterLevelPercent(float distanceCm)
{
    float percent = ((EMPTY_DISTANCE_CM - distanceCm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) * 100.0;

    if (percent < 0)
        percent = 0;
    if (percent > 100)
        percent = 100;

    return percent;
}

float calculateWaterLiters(float waterLevelPercent)
{
    return BARREL_CAPACITY_LITERS * (waterLevelPercent / 100.0);
}

float roundToOneDecimal(float value)
{
    return roundf(value * 10.0f) / 10.0f;
}

void setRelay(int pin, bool state)
{
    if (RELAY_ACTIVE_LOW)
    {
        digitalWrite(pin, state ? LOW : HIGH);
    }
    else
    {
        digitalWrite(pin, state ? HIGH : LOW);
    }
}

void initializeRelayPin(int pin)
{
    setRelay(pin, false);
    pinMode(pin, OUTPUT);
    setRelay(pin, false);
}

void applyPumpState(bool state)
{
    pumpState = state;
    setRelay(PUMP_PIN, state);
    pumpStartedAtMs = state ? millis() : 0;
}

void applyValve1State(bool state)
{
    valve1State = state;
    setRelay(VALVE1_PIN, state);
}

void applyValve2State(bool state)
{
    valve2State = state;
    setRelay(VALVE2_PIN, state);
}

void stopAllDevices()
{
    applyPumpState(false);
    applyValve1State(false);
    applyValve2State(false);
    activeScheduleId = "";
    activeScheduleEndsAtMs = 0;
}

float readDistanceOnceCm()
{
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(5);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(100);
    digitalWrite(TRIG_PIN, LOW);

    unsigned long duration = pulseInLong(ECHO_PIN, HIGH, ECHO_TIMEOUT_US);
    if (duration == 0)
    {
        return -1.0f;
    }

    float distanceCm = duration / 58.0f;
    if (distanceCm < 15.0f || distanceCm > 450.0f)
    {
        return -1.0f;
    }

    return distanceCm;
}

float measureDistanceCm()
{
    const int sampleCount = 7;
    float total = 0.0f;
    int validSamples = 0;

    for (int i = 0; i < sampleCount; i++)
    {
        float sample = readDistanceOnceCm();
        if (sample >= 0)
        {
            total += sample;
            validSamples++;
        }
        delay(60);
    }

    if (validSamples < 3)
    {
        return -1.0f;
    }

    return total / validSamples;
}

WaterSnapshot readWaterSnapshot()
{
    WaterSnapshot snapshot;
    snapshot.distanceCm = measureDistanceCm();
    snapshot.isValid = snapshot.distanceCm >= 0;

    if (!snapshot.isValid)
    {
        snapshot.waterLevelPercent = 0;
        snapshot.waterLiters = 0.0f;
        return snapshot;
    }

    float percent = calculateWaterLevelPercent(snapshot.distanceCm);
    snapshot.waterLevelPercent = (int)roundf(percent);
    snapshot.waterLiters = calculateWaterLiters(percent);
    return snapshot;
}

String normalizeToken(String value)
{
    value.trim();
    value.toUpperCase();
    return value;
}

String makeScheduleId(String name)
{
    String id = "";
    String source = name;
    source.toLowerCase();

    for (size_t i = 0; i < source.length(); i++)
    {
        char c = source.charAt(i);
        if (isalnum((unsigned char)c))
        {
            id += c;
        }
        else if (c == ' ' || c == '-' || c == '_')
        {
            if (!id.endsWith("-"))
            {
                id += "-";
            }
        }
    }

    id.trim();
    while (id.endsWith("-"))
    {
        id.remove(id.length() - 1);
    }

    if (id.length() == 0)
    {
        id = "schedule";
    }

    id += "-";
    id += String(millis());
    return id;
}

void addCorsHeaders()
{
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void sendJson(int statusCode, const String &payload)
{
    addCorsHeaders();
    server.send(statusCode, "application/json", payload);
}

void sendSuccess()
{
    StaticJsonDocument<64> doc;
    doc["success"] = true;
    String payload;
    serializeJson(doc, payload);
    sendJson(200, payload);
}

void sendError(int statusCode, const String &message)
{
    StaticJsonDocument<192> doc;
    doc["success"] = false;
    doc["error"] = message;
    String payload;
    serializeJson(doc, payload);
    sendJson(statusCode, payload);
}

void sendWaterLevelError(int waterLevelPercent)
{
    StaticJsonDocument<192> doc;
    doc["success"] = false;
    doc["error"] = "Water level too low";
    doc["waterLevelPercent"] = waterLevelPercent;
    String payload;
    serializeJson(doc, payload);
    sendJson(409, payload);
}

bool tryStartPump(String &errorMessage, int &waterLevelPercent)
{
    WaterSnapshot snapshot = readWaterSnapshot();
    waterLevelPercent = snapshot.waterLevelPercent;

    if (!snapshot.isValid)
    {
        errorMessage = "Water level measurement failed";
        return false;
    }

    if (snapshot.waterLevelPercent < MIN_WATER_LEVEL_TO_RUN_PUMP)
    {
        errorMessage = "Water level too low";
        return false;
    }

    applyPumpState(true);
    return true;
}

void appendWaterFields(JsonDocument &doc, const WaterSnapshot &snapshot)
{
    doc["distanceCm"] = snapshot.isValid ? roundToOneDecimal(snapshot.distanceCm) : -1.0f;
    doc["waterLevelPercent"] = snapshot.waterLevelPercent;
    doc["waterLiters"] = roundToOneDecimal(snapshot.waterLiters);
    doc["barrelCapacityLiters"] = BARREL_CAPACITY_LITERS;
}

void handleStatus()
{
    WaterSnapshot snapshot = readWaterSnapshot();
    StaticJsonDocument<768> doc;

    doc["pump"] = pumpState;
    doc["valve1"] = valve1State;
    doc["valve2"] = valve2State;
    appendWaterFields(doc, snapshot);
    doc["wifiRssi"] = WiFi.RSSI();
    doc["uptimeMs"] = millis();
    doc["mode"] = MODE_NAME;
    doc["ssid"] = AP_SSID;
    doc["ipAddress"] = WiFi.softAPIP().toString();

    String payload;
    serializeJson(doc, payload);
    sendJson(200, payload);
}

void handleWaterLevel()
{
    WaterSnapshot snapshot = readWaterSnapshot();
    StaticJsonDocument<256> doc;
    appendWaterFields(doc, snapshot);

    String payload;
    serializeJson(doc, payload);
    sendJson(snapshot.isValid ? 200 : 503, payload);
}

void handlePumpOn()
{
    String errorMessage;
    int waterLevelPercent = 0;
    if (!tryStartPump(errorMessage, waterLevelPercent))
    {
        if (errorMessage == "Water level too low")
        {
            sendWaterLevelError(waterLevelPercent);
            return;
        }

        sendError(503, errorMessage);
        return;
    }

    sendSuccess();
}

void handlePumpOff()
{
    applyPumpState(false);
    activeScheduleId = "";
    activeScheduleEndsAtMs = 0;
    sendSuccess();
}

void handleValve1On()
{
    applyValve1State(true);
    sendSuccess();
}

void handleValve1Off()
{
    applyValve1State(false);
    sendSuccess();
}

void handleValve2On()
{
    applyValve2State(true);
    sendSuccess();
}

void handleValve2Off()
{
    applyValve2State(false);
    sendSuccess();
}

void handleAllOff()
{
    stopAllDevices();
    sendSuccess();
}

bool parseStartTimeMinutes(const String &startTime, int &minutes)
{
    if (startTime.length() < 5 || startTime.charAt(2) != ':')
    {
        return false;
    }

    int hour = startTime.substring(0, 2).toInt();
    int minute = startTime.substring(3, 5).toInt();

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59)
    {
        return false;
    }

    minutes = hour * 60 + minute;
    return true;
}

bool isValidValveMode(const String &valveMode)
{
    return valveMode == "VALVE1" || valveMode == "VALVE2" || valveMode == "BOTH";
}

bool readScheduleFromJson(JsonObject obj, IrrigationSchedule &schedule, String &errorMessage)
{
    schedule.id = obj["id"] | "";
    schedule.name = obj["name"] | "";
    schedule.startTime = obj["startTime"] | "";
    schedule.valveMode = normalizeToken(obj["valveMode"] | "");
    schedule.durationSeconds = obj["durationSeconds"] | 0;
    schedule.isEnabled = obj["isEnabled"] | true;
    schedule.preventRunWhenWaterLow = obj["preventRunWhenWaterLow"] | true;
    schedule.lastRunMinuteKey = 0;
    schedule.days.clear();

    if (schedule.name.length() == 0)
    {
        errorMessage = "Schedule name is required";
        return false;
    }

    if (schedule.id.length() == 0)
    {
        schedule.id = makeScheduleId(schedule.name);
    }

    int ignoredMinutes = 0;
    if (!parseStartTimeMinutes(schedule.startTime, ignoredMinutes))
    {
        errorMessage = "startTime must use HH:mm format";
        return false;
    }

    if (!isValidValveMode(schedule.valveMode))
    {
        errorMessage = "valveMode must be VALVE1, VALVE2 or BOTH";
        return false;
    }

    if (schedule.durationSeconds <= 0 || schedule.durationSeconds > 3600)
    {
        errorMessage = "durationSeconds must be between 1 and 3600";
        return false;
    }

    JsonArray days = obj["days"].as<JsonArray>();
    if (days.isNull() || days.size() == 0)
    {
        errorMessage = "At least one day is required";
        return false;
    }

    for (JsonVariant day : days)
    {
        String normalizedDay = normalizeToken(day.as<String>());
        schedule.days.push_back(normalizedDay);
    }

    return true;
}

void writeScheduleToJson(JsonObject obj, const IrrigationSchedule &schedule)
{
    obj["id"] = schedule.id;
    obj["name"] = schedule.name;

    JsonArray days = obj.createNestedArray("days");
    for (const String &day : schedule.days)
    {
        days.add(day);
    }

    obj["startTime"] = schedule.startTime;
    obj["valveMode"] = schedule.valveMode;
    obj["durationSeconds"] = schedule.durationSeconds;
    obj["isEnabled"] = schedule.isEnabled;
    obj["preventRunWhenWaterLow"] = schedule.preventRunWhenWaterLow;
}

int findScheduleIndexById(const String &id)
{
    for (size_t i = 0; i < schedules.size(); i++)
    {
        if (schedules[i].id == id)
        {
            return (int)i;
        }
    }

    return -1;
}

void saveSchedules()
{
    StaticJsonDocument<4096> doc;
    JsonArray array = doc.to<JsonArray>();

    for (const IrrigationSchedule &schedule : schedules)
    {
        JsonObject obj = array.createNestedObject();
        writeScheduleToJson(obj, schedule);
    }

    String payload;
    serializeJson(doc, payload);
    preferences.putString("items", payload);
}

void loadSchedules()
{
    schedules.clear();
    String payload = preferences.getString("items", "[]");

    StaticJsonDocument<4096> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (error)
    {
        return;
    }

    JsonArray array = doc.as<JsonArray>();
    for (JsonObject obj : array)
    {
        IrrigationSchedule schedule;
        String errorMessage;
        if (readScheduleFromJson(obj, schedule, errorMessage))
        {
            schedules.push_back(schedule);
        }
    }
}

void handleGetSchedules()
{
    StaticJsonDocument<4096> doc;
    JsonArray array = doc.to<JsonArray>();

    for (const IrrigationSchedule &schedule : schedules)
    {
        JsonObject obj = array.createNestedObject();
        writeScheduleToJson(obj, schedule);
    }

    String payload;
    serializeJson(doc, payload);
    sendJson(200, payload);
}

void handleCreateSchedule()
{
    if (!server.hasArg("plain"))
    {
        sendError(400, "JSON body is required");
        return;
    }

    StaticJsonDocument<2048> doc;
    DeserializationError jsonError = deserializeJson(doc, server.arg("plain"));
    if (jsonError)
    {
        sendError(400, "Invalid JSON body");
        return;
    }

    IrrigationSchedule schedule;
    String errorMessage;
    if (!readScheduleFromJson(doc.as<JsonObject>(), schedule, errorMessage))
    {
        sendError(400, errorMessage);
        return;
    }

    int existingIndex = findScheduleIndexById(schedule.id);
    if (existingIndex >= 0)
    {
        schedule.lastRunMinuteKey = schedules[existingIndex].lastRunMinuteKey;
        schedules[existingIndex] = schedule;
    }
    else
    {
        if (schedules.size() >= MAX_SCHEDULES)
        {
            sendError(409, "Maximum schedule count reached");
            return;
        }

        schedules.push_back(schedule);
    }

    saveSchedules();
    sendSuccess();
}

void deleteScheduleById(const String &id)
{
    int index = findScheduleIndexById(id);
    if (index < 0)
    {
        sendError(404, "Schedule not found");
        return;
    }

    schedules.erase(schedules.begin() + index);
    if (activeScheduleId == id)
    {
        stopAllDevices();
    }

    saveSchedules();
    sendSuccess();
}

void handleDeleteSchedulePost()
{
    if (!server.hasArg("plain"))
    {
        sendError(400, "JSON body is required");
        return;
    }

    StaticJsonDocument<256> doc;
    DeserializationError jsonError = deserializeJson(doc, server.arg("plain"));
    if (jsonError)
    {
        sendError(400, "Invalid JSON body");
        return;
    }

    String id = doc["id"] | "";
    if (id.length() == 0)
    {
        sendError(400, "Schedule id is required");
        return;
    }

    deleteScheduleById(id);
}

bool getCurrentScheduleTime(String &day, int &minutesOfDay, unsigned long &minuteKey)
{
    struct tm timeInfo;
    if (!getLocalTime(&timeInfo, 50))
    {
        return false;
    }

    if (timeInfo.tm_year < 123)
    {
        return false;
    }

    const char *days[] = {
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY"};

    day = days[timeInfo.tm_wday];
    minutesOfDay = timeInfo.tm_hour * 60 + timeInfo.tm_min;
    minuteKey = (unsigned long)(time(nullptr) / 60);
    return true;
}

bool scheduleContainsDay(const IrrigationSchedule &schedule, const String &day)
{
    for (const String &scheduleDay : schedule.days)
    {
        if (scheduleDay == day)
        {
            return true;
        }
    }

    return false;
}

bool startSchedule(IrrigationSchedule &schedule)
{
    if (schedule.valveMode == "VALVE1" || schedule.valveMode == "BOTH")
    {
        applyValve1State(true);
    }

    if (schedule.valveMode == "VALVE2" || schedule.valveMode == "BOTH")
    {
        applyValve2State(true);
    }

    String errorMessage;
    int waterLevelPercent = 0;
    if (schedule.preventRunWhenWaterLow && !tryStartPump(errorMessage, waterLevelPercent))
    {
        applyValve1State(false);
        applyValve2State(false);
        return false;
    }

    if (!schedule.preventRunWhenWaterLow)
    {
        applyPumpState(true);
    }

    activeScheduleId = schedule.id;
    activeScheduleEndsAtMs = millis() + ((unsigned long)schedule.durationSeconds * 1000UL);
    return true;
}

void processSchedules()
{
    unsigned long nowMs = millis();

    if (activeScheduleId.length() > 0)
    {
        if ((long)(nowMs - activeScheduleEndsAtMs) >= 0)
        {
            stopAllDevices();
        }
        return;
    }

    if (nowMs - lastScheduleCheckMs < SCHEDULE_CHECK_INTERVAL_MS)
    {
        return;
    }
    lastScheduleCheckMs = nowMs;

    String currentDay;
    int currentMinutes = 0;
    unsigned long minuteKey = 0;
    if (!getCurrentScheduleTime(currentDay, currentMinutes, minuteKey))
    {
        // TODO: Add NTP or app-driven time synchronization for standalone AP mode.
        return;
    }

    for (IrrigationSchedule &schedule : schedules)
    {
        if (!schedule.isEnabled || schedule.lastRunMinuteKey == minuteKey)
        {
            continue;
        }

        int scheduleMinutes = 0;
        if (!parseStartTimeMinutes(schedule.startTime, scheduleMinutes))
        {
            continue;
        }

        if (scheduleMinutes == currentMinutes && scheduleContainsDay(schedule, currentDay))
        {
            if (startSchedule(schedule))
            {
                schedule.lastRunMinuteKey = minuteKey;
                saveSchedules();
                return;
            }
        }
    }
}

void enforcePumpTimeout()
{
    if (pumpState && pumpStartedAtMs > 0 && millis() - pumpStartedAtMs >= MAX_PUMP_RUNTIME_MS)
    {
        stopAllDevices();
    }
}

void handleNotFound()
{
    String uri = server.uri();
    if (server.method() == HTTP_DELETE && uri.startsWith("/api/schedules/"))
    {
        String id = uri.substring(String("/api/schedules/").length());
        if (id.length() == 0)
        {
            sendError(400, "Schedule id is required");
            return;
        }

        deleteScheduleById(id);
        return;
    }

    if (server.method() == HTTP_OPTIONS)
    {
        sendJson(204, "");
        return;
    }

    sendError(404, "Endpoint not found");
}

void setupRoutes()
{
    server.on("/api/status", HTTP_GET, handleStatus);
    server.on("/api/water-level", HTTP_GET, handleWaterLevel);

    server.on("/api/pump/on", HTTP_POST, handlePumpOn);
    server.on("/api/pump/off", HTTP_POST, handlePumpOff);

    server.on("/api/valve1/on", HTTP_POST, handleValve1On);
    server.on("/api/valve1/off", HTTP_POST, handleValve1Off);

    server.on("/api/valve2/on", HTTP_POST, handleValve2On);
    server.on("/api/valve2/off", HTTP_POST, handleValve2Off);

    server.on("/api/all/off", HTTP_POST, handleAllOff);

    server.on("/api/schedules", HTTP_GET, handleGetSchedules);
    server.on("/api/schedules", HTTP_POST, handleCreateSchedule);
    server.on("/api/schedules/delete", HTTP_POST, handleDeleteSchedulePost);
    server.onNotFound(handleNotFound);
}

void setup()
{
    Serial.begin(115200);

    initializeRelayPin(PUMP_PIN);
    initializeRelayPin(VALVE1_PIN);
    initializeRelayPin(VALVE2_PIN);
    stopAllDevices();

    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    digitalWrite(TRIG_PIN, LOW);
    delay(1000);

    preferences.begin("schedules", false);
    loadSchedules();

    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);

    Serial.print("Access Point started: ");
    Serial.println(AP_SSID);
    Serial.print("IP address: ");
    Serial.println(WiFi.softAPIP());

    setupRoutes();
    server.begin();
}

void loop()
{
    server.handleClient();
    enforcePumpTimeout();
    processSchedules();
}
