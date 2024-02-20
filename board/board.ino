/**
  Initial testing of remote connection protocols
*/
#include <WiFi.h>
#include <ESP32Servo.h>

#define LED_BUILTIN  2
 
// pins for the motor controller
// first motor
int speedA = 32;
int in1 = 33;
int in2 = 25;
// second motor
int speedB = 26;
int in3 = 27;
int in4 = 14;

int servoPin = 12;
Servo servo;

#define port 80
const char *network_name = "jams";
const char *password = "12345678";
WiFiServer  server(port);

IPAddress local_IP(192,168,1,100);//Set the IP address of ESP32 itself
IPAddress gateway(192,168,1,10);   //Set the gateway of ESP32 itself
IPAddress subnet(255,255,255,0);  //Set the subnet mask for ESP32 itself

void setup() {

  Serial.begin(115200);

  pinMode(LED_BUILTIN, OUTPUT);
  // set all the motor control pins to outputs
  pinMode(speedA, OUTPUT);
  pinMode(speedB, OUTPUT);
  pinMode(in1, OUTPUT); // right reverse
  pinMode(in2, OUTPUT); // right forward
  pinMode(in3, OUTPUT); // left reverse
  pinMode(in4, OUTPUT); // left forward

  // initialize the servo
  servo.attach(servoPin);
  servo.write(60);

  delay(2000);

  // initialize the wifi network
  Serial.printf("\nInitializing network ");
  Serial.println(network_name);
  WiFi.disconnect();
  WiFi.mode(WIFI_AP);
  Serial.println(WiFi.softAPConfig(local_IP, gateway, subnet) ? "Ready" : "Failed!");
  Serial.println("Setting soft-AP ... ");
  boolean result = WiFi.softAP(network_name, password);
  if(result){
    Serial.println("Ready");
    Serial.println(String("Soft-AP IP address = ") + WiFi.softAPIP().toString());
    Serial.println(String("MAC address = ") + WiFi.softAPmacAddress().c_str());
  }else{
    Serial.println("Failed!");
  }
  Serial.println("Setup End");

  // initialize server
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.printf("IP port: %d\n",port);			
  server.begin(port);

}

void loop() {
  WiFiClient client = server.available();
  if (client) {
    Serial.println("Client connected.");
    while (client.connected()) {
      if (client.available()) {
        String command = client.readStringUntil('/'); // read command coming in
        // Serial.println(msg);
        // different functions
        if (command.compareTo("i") == 0) { // new input from the controller
          float forwards = client.readStringUntil('/').toFloat();
          float turn = client.readStringUntil('/').toFloat();
          if (turn) {
            if (turn > 0) {
              turnLeft(forwards * turn);
            } else {
              turnRight(forwards * turn * -1);
            }
          } else if (forwards) {
            if (forwards > 0) {
              motorsOnForwards(forwards);
            } else {
              motorsOnBackwards(forwards * -1);
            }
          } else {
            motorsOff();
          }
        }
        // s command means servo control
        if (command.compareTo("s") == 0) { // new input for the servo
          int angle = client.readStringUntil('/').toInt();
          Serial.printf("setting servo angle to ");
          Serial.println(angle);
          // set servo angle
          servo.write(angle);
        }
        // client.flush(); // clear the wifi receive area cache
      }
      if(Serial.available()){                       // if there's bytes to read from the serial monitor,
        client.print(Serial.readStringUntil('\n')); // print it out the client.
        Serial.flush();                     // clear the wifi receive area cache
      }

    }
    client.stop();                                  // stop the client connecting.
    Serial.println("Client Disconnected.");

  }
}

void motorsOnForwards(float speed) {
  digitalWrite(LED_BUILTIN, HIGH);
  // turn on motor A
  digitalWrite(in1, LOW);
  digitalWrite(in2, HIGH);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedA, int(speed * 200));
  // turn on motor B
  digitalWrite(in3, LOW);
  digitalWrite(in4, HIGH);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedB, int(speed * 200));
}

void motorsOnBackwards(float speed) {
  digitalWrite(LED_BUILTIN, HIGH);
  // turn on motor A
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedA, int(speed * 200));
  // turn on motor B
  digitalWrite(in3, HIGH);
  digitalWrite(in4, LOW);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedB, int(speed * 200));
}

void turnLeft(float speed) {
  Serial.println("turning left");
  // turn on motor A backwards
  digitalWrite(in1, LOW);
  digitalWrite(in2, HIGH);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedA, int(speed * 200));
  // turn on motor B forwards
  digitalWrite(in3, HIGH);
  digitalWrite(in4, LOW);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedB, int(speed * 200));
}

void turnRight(float speed) {
    // turn on motor A forwards
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedA, int(speed * 200));
  // turn on motor B backwards
  digitalWrite(in3, LOW);
  digitalWrite(in4, HIGH);
  // set speed to 200 out of possible range 0~255
  analogWrite(speedB, int(speed * 200));
}

void motorsOff() {
  digitalWrite(LED_BUILTIN, LOW);
  // turn off the motors
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
  digitalWrite(in3, LOW);
  digitalWrite(in4, LOW);
}