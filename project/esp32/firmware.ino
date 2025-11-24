#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ================= CONFIGURATION =================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://192.168.1.100:5000/api/data"; // REPLACE WITH YOUR PC'S IP

// Hall Sensor Settings (A3144)
const int hallSensorPin = 14; 
const float wheelCircumference = 2.10; // Meters (adjust for your wheel)
const unsigned long debounceTime = 20; // ms

// OLED Settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ================= GLOBALS =================
volatile unsigned long lastPulseTime = 0;
volatile unsigned long pulseInterval = 0;
volatile bool newPulse = false;
unsigned long lastSendTime = 0;
unsigned long startTime = 0;
float totalDistance = 0.0; // km

// Interrupt Service Routine for Hall Sensor
void IRAM_ATTR onPulse() {
  unsigned long currentTime = millis();
  if (currentTime - lastPulseTime > debounceTime) {
    pulseInterval = currentTime - lastPulseTime;
    lastPulseTime = currentTime;
    newPulse = true;
  }
}

void setup() {
  Serial.begin(115200);
  
  // Setup Hall Sensor
  pinMode(hallSensorPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(hallSensorPin), onPulse, FALLING);

  // Setup OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("TRACK-ON");
  display.println("BOOTING...");
  display.display();
  delay(1000);

  // Connect to WiFi
  display.clearDisplay();
  display.setCursor(0,0);
  display.println("Connecting WiFi...");
  display.display();
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  display.clearDisplay();
  display.setCursor(0,0);
  display.println("WiFi Connected!");
  display.print("IP: ");
  display.println(WiFi.localIP());
  display.display();
  delay(2000);
  
  startTime = millis();
}

void loop() {
  // Calculate Speed
  float speed = 0.0;
  if (millis() - lastPulseTime > 3000) {
    speed = 0.0;
    pulseInterval = 0;
  } else if (pulseInterval > 0) {
    speed = (wheelCircumference / (pulseInterval / 1000.0)) * 3.6;
  }

  // Update Distance
  if (newPulse) {
    totalDistance += (wheelCircumference / 1000.0);
    newPulse = false;
  }

  // Update OLED (every 200ms for smoothness)
  static unsigned long lastDisplayTime = 0;
  if (millis() - lastDisplayTime > 200) {
    updateDisplay(speed, totalDistance);
    lastDisplayTime = millis();
  }

  // Send Data (every 1 second)
  if (millis() - lastSendTime > 1000) {
    sendData(speed, totalDistance);
    lastSendTime = millis();
  }
}

void updateDisplay(float speed, float distance) {
  display.clearDisplay();

  // Header: TRACK-ON + IP
  display.setTextSize(1);
  display.setCursor(0,0);
  display.println("TRACK-ON");
  display.print("IP: ");
  display.println(WiFi.localIP());

  // Speed (Large)
  display.setTextSize(2);
  display.setCursor(0, 20);
  display.print(speed, 1);
  display.setTextSize(1);
  display.println(" km/h");

  // Distance
  display.setCursor(0, 40);
  display.print("DST: ");
  display.print(distance, 2);
  display.println(" km");

  // Time
  unsigned long elapsed = (millis() - startTime) / 1000;
  int h = elapsed / 3600;
  int m = (elapsed % 3600) / 60;
  int s = elapsed % 60;
  
  display.setCursor(0, 52);
  display.print("TIME: ");
  if(h<10) display.print("0"); 
  display.print(h); 
  display.print(":");
  if(m<10) display.print("0"); 
  display.print(m); 
  display.print(":");
  if(s<10) display.print("0"); 
  display.print(s);

  display.display();
}

void sendData(float speed, float distance) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    HTTPClient http;
    
    // Skip SSL certificate validation for self-signed cert
    client.setInsecure(); 
    
    http.begin(client, serverUrl); 
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["speed"] = speed;
    doc["distance"] = distance;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}
