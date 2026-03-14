/*
   HELTEC V3 - RECEPTOR (COM FILTRO DE AUTENTICAÇÃO E MÉTRICAS LORA)
*/

#include <Arduino.h>
#include <RadioLib.h>
#include <Wire.h>
#include <SSD1306Wire.h>
#include <ArduinoJson.h>

// --- TELA OLED ---
SSD1306Wire oled(0x3c, 17, 18);

// --- RÁDIO LORA ---
SX1262 radio = new Module(8, 14, 12, 13);

// --- SEGURANÇA ---
const String TOKEN_ESPERADO = "AgroTCC@2026";

volatile bool recebeuAlgo = false;
void setFlag(void) { recebeuAlgo = true; }

// --- ATUALIZADO: Agora recebe RSSI e SNR para mostrar na tela ---
void atualizarTela(String status, int umidade, int id, float rssi, float snr) {
    oled.clear();
    oled.setFont(ArialMT_Plain_10);

    // Linha 1: Status e ID
    oled.drawString(0, 0, "ID: " + String(id) + " | " + status);

    // Linha 2: Métricas de Rádio (Para o seu Teste do TCC!)
    oled.drawString(0, 12, "Sinal: " + String(rssi, 0) + "dBm | SNR: " + String(snr, 1));

    // Linha 3: Umidade Gigante
    oled.setFont(ArialMT_Plain_24);
    oled.drawString(35, 25, String(umidade) + "%");

    // Barra de Progresso
    oled.drawRect(10, 54, 108, 10);
    int larguraBarra = map(umidade, 0, 100, 0, 104);
    oled.fillRect(12, 56, larguraBarra, 6);

    oled.display();
}

void setup() {
  Serial.begin(115200);

  // 1. PRIMEIRO: Liga a energia física dos periféricos (Vext)
  pinMode(36, OUTPUT);
  digitalWrite(36, LOW);
  delay(500); // Espera a energia estabilizar

  // 2. SEGUNDO: Dá o reset na tela OLED agora que ela tem energia
  pinMode(21, OUTPUT);
  digitalWrite(21, LOW);
  delay(50);
  digitalWrite(21, HIGH);

  // 3. TERCEIRO: Inicializa a tela
  oled.init();
  oled.flipScreenVertically();
  oled.setFont(ArialMT_Plain_16);
  oled.drawString(0, 0, "AGUARDANDO...");
  oled.display();

  int state = radio.begin(915.0);
  radio.setBandwidth(125.0);
  radio.setSpreadingFactor(7);
  radio.setCodingRate(5);
  radio.setOutputPower(22);

  radio.setDio1Action(setFlag);
  radio.startReceive();
}

void loop() {
  if(recebeuAlgo) {
    recebeuAlgo = false;
    String str;
    int state = radio.readData(str);

    if (state == RADIOLIB_ERR_NONE) {

      // --- CAPTURA AS MÉTRICAS DO CHIP SX1262 ---
      float rssi = radio.getRSSI();
      float snr = radio.getSNR();

      // Imprime no Serial para você copiar para o TCC
      Serial.print("[METRICAS] RSSI: ");
      Serial.print(rssi);
      Serial.print(" dBm | SNR: ");
      Serial.print(snr);
      Serial.println(" dB");

      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, str);

      if (!error) {
        // --- VALIDAÇÃO DE SEGURANÇA (AUTENTICAÇÃO) ---
        String tokenRecebido = doc["token"] | "";

        if (tokenRecebido != TOKEN_ESPERADO) {
          Serial.println("[SEGURANCA] Pacote REJEITADO! Token Invalido: " + str);
          // Passa 0 de umidade e as métricas capturadas
          atualizarTela("INVÁLIDO", 0, 0, rssi, snr);
          radio.startReceive();
          return; // Aborta o processamento aqui
        }

        // Se passou da segurança, imprime no USB para o Python ler
        Serial.println("RX: " + str);

        int id = doc["id"];
        int umid = doc["umid"];

        // Atualiza a tela com as métricas novas
        atualizarTela("RX OK", umid, id, rssi, snr);

      } else {
        Serial.println("Erro ao ler JSON");
      }
    }
    radio.startReceive();
  }
}