/*
   SENSOR NODE - RADIOLIB (COM LEITURA REAL)
   Hardware: Heltec V3 + Sensor Capacitivo v1.2
*/

#include <RadioLib.h>
#include <Wire.h>

// --- CONFIGURAÇÃO DO SENSOR ---
#define PIN_SENSOR 1 // Pino ADC onde ligou o sensor

// *** SUBSTITUA PELOS VALORES QUE VOCÊ ANOTOU NA CALIBRAÇÃO ***
const int VALOR_SECO = 2360;
const int VALOR_MOLHADO = 1110;

// --- Pinos Heltec V3 (Radio) ---
SX1262 radio = new Module(8, 14, 12, 13);

int contador = 0;

void setup() {
  Serial.begin(115200);

  // Liga Vext (Energia dos periféricos da placa)
  pinMode(36, OUTPUT);
  digitalWrite(36, LOW); 
  delay(500);

  // Configura a resolução do ADC para 12 bits (0-4095)
  analogReadResolution(12);

  Serial.print("[Sensor] Iniciando Radio... ");
  
  int state = radio.begin(915.0);
  
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("SUCESSO!");
  } else {
    Serial.print("FALHA, codigo ");
    Serial.println(state);
    while (true);
  }

  // Ajustes de LoRa para melhor alcance
  radio.setBandwidth(125.0);
  radio.setSpreadingFactor(7);
  radio.setCodingRate(5);
  radio.setOutputPower(10); 
}

int lerUmidade() {
  int leituraRaw = analogRead(PIN_SENSOR);
  
  // Imprime para debug
  Serial.print("RAW: ");
  Serial.print(leituraRaw);

  // A função map converte o range de entrada para 0-100%
  // Note que invertemos: Valor Seco -> 0%, Valor Molhado -> 100%
  int porcentagem = map(leituraRaw, VALOR_SECO, VALOR_MOLHADO, 0, 100);

  // Trava os valores entre 0 e 100 para não dar números negativos ou >100
  if(porcentagem < 0) porcentagem = 0;
  if(porcentagem > 100) porcentagem = 100;

  Serial.print(" | Umidade: ");
  Serial.println(porcentagem);

  return porcentagem;
}

void loop() {
  Serial.print("[Sensor] Lendo e Enviando... ");

  // Lê o sensor real
  int umidadeReal = lerUmidade();

  // Cria o JSON com o valor real
  String mensagem = "{\"id\":1,\"umid\":" + String(umidadeReal) + "}";

  // Envia via LoRa
  int state = radio.transmit(mensagem);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("ENVIADO: " + mensagem);
  } else {
    Serial.print("FALHA NO ENVIO, cod: ");
    Serial.println(state);
  }

  contador++;
  
  // Dorme por 5 segundos (simulando economia de bateria)
  delay(5000);
}
