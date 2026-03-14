/*
   SENSOR NODE - RADIOLIB (COM AUTENTICAÇÃO E DEEP SLEEP)
   Hardware: Heltec V3 + Sensor Capacitivo v1.2
*/

#include <Arduino.h>
#include <RadioLib.h>
#include <Wire.h>

// --- CONFIGURAÇÃO DO SENSOR ---
#define PIN_SENSOR 1

// *** SUBSTITUA PELOS VALORES QUE VOCÊ ANOTOU NA CALIBRAÇÃO ***
const int VALOR_SECO = 2360;
const int VALOR_MOLHADO = 1110;

// --- CONFIGURAÇÃO DE SEGURANÇA ---
const String TOKEN_SEGURANCA = "AgroTCC@2026";

// --- CONFIGURAÇÃO DO DEEP SLEEP ---
#define uS_TO_S_FACTOR 1000000ULL
#define TIME_TO_SLEEP  5 // 900 segundos = 15 minutos

// --- Pinos Heltec V3 (Radio) ---
SX1262 radio = new Module(8, 14, 12, 13);

void setup() {
  Serial.begin(115200);

  // Liga Vext (Energia do sensor)
  pinMode(36, OUTPUT);
  digitalWrite(36, LOW);
  delay(2000); // Tempo para o sensor estabilizar

  analogReadResolution(12);

  Serial.print("[Sensor] Iniciando Radio... ");
  int state = radio.begin(915.0);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("SUCESSO!");
  } else {
    Serial.print("FALHA, codigo ");
    Serial.println(state);
  }

  // Ajustes de LoRa
  radio.setBandwidth(125.0);
  radio.setSpreadingFactor(7);
  radio.setCodingRate(5);
  radio.setOutputPower(22);

  // Configura o despertador do ESP32 para daqui a 15 minutos
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
}

int lerUmidade() {
  int leituraRaw = analogRead(PIN_SENSOR);
  Serial.print("RAW: ");
  Serial.print(leituraRaw);

  int porcentagem = map(leituraRaw, VALOR_SECO, VALOR_MOLHADO, 0, 100);
  if(porcentagem < 0) porcentagem = 0;
  if(porcentagem > 100) porcentagem = 100;

  Serial.print(" | Umidade: ");
  Serial.println(porcentagem);
  return porcentagem;
}

void loop() {
  Serial.print("[Sensor] Lendo e Enviando... ");

  int umidadeReal = lerUmidade();

  // Cria o JSON com o Token de Segurança incluído!
  String mensagem = "{\"id\":1,\"token\":\"" + TOKEN_SEGURANCA + "\",\"umid\":" + String(umidadeReal) + "}";

  int state = radio.transmit(mensagem);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("ENVIADO: " + mensagem);
  } else {
    Serial.println("FALHA NO ENVIO");
  }

  // ==========================================================
  // PROTOCOLO DE HIBERNAÇÃO (Economia Máxima de Energia)
  // ==========================================================
  Serial.println("[Sensor] Entrando em Deep Sleep por 15 minutos...");
  Serial.flush();

  radio.sleep(); // Manda o rádio dormir
  digitalWrite(36, HIGH); // Desliga a energia do sensor físico
  esp_deep_sleep_start(); // Desliga a CPU
}