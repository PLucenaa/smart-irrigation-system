import serial
import json
import time
import requests # Caso vá enviar para o Spring Boot depois

# --- CONFIGURAÇÕES ---
# O Heltec geralmente aparece como /dev/ttyUSB0 ou /dev/ttyACM0
# Use 'ls /dev/tty*' para descobrir
SERIAL_PORT = '/dev/ttyUSB0' 
BAUD_RATE = 115200

# URL da sua API Spring Boot (Exemplo)
API_URL = "http://localhost:8080/api/sensores"

def conectar_serial():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"--- Conectado ao Heltec em {SERIAL_PORT} ---")
        return ser
    except Exception as e:
        print(f"Erro ao conectar na porta {SERIAL_PORT}: {e}")
        return None

def processar_dados(linha):
    try:
        # Limpa a string e tenta converter JSON
        linha = linha.decode('utf-8').strip()
        if not linha: return
        
        print(f"[RAW]: {linha}")
        
        # Se for JSON válido, processa
        if linha.startswith('{') and linha.endswith('}'):
            dados = json.loads(linha)
            
            # AQUI VOCÊ FAZ A MÁGICA (Envia pro Banco ou API)
            print(f"✅ DADOS VÁLIDOS! ID: {dados.get('id')} | Umidade: {dados.get('umid')}%")
            
            # Exemplo de envio para o Spring Boot (descomente quando tiver a API)
            # requests.post(API_URL, json=dados)
            
    except json.JSONDecodeError:
        print(f"⚠️ Erro de JSON (Ignorado): {linha}")
    except Exception as e:
        print(f"❌ Erro: {e}")

def main():
    ser = conectar_serial()
    while not ser:
        time.sleep(5)
        ser = conectar_serial()

    while True:
        try:
            if ser.in_waiting > 0:
                linha = ser.readline()
                processar_dados(linha)
        except OSError:
            print("⚠️ Cabo desconectado? Tentando reconectar...")
            ser.close()
            time.sleep(2)
            ser = conectar_serial()
        except KeyboardInterrupt:
            print("\nEncerrando Gateway.")
            break

if __name__ == "__main__":
    main()
