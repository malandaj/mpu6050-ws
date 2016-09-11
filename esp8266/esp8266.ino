#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino
#include <ArduinoJson.h>          //https://github.com/bblanchon/ArduinoJson
#include <WebSocketsClient.h>
#include "I2Cdev.h"
#include "MPU6050.h"
#include "Wire.h"

MPU6050 accelgyro;
int16_t ax, ay, az;
int16_t gx, gy, gz;
int16_t cont=1;

WebSocketsClient webSocket;
const char* ssid     = "sensor";
const char* password = "1234567278";
const char* ws_server = "192.168.0.2";
int ws_port = 8080;

//flag for sending data
bool ban = false;

unsigned long previousMillis = 0;
const long interval = 10;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.println();
  
  Serial.println("local ip");
  Serial.println(WiFi.localIP());

  //Configure connection to mpu6050
  setupMPU();

  //Configure ws connection
  webSocket.begin(ws_server, ws_port);
  webSocket.onEvent(webSocketEvent);
}

void setupMPU(){
  Wire.begin();
  Serial.println("Initializing I2C devices...");
  accelgyro.initialize();
  //changing sensitivity
  accelgyro.setFullScaleAccelRange(MPU6050_ACCEL_FS_16);
  accelgyro.setFullScaleGyroRange(MPU6050_GYRO_FS_2000);
  // verify connection
  Serial.println("Testing device connections...");
  Serial.println(accelgyro.testConnection() ? "MPU6050 connection successful" : "MPU6050 connection failed");

  //Add calibration offsets
  accelgyro.setXAccelOffset(-4510);
  accelgyro.setYAccelOffset(-1840);
  accelgyro.setZAccelOffset(1150);
  accelgyro.setXGyroOffset(50);
  accelgyro.setYGyroOffset(-15);
  accelgyro.setZGyroOffset(24);
}


void webSocketEvent(WStype_t type, uint8_t * payload, size_t lenght) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WSc] Disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("[WSc] Connected");
      break;
    case WStype_TEXT:
      ban = !ban;
      break;
  }
}

struct SensorData {
   const char* ID;
   int16_t aX;
   int16_t aY;
   int16_t aZ;
   int16_t gX;
   int16_t gY;
   int16_t gZ;
   unsigned long prevMillis;
   int16_t conta;
};

#define SENSORDATA_JSON_SIZE (JSON_OBJECT_SIZE(9))

String serialize(const struct SensorData& data)
{
    StaticJsonBuffer<SENSORDATA_JSON_SIZE> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    root["ID"] = data.ID;
    root["aX"] = data.aX;
    root["aY"] = data.aY;
    root["aZ"] = data.aZ;
    root["gX"] = data.gX;
    root["gY"] = data.gY;
    root["gZ"] = data.gZ;
    root["millis"] = data.prevMillis;
    root["cont"] = data.conta;
    String datos;
    root.printTo(datos);
    return datos;
}

void loop() {
  // put your main code here, to run repeatedly:
  webSocket.loop();
  unsigned long currentMillis = millis();
  if(currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    if(ban){
      accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
      SensorData data = {"Sensor1", ax, ay, az, gx, gy, gz, previousMillis, cont};
      String json = serialize(data);
      cont++;
      webSocket.sendTXT(json);
    }
  }
}
