/*
   HELTEC V3 - RADIOLIB (A PROVA DE FALHAS)
   Biblioteca necessária: RadioLib (instalar pelo gerenciador)
*/

#include <RadioLib.h>
#include <Wire.h>
#include "HT_SSD1306Wire.h"

// --- CONFIGURAÇÃO MANUAL DA TELA (Que já sabemos que funciona) ---
// Vext: 36, RST: 21, SDA: 17, SCL: 18
SSD1306Wire oled(0x3c, 500000, 17, 18, GEOMETRY_128_64, 21); 

// --- CONFIGURAÇÃO MANUAL DO RÁDIO (SX1262) ---
// Pinos: NSS=8, DIO1=14, RST=12, BUSY=13
SX1262 radio = new Module(8, 14, 12, 13);

// Variável para receber dados
String mensagemRecebida = "";
bool recebeuAlgo = false;

// Função chamada quando chega pacote (Interrupção)
void setFlag(void) {
  recebeuAlgo = true;
}

void mostraNaTela(String l1, String l2) {
    oled.clear();
    oled.drawString(0, 0,  l1);
    oled.drawString(0, 25, l2);
    oled.display();
}

void setup() {
  Serial.begin(115200);

  // 1. LIGAR ENERGIA DA PLACA (Vext)
  pinMode(36, OUTPUT); // Vext
  digitalWrite(36, LOW); // LIGA (LOW = ON)
  delay(500); 

  // 2. INICIAR TELA
  oled.init();
  oled.flipScreenVertically();
  oled.setFont(ArialMT_Plain_16);
  mostraNaTela("SISTEMA", "INICIANDO...");
  delay(1000);

  // 3. INICIAR RÁDIO VIA RADIOLIB
  mostraNaTela("RADIO", "CONFIGURANDO");
  Serial.print("[SX1262] Inicializando ... ");
  
  // Inicia com frequência 915.0 MHz
  int state = radio.begin(915.0);
  
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("SUCESSO!");
    mostraNaTela("RADIO", "OK - 915MHz");
  } else {
    Serial.print("FALHA, codigo ");
    Serial.println(state);
    mostraNaTela("ERRO RADIO", "COD: " + String(state));
    while (true); // Trava aqui se der erro
  }

  // Configurações extras (Opcional, mas bom para alcance)
  radio.setBandwidth(125.0);
  radio.setSpreadingFactor(7);
  radio.setCodingRate(5);
  radio.setOutputPower(2); // Potência BAIXA (2dBm) para economizar energia

  // Configura a interrupção (callback)
  radio.setDio1Action(setFlag);

  // Começa a escutar (RX)
  state = radio.startReceive();
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("[SX1262] Escutando...");
  } else {
    Serial.print("[SX1262] Falha ao escutar, codigo ");
    Serial.println(state);
  }
  
  delay(1000);
  mostraNaTela("AGUARDANDO", "DADOS...");
}

void loop() {
  // Verifica se a flag de interrupção foi ativada
  if(recebeuAlgo) {
    recebeuAlgo = false; // Reseta flag

    // Tenta ler o dado
    String str;
    int state = radio.readData(str);

    if (state == RADIOLIB_ERR_NONE) {
      // SUCESSO!
      Serial.println(str);
      mostraNaTela("RECEBIDO:", str);
      
      // Pisca LED
      digitalWrite(LED_BUILTIN, HIGH);
      delay(50);
      digitalWrite(LED_BUILTIN, LOW);

    } else if (state == RADIOLIB_ERR_CRC_MISMATCH) {
      Serial.println("[SX1262] Erro de CRC (Dado corrompido)");
      mostraNaTela("ERRO", "CRC FAIL");
    }

    // Volta a escutar
    radio.startReceive();
  }
}