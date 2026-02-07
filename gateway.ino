/*
   HELTEC V3 - RECEPTOR (BRIDGE/GATEWAY)
   Função: Recebe JSON via LoRa, decodifica e mostra na tela OLED
   Biblioteca necessária: RadioLib (instalar pelo gerenciador)
   Biblioteca JSON: ArduinoJson (Instale a versão 6 ou 7 pelo gerenciador)
*/

#include <RadioLib.h>
#include <Wire.h>
#include "HT_SSD1306Wire.h"
#include <ArduinoJson.h> // <--- IMPORTANTE: Instale essa lib se não tiver

// --- TELA OLED ---
SSD1306Wire oled(0x3c, 500000, 17, 18, GEOMETRY_128_64, 21); 

// --- RÁDIO LORA ---
SX1262 radio = new Module(8, 14, 12, 13);

// Variáveis de controle
volatile bool recebeuAlgo = false;

// Interrupção
void setFlag(void) {
  recebeuAlgo = true;
}

// Função auxiliar de display
void atualizarTela(String status, int umidade, int id) {
    oled.clear();
    
    // Cabeçalho
    oled.setFont(ArialMT_Plain_10);
    oled.drawString(0, 0, "SENSOR ID: " + String(id));
    oled.drawString(60, 0, "RSSI: " + String(radio.getRSSI(), 0));

    // Valor Principal Gigante
    oled.setFont(ArialMT_Plain_24);
    oled.drawString(35, 18, String(umidade) + "%");

    // Barra de Progresso visual (só pra ficar "Pro")
    oled.drawRect(10, 50, 108, 10); // Contorno
    int larguraBarra = map(umidade, 0, 100, 0, 104);
    oled.fillRect(12, 52, larguraBarra, 6); // Preenchimento

    oled.display();
}

void setup() {
  Serial.begin(115200);

  // Vext ON
  pinMode(36, OUTPUT);
  digitalWrite(36, LOW); 
  delay(500); 

  // Tela Init
  oled.init();
  oled.flipScreenVertically();
  oled.setFont(ArialMT_Plain_16);
  oled.drawString(0, 0, "AGUARDANDO...");
  oled.display();

  // Radio Init
  Serial.print("[RX] Inicializando ... ");
  int state = radio.begin(915.0);
  
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("SUCESSO!");
  } else {
    Serial.print("FALHA, cod ");
    Serial.println(state);
    while (true);
  }

  // Mesmas configs do Transmissor
  radio.setBandwidth(125.0);
  radio.setSpreadingFactor(7);
  radio.setCodingRate(5);
  
  radio.setDio1Action(setFlag);
  radio.startReceive();
}

void loop() {
  if(recebeuAlgo) {
    recebeuAlgo = false;

    String str;
    int state = radio.readData(str);

    if (state == RADIOLIB_ERR_NONE) {
      Serial.println("RX: " + str); // Ex: {"id":1,"umid":45}

      // --- DECODIFICAÇÃO JSON ---
      JsonDocument doc; // Para ArduinoJson v7 (use StaticJsonDocument<200> doc; se for v6)
      DeserializationError error = deserializeJson(doc, str);

      if (!error) {
        int id = doc["id"];
        int umid = doc["umid"];

        // Lógica de Alerta (Exemplo Indústria 4.0)
        if (umid < 20) {
           Serial.println("ALERTA: SOLO MUITO SECO!");
           // Aqui você poderia ligar um relé no pino X
        }

        atualizarTela("RX OK", umid, id);
      } else {
        Serial.println("Erro ao ler JSON");
      }

    } else if (state == RADIOLIB_ERR_CRC_MISMATCH) {
      Serial.println("Erro CRC");
    }

    radio.startReceive();
  }
}
