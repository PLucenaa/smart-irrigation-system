/*
   SENSOR NODE - RADIOLIB (Transmissor Compatível)
   Envia JSON simulado para testar o Bridge.
*/

#include <RadioLib.h>
#include <Wire.h> // Se tiver sensor I2C depois
// Se tiver a biblioteca OLED instalada, pode incluir, mas vou deixar sem tela pra economizar bateria no sensor

// --- Pinos Heltec V3 ---
SX1262 radio = new Module(8, 14, 12, 13);

int contador = 0;

void setup() {
  Serial.begin(115200);

  // Liga Vext (Energia do Rádio)
  pinMode(36, OUTPUT);
  digitalWrite(36, LOW); 
  delay(500);

  Serial.print("[Sensor] Iniciando Radio... ");
  
  // MESMAS CONFIGURAÇÕES DO BRIDGE
  int state = radio.begin(915.0);
  
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("SUCESSO!");
  } else {
    Serial.print("FALHA, codigo ");
    Serial.println(state);
    while (true);
  }

  // Ajuste fino para bater com o Bridge
  radio.setBandwidth(125.0);
  radio.setSpreadingFactor(7);
  radio.setCodingRate(5);
  radio.setOutputPower(10); // Potência média para o sensor
}

void loop() {
  Serial.print("[Sensor] Enviando pacote... ");

  // Cria uma mensagem JSON falsa para testar a tela do Bridge
  // Formato: {"id": 1, "umid": 45}
  String mensagem = "{\"id\":1,\"umid\":" + String(random(20, 90)) + "}";

  // Envia
  int state = radio.transmit(mensagem);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("ENVIADO: " + mensagem);
  } else {
    Serial.print("FALHA NO ENVIO, cod: ");
    Serial.println(state);
  }

  contador++;
  
  // Espera 2 segundos e envia de novo
  delay(2000);
}