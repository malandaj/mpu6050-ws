#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino
#include <ArduinoJson.h>          //https://github.com/bblanchon/ArduinoJson
#include <WebSocketsClient.h>
#include "I2Cdev.h"
#include "MPU6050.h"
#include "Wire.h"
#include <vector>

//OTA
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
//#define DEBUG_ON

extern "C" {
  #include "user_interface.h"
}

MPU6050 accelgyro;
int16_t ax, ay, az;
int16_t gx, gy, gz;
unsigned long cont=1;

WebSocketsClient webSocket;
//const char* ssid     = "pelas2";
//const char* password = "5875CC58yUkbK256";
//const char* ws_server = "192.168.100.7";

const char* ssid     = "sensor";
const char* password = "1234567278";
const char* ws_server = "192.168.0.101";
int ws_port = 3000;

const char* idSensor = "Sensor1";
const char* numSensor = "1";

//flag for sending data
bool ban = false;

unsigned long previousMillis = 0;
const long interval = 10;

struct SensorData {
        const char* ID;
        int16_t aX;
        int16_t aY;
        int16_t aZ;
        int16_t gX;
        int16_t gY;
        int16_t gZ;
        unsigned long prevMillis;
        unsigned long conta;
};

const int BUFFER_SIZE = JSON_OBJECT_SIZE(2) + JSON_ARRAY_SIZE(80) + 200;
uint8_t nLect = 5;

static std::vector<struct SensorData> vData(nLect);
int counter = 0;

void setup() {
        // put your setup code here, to run once:
        Serial.begin(115200);
        Serial.println();

        //connect to WiFi
        setupWiFi();

        //configure OTA
        setupOTA();

        //Configure connection to mpu6050
        setupMPU();

        //Configure ws connection
        webSocket.begin(ws_server, ws_port, "/", idSensor);
        webSocket.onEvent(webSocketEvent);
//        Serial.setDebugOutput(true);

        vData.clear();
}

void setupOTA(){
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH)
      type = "sketch";
    else // U_SPIFFS
      type = "filesystem";

    // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
    Serial.println("Start updating " + type);
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });
  ArduinoOTA.begin();
}

void setupWiFi(){
        wifi_set_sleep_type(NONE_SLEEP_T);
        WiFi.mode(WIFI_STA);
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) {
                delay(500);
        #ifdef DEBUG_ON
                Serial.print(".");
        #endif
        }
  #ifdef DEBUG_ON
        Serial.println("");
        Serial.println("WiFi connected");
        Serial.println("IP address: ");
        Serial.println(WiFi.localIP());
  #endif
}

void setupMPU(){
        Wire.begin();
  #ifdef DEBUG_ON
        Serial.println("Initializing I2C devices...");
  #endif
        accelgyro.initialize();
        //changing sensitivity
        accelgyro.setFullScaleAccelRange(MPU6050_ACCEL_FS_4);
        accelgyro.setFullScaleGyroRange(MPU6050_GYRO_FS_500);
        // verify connection
  #ifdef DEBUG_ON
        Serial.println("Testing device connections...");
        Serial.println(accelgyro.testConnection() ? "MPU6050 connection successful" : "MPU6050 connection failed");
  #endif

        //set offsets
        accelgyro.setXAccelOffset(34);
        accelgyro.setYAccelOffset(10);
        accelgyro.setZAccelOffset(1094);
        accelgyro.setXGyroOffset(40);
        accelgyro.setYGyroOffset(13);
        accelgyro.setZGyroOffset(-29);
}


void webSocketEvent(WStype_t type, uint8_t * payload, size_t lenght) {
        switch(type) {
        case WStype_DISCONNECTED: {
      #ifdef DEBUG_ON
                Serial.println("[WSc] Disconnected!");
      #endif
        }
        break;
        case WStype_CONNECTED: {
      #ifdef DEBUG_ON
                Serial.println("[WSc] Connected");
      #endif
        }
        break;
        case WStype_TEXT: {
                String message = (char * )payload;
      #ifdef DEBUG_ON
                Serial.println(message);
      #endif
                if(message == "startPreview")
                        ban = true;
                else if(message == "stopPreview")
                        ban = false;
                else if(message == "calibrate") {
                        ban = false;
                }
        }
        break;
        }
}

String serialize(){
        StaticJsonBuffer<BUFFER_SIZE> jsonBuffer;
        JsonObject& root = jsonBuffer.createObject();
        root["ID"] = vData[0].ID;
        JsonArray& lect = root.createNestedArray("lectures");
        for(int x=0; x < nLect; x++) {
                lect.add(vData[x].aX);
                lect.add(vData[x].aY);
                lect.add(vData[x].aZ);
                lect.add(vData[x].gX);
                lect.add(vData[x].gY);
                lect.add(vData[x].gZ);
                lect.add(vData[x].prevMillis);
                lect.add(vData[x].conta);
        }
        String JSON;
        root.printTo(JSON);
        return JSON;
}

void sendData(){
        String json = serialize();
        webSocket.sendTXT(json);
        //Serial.println(json);
        vData.clear();
        counter=0;
}

void loop() {
        // put your main code here, to run repeatedly:
        ArduinoOTA.handle();
        webSocket.loop();
        unsigned long currentMillis = millis();
        if(currentMillis - previousMillis >= interval) {
                previousMillis = currentMillis;
                if(ban) {
                        accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
                        SensorData data = {numSensor, ax, ay, az, gx, gy, gz, previousMillis, cont};
                        vData.push_back(data);
                        counter++;
                        cont++;
                        if(counter==nLect) {
                                sendData();
                        }
                }
        }
}
