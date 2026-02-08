/*
   SENSOR NODE - RADIOLIB (Transmissor Compatível)
   Envia JSON simulado para testar o Bridge.
   Usa Deep Sleep para economizar bateria.
*/

#include <RadioLib.h>
#include <Wire.h>
#include <esp_sleep.h>

// --- Pinos Heltec V3 ---
SX1262 radio = new Module(8, 14, 12, 13);

// Constantes de configuração
const int INTERVALO_ENVIO_SEGUNDOS = 30; // Envia a cada 30 segundos
const int INTERVALO_ENVIO_MICROSEGUNDOS = INTERVALO_ENVIO_SEGUNDOS * 1000000;

int contador = 0;

void setup() {
  Serial.begin(115200);
  delay(1000); // Aguarda Serial estabilizar

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
    // Em caso de falha, tenta deep sleep mesmo assim
    esp_deep_sleep_start();
    return;
  }

  // Ajuste fino para bater com o Bridge
  radio.setBandwidth(125.0);
  radio.setSpreadingFactor(7);
  radio.setCodingRate(5);
  radio.setOutputPower(10); // Potência média para o sensor

  // Envia uma leitura antes de dormir
  enviarLeitura();

  // Configura o timer de wake-up para deep sleep
  esp_sleep_enable_timer_wakeup(INTERVALO_ENVIO_MICROSEGUNDOS);

  Serial.println("[Sensor] Entrando em Deep Sleep por " + String(INTERVALO_ENVIO_SEGUNDOS) + " segundos...");
  delay(100); // Pequeno delay antes de entrar em sleep

  // Entra em deep sleep
  esp_deep_sleep_start();
}

void loop() {
  // Este código nunca será executado porque o ESP32
  // reinicia após o deep sleep, voltando para setup()
}

void enviarLeitura() {
  Serial.print("[Sensor] Enviando pacote... ");

  // Cria uma mensagem JSON falsa para testar a tela do Bridge
  // Formato: {"id": 1, "umid": 45}
  String mensagem = "{\"id\":1,\"umid\":" + String(random(20, 90)) + "}";

  // Envia
  int state = radio.transmit(mensagem);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("ENVIADO: " + mensagem);
    contador++;
    Serial.println("[Sensor] Total de envios: " + String(contador));
  } else {
    Serial.print("FALHA NO ENVIO, cod: ");
    Serial.println(state);
  }
}