#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino
#include <ArduinoJson.h>          //https://github.com/bblanchon/ArduinoJson
#include <WebSocketsClient.h>
#include "I2Cdev.h"
#include "MPU6050.h"
#include "Wire.h"
#include <vector>

//#define DEBUG_ON

MPU6050 accelgyro;
int16_t ax, ay, az;
int16_t gx, gy, gz;
unsigned long cont=1;

WebSocketsClient webSocket;
const char* ssid     = "sensor";
const char* password = "1234567278";
const char* ws_server = "148.226.154.166";
int ws_port = 3000;

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
        int16_t conta;
};

const int BUFFER_SIZE = JSON_OBJECT_SIZE(2) + JSON_ARRAY_SIZE(42);

static std::vector<struct SensorData> vData(5);
int counter = 0;

//Variables for calibration
int mean_ax,mean_ay,mean_az,mean_gx,mean_gy,mean_gz,state=0;
int buffersize=1000;     //Amount of readings used to average, make it higher to get more precision but sketch will be slower  (default:1000)
int acel_deadzone=3;     //Acelerometer error allowed, make it lower to get more precision, but sketch may not converge  (default:8)
int giro_deadzone=1;     //Giro error allowed, make it lower to get more precision, but sketch may not converge  (default:1)
int ax_offset,ay_offset,az_offset,gx_offset,gy_offset,gz_offset;

void setup() {
        // put your setup code here, to run once:
        Serial.begin(115200);
        Serial.println();

        //connect to WiFi
        setupWiFi();

        //Configure connection to mpu6050
        setupMPU();

        //Configure ws connection
        webSocket.begin(ws_server, ws_port);
        webSocket.onEvent(webSocketEvent);

        vData.clear();
}

void setupWiFi(){
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

        //reset offsets
        accelgyro.setXAccelOffset(0);
        accelgyro.setYAccelOffset(0);
        accelgyro.setZAccelOffset(0);
        accelgyro.setXGyroOffset(0);
        accelgyro.setYGyroOffset(0);
        accelgyro.setZGyroOffset(0);
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
                        state = 0;
                        calibrate();
                }
        }
        break;
        }
}

void calibrate(){
        // reset offsets
        accelgyro.setXAccelOffset(0);
        accelgyro.setYAccelOffset(0);
        accelgyro.setZAccelOffset(0);
        accelgyro.setXGyroOffset(0);
        accelgyro.setYGyroOffset(0);
        accelgyro.setZGyroOffset(0);

        while(state != 2) {
                if (state==0) {
      #ifdef DEBUG_ON
                        Serial.println("\nReading sensors for first time...");
      #endif
                        meansensors();
                        state++;
                        delay(1000);
                }

                if (state==1) {
      #ifdef DEBUG_ON
                        Serial.println("\nCalculating offsets...");
      #endif
                        calibration();
                        state++;
                        delay(1000);
                }

                if (state==2) {
                        meansensors();
      #ifdef DEBUG_ON
                        Serial.println("\nFINISHED!");
                        Serial.print("\nSensor readings with offsets:\t");
                        Serial.print(mean_ax);
                        Serial.print("\t");
                        Serial.print(mean_ay);
                        Serial.print("\t");
                        Serial.print(mean_az);
                        Serial.print("\t");
                        Serial.print(mean_gx);
                        Serial.print("\t");
                        Serial.print(mean_gy);
                        Serial.print("\t");
                        Serial.println(mean_gz);
                        Serial.print("Your offsets:\t");
                        Serial.print(ax_offset);
                        Serial.print("\t");
                        Serial.print(ay_offset);
                        Serial.print("\t");
                        Serial.print(az_offset);
                        Serial.print("\t");
                        Serial.print(gx_offset);
                        Serial.print("\t");
                        Serial.print(gy_offset);
                        Serial.print("\t");
                        Serial.println(gz_offset);
                        Serial.println("\nData is printed as: acelX acelY acelZ giroX giroY giroZ");
                        Serial.println("Check that your sensor readings are close to 0 0 16384 0 0 0");
                        Serial.println("If calibration was succesful write down your offsets so you can set them in your projects using something similar to mpu.setXAccelOffset(youroffset)");
      #endif
                        webSocket.sendTXT("calibrationComplete");
                }
        }
}

void meansensors(){
        long i=0,buff_ax=0,buff_ay=0,buff_az=0,buff_gx=0,buff_gy=0,buff_gz=0;

        while (i<(buffersize+101)) {
                // read raw accel/gyro measurements from device
                accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

                if (i>100 && i<=(buffersize+100)) { //First 100 measures are discarded
                        buff_ax=buff_ax+ax;
                        buff_ay=buff_ay+ay;
                        buff_az=buff_az+az;
                        buff_gx=buff_gx+gx;
                        buff_gy=buff_gy+gy;
                        buff_gz=buff_gz+gz;
                }
                if (i==(buffersize+100)) {
                        mean_ax=buff_ax/buffersize;
                        mean_ay=buff_ay/buffersize;
                        mean_az=buff_az/buffersize;
                        mean_gx=buff_gx/buffersize;
                        mean_gy=buff_gy/buffersize;
                        mean_gz=buff_gz/buffersize;
                }
                i++;
                delay(2); //Needed so we don't get repeated measures
        }
}

void calibration(){
        ax_offset=-mean_ax/8;
        ay_offset=-mean_ay/8;
        az_offset=(8192-mean_az)/8;

        gx_offset=-mean_gx/4;
        gy_offset=-mean_gy/4;
        gz_offset=-mean_gz/4;
        while (1) {
                int ready=0;
                accelgyro.setXAccelOffset(ax_offset);
                accelgyro.setYAccelOffset(ay_offset);
                accelgyro.setZAccelOffset(az_offset);

                accelgyro.setXGyroOffset(gx_offset);
                accelgyro.setYGyroOffset(gy_offset);
                accelgyro.setZGyroOffset(gz_offset);

                meansensors();
    #ifdef DEBUG_ON
                Serial.println("...");
    #endif

                if (abs(mean_ax)<=acel_deadzone) ready++;
                else ax_offset=ax_offset-mean_ax/acel_deadzone;

                if (abs(mean_ay)<=acel_deadzone) ready++;
                else ay_offset=ay_offset-mean_ay/acel_deadzone;

                if (abs(8192-mean_az)<=acel_deadzone) ready++;
                else az_offset=az_offset+(8192-mean_az)/acel_deadzone;

                if (abs(mean_gx)<=giro_deadzone) ready++;
                else gx_offset=gx_offset-mean_gx/(giro_deadzone+1);

                if (abs(mean_gy)<=giro_deadzone) ready++;
                else gy_offset=gy_offset-mean_gy/(giro_deadzone+1);

                if (abs(mean_gz)<=giro_deadzone) ready++;
                else gz_offset=gz_offset-mean_gz/(giro_deadzone+1);

                if (ready==6) break;
        }
}

String serialize(){
        StaticJsonBuffer<BUFFER_SIZE> jsonBuffer;
        JsonObject& root = jsonBuffer.createObject();
        root["ID"] = vData[0].ID;
        JsonArray& lect = root.createNestedArray("lectures");
        for(int x=0; x < 5; x++) {
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
        webSocket.loop();
        unsigned long currentMillis = millis();
        if(currentMillis - previousMillis >= interval) {
                previousMillis = currentMillis;
                if(ban) {
                        accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
                        SensorData data = {"1", ax, ay, az, gx, gy, gz, previousMillis, cont};
                        vData.push_back(data);
                        counter++;
                        cont++;
                        if(counter==5) {
                                sendData();
                        }
                }
        }
}
