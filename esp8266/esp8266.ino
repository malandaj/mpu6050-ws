#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include "I2Cdev.h"
#include "MPU6050.h"
#include "Wire.h"
#include <WebSocketsClient.h>

extern "C" {
#include <user_interface.h>
}

MPU6050 accelgyro;
int16_t ax, ay, az;
int16_t gx, gy, gz;

WebSocketsClient webSocket;
// Update these with values suitable for your network.
//const char* ssid = "BrokenBrains";
//const char* password = "1234567278";
//const char* ws = "192.168.2.116"; // ip addres of nodejs server

const char* ssid = "hackmeifucan";
const char* password = "Bpy()[wmmt]w#j$Q}X8S58$yH^:Hx5t)cTmSAad~SR*9z";
const char* ws = "192.168.0.2"; // ip addres of nodejs server

unsigned long lastMsg = 0;
int cont = 0;
const long interval = 10;

bool ban = false;

#define packetSize (180)

void setup() {
  Serial.begin(115200);
  setup_wifi();
  Wire.begin();
  Serial.println("Initializing I2C devices...");
  accelgyro.initialize();
  // verify connection
  Serial.println("Testing device connections...");
  Serial.println(accelgyro.testConnection() ? "MPU6050 connection successful" : "MPU6050 connection failed");
  webSocket.begin(ws, 8080);
  webSocket.onEvent(webSocketEvent);
  wifi_set_sleep_type(NONE_SLEEP_T);
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t lenght) {
  switch(type) {
    case WStype_DISCONNECTED:
        Serial.println("Desconectado");
      break;
    case WStype_CONNECTED:{
        Serial.println("Conectado");
      }
      break;
    case WStype_TEXT:
        //Serial.printf("Recibi: %s\n", payload);
        ban = !ban;
      break;
  }
}

void loop() {
  unsigned long now = millis();
  // send one lecture every 10ms (100Hz)
  if(ban){
    if (now - lastMsg >= interval) {
      lastMsg = now;
      accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
      StaticJsonBuffer<packetSize> jsonBuffer;
      JsonObject& root = jsonBuffer.createObject();
      String JSON;
      root["ID"] = "Sensor2";
      root["accX"] = ax;
      root["accY"] = ay;
      root["accZ"] = az;
      root["gyroX"] = gx;
      root["gyroY"] = gy;
      root["gyroZ"] = gz;
      root["millis"] = lastMsg;
      root["cont"] = cont;
      ++cont;
      root.printTo(JSON);
      webSocket.sendTXT(JSON);
    }
  }
}
