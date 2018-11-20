# mpu6050-ws
ESP8266 Sketch to read data from a mpu6050 accelerometer/gyroscope and send it to a node.js server using web sockets.

To create standalone executable install pkg using `npm install -g pkg` and run on terminal `pkg .`

Self-signed certficate was created using OpenSSL
`openssl req -x509 -sha256 -nodes -days 3650 -newkey rsa:2048 -keyout server.key -out server.crt`
