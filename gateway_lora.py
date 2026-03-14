import serial
import json
import time
import datetime
import os
import psycopg2
import sys

# ============================================================================
# CONSTANTES DE CONFIGURAÇÃO E SEGURANÇA
# ============================================================================
PORTA_SERIAL = os.getenv('PORTA_SERIAL', '/dev/ttyUSB0')
BAUD_RATE = int(os.getenv('BAUD_RATE', '115200'))
TOKEN_ESPERADO = "AgroTCC@2026"

DB_CONFIG = {
    "host": os.getenv('DB_HOST', 'localhost'),
    "database": os.getenv('DB_DATABASE', 'banco_tcc'),
    "user": os.getenv('DB_USER', 'irrigation_app'),
    "password": os.getenv('DB_PASSWORD', ''),
    "port": os.getenv('DB_PORT', '5432')
}

UMIDADE_CRITICA_PERCENTUAL = 40.0
TEMPERATURA_CRITICA_CELSIUS = 30.0

def salvar_no_banco(sensor_id: str, umidade: float, temperatura: float, status: str) -> bool:
    conexao = None
    try:
        conexao = psycopg2.connect(**DB_CONFIG)
        cursor = conexao.cursor()
        query = """
            INSERT INTO leituras (sensor_id, umidade, temperatura, status)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (sensor_id, umidade, temperatura, status))
        conexao.commit()
        cursor.close()
        print(f"   >>> [NUVEM] Sucesso! Dado salvo no DB (VPS).")
        sys.stdout.flush()
        return True
    except Exception as e:
        print(f"   >>> [ERRO BANCO] Falha ao conectar na VPS: {e}")
        sys.stdout.flush()
        return False
    finally:
        if conexao:
            conexao.close()

def calcular_status_irrigacao(umidade: float, temperatura: float) -> tuple[str, str]:
    if umidade < UMIDADE_CRITICA_PERCENTUAL and temperatura > TEMPERATURA_CRITICA_CELSIUS:
        return "CRITICO", "Irrigação Imediata"
    elif umidade < UMIDADE_CRITICA_PERCENTUAL:
        return "ATENCAO", "Planejar Irrigação"
    else:
        return "NORMAL", "Monitorando"

def processar_dados_serial(linha: str) -> dict | None:
    try:
        inicio = linha.find('{')
        fim = linha.rfind('}')
        if inicio == -1 or fim == -1: return None

        json_limpo = linha[inicio : fim + 1]
        dados_json = json.loads(json_limpo)

        # SEGUNDA CAMADA DE SEGURANÇA (No Edge/Raspberry)
        if dados_json.get('token') != TOKEN_ESPERADO:
            print("   >>> [ALERTA DE SEGURANÇA] Pacote bloqueado. Token incorreto!")
            return None

        return {
            'sensor_id': dados_json.get('id', 'Desconhecido'),
            'umidade': float(dados_json.get('umid', 0.0)),
            'temperatura': float(dados_json.get('temp', 0.0)) # Padrão 0.0 se não enviado
        }
    except Exception:
        return None

def main():
    print(f"--- INICIANDO EDGE GATEWAY (Raspberry Pi) ---")
    sys.stdout.flush()

    while True:
        porta_serial = None
        try:
            porta_serial = serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1)
            porta_serial.flush()
            print(f"Porta {PORTA_SERIAL} conectada.")

            while True:
                if porta_serial.in_waiting > 0:
                    try:
                        linha = porta_serial.readline().decode('utf-8', errors='ignore').strip()
                        dados = processar_dados_serial(linha)

                        if dados:
                            status, rec = calcular_status_irrigacao(dados['umidade'], dados['temperatura'])
                            print(f"\n[RX] Sensor {dados['sensor_id']} | Umid: {dados['umidade']}% | Heurística: {status}")
                            salvar_no_banco(dados['sensor_id'], dados['umidade'], dados['temperatura'], status)
                    except Exception as e:
                        pass

                time.sleep(0.1)

        except serial.SerialException:
            print("Aguardando Heltec USB...")
            time.sleep(5)
        except KeyboardInterrupt:
            break
        finally:
            if porta_serial and porta_serial.is_open:
                porta_serial.close()

if __name__ == '__main__':
    main()