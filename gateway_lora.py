import serial
import json
import time
import datetime
import psycopg2 

# --- CONFIGURAÇÕES ---
# Verifique se é /dev/ttyACM0 ou /dev/ttyUSB0 (ls /dev/tty*)
PORTA_SERIAL = '/dev/ttyUSB0' 
BAUD_RATE = 115200

# Configuração do Banco de Dados (Credenciais do seu Docker no VPS)
DB_CONFIG = {
    "host": "XXXXXXXXXX",       # Seu IP da Hostinger
    "database": "banco_tcc",
    "user": "irrigation_app",
    "password": "XXXXXXX",
    "port": "5432"
}

def salvar_banco(sensor_id, umid, temp, status):
    """Conecta no VPS e salva o registro"""
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        query = "INSERT INTO leituras (sensor_id, umidade, temperatura, status) VALUES (%s, %s, %s, %s)"
        cur.execute(query, (sensor_id, umid, temp, status))
        conn.commit()
        cur.close()
        print(f"   >>> [NUVEM] Sucesso! Dado salvo no DB.")
    except Exception as e:
        print(f"   >>> [ERRO BANCO] Falha ao conectar ou salvar no VPS: {e}")
    finally:
        if conn:
            conn.close()

def logica_fusao_dados(umidade, temperatura):
    """Regra de Negócio na Borda (Edge Computing)"""
    if umidade < 40 and temperatura > 30:
        return "CRITICO", "Irrigação Imediata (Risco Térmico)"
    elif umidade < 40:
        return "ATENCAO", "Planejar Irrigação"
    else:
        return "NORMAL", "Monitorando"

print(f"--- INICIANDO GATEWAY TCC (vFinal Corrigida) ---")
print(f"Conectando ao banco em: {DB_CONFIG['host']}...")

try:
    # Abre a porta serial
    ser = serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1)
    ser.flush()
    print(f"Lendo dados da porta {PORTA_SERIAL}...")
    
    while True:
        if ser.in_waiting > 0:
            # Lê a linha e limpa espaços/caracteres estranhos
            linha = ser.readline().decode('utf-8', errors='ignore').strip()
            
            if linha.startswith('{') and linha.endswith('}'):
                try:
                    dados = json.loads(linha)
                    
                    # --- TRATAMENTO DE CAMPOS (Aqui estava o erro!) ---
                    sensor_id = dados.get('id', 'Desconhecido')
                    
                    # Pega a umidade, se não existir coloca 0.0
                    umidade = float(dados.get('umid', 0.0))
                    
                    # Pega a temperatura, se não existir coloca 0.0 (EVITA O ERRO)
                    temperatura = float(dados.get('temp', 0.0))
                    
                    # 1. Processamento na Borda
                    nivel, recomendacao = logica_fusao_dados(umidade, temperatura)
                    
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
                    print(f"\n[{timestamp}] Sensor: {sensor_id} | Umid: {umidade}% | Temp: {temperatura}C")
                    print(f"   >>> DECISÃO: {nivel} ({recomendacao})")
                    
                    # 2. Persistência na Nuvem
                    salvar_banco(sensor_id, umidade, temperatura, nivel)
                    
                except json.JSONDecodeError:
                    print(f"   >>> [AVISO] JSON inválido recebido: {linha}")
                except Exception as e:
                    print(f"   >>> [ERRO PROCESSAMENTO]: {e}")
                    
        time.sleep(0.1)

except serial.SerialException as e:
    print(f"ERRO: Porta {PORTA_SERIAL} não encontrada ou ocupada: {e}")
except KeyboardInterrupt:
    print("\nEncerrando Gateway...")
finally:
    if 'ser' in locals() and ser.is_open:
        ser.close()
