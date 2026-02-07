import serial
import json
import time
import datetime
import os
import psycopg2
import sys # Importante para forçar o log aparecer no systemd

# ============================================================================
# CONSTANTES DE CONFIGURAÇÃO
# ============================================================================
PORTA_SERIAL = os.getenv('PORTA_SERIAL', '/dev/ttyUSB0')
BAUD_RATE = int(os.getenv('BAUD_RATE', '115200'))

# Configuração do Banco de Dados
DB_CONFIG = {
    "host": os.getenv('DB_HOST', 'localhost'),
    "database": os.getenv('DB_DATABASE', 'banco_tcc'),
    "user": os.getenv('DB_USER', 'irrigation_app'),
    "password": os.getenv('DB_PASSWORD', ''),
    "port": os.getenv('DB_PORT', '5432')
}

UMIDADE_CRITICA_PERCENTUAL = 40.0
TEMPERATURA_CRITICA_CELSIUS = 30.0
INTERVALO_LEITURA_SEGUNDOS = 0.1

# ============================================================================
# FUNÇÕES DE PERSISTÊNCIA
# ============================================================================

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

        print(f"   >>> [NUVEM] Sucesso! Dado salvo no DB.")
        sys.stdout.flush() # Força o print aparecer no log do systemd imediatamente
        return True

    except Exception as e:
        print(f"   >>> [ERRO BANCO] Falha ao conectar ou salvar no VPS: {e}")
        sys.stdout.flush()
        return False
    finally:
        if conexao:
            conexao.close()

# ============================================================================
# LÓGICA DE NEGÓCIO
# ============================================================================

def calcular_status_irrigacao(umidade: float, temperatura: float) -> tuple[str, str]:
    if umidade < UMIDADE_CRITICA_PERCENTUAL and temperatura > TEMPERATURA_CRITICA_CELSIUS:
        return "CRITICO", "Irrigação Imediata (Risco Térmico)"
    elif umidade < UMIDADE_CRITICA_PERCENTUAL:
        return "ATENCAO", "Planejar Irrigação"
    else:
        return "NORMAL", "Monitorando"

def processar_dados_serial(linha: str) -> dict | None:
    """
    Versão tolerante a falhas: Encontra o JSON mesmo se tiver texto antes (ex: 'RX: ')
    """
    try:
        # Encontra onde começa o JSON (primeira chave '{')
        inicio = linha.find('{')
        # Encontra onde termina o JSON (última chave '}')
        fim = linha.rfind('}')
        
        # Se não achou chave de abrir ou fechar, ignora
        if inicio == -1 or fim == -1:
            return None
            
        # Recorta apenas a parte do JSON
        json_limpo = linha[inicio : fim + 1]
        
        dados_json = json.loads(json_limpo)

        return {
            'sensor_id': dados_json.get('id', 'Desconhecido'),
            'umidade': float(dados_json.get('umid', 0.0)),
            'temperatura': float(dados_json.get('temp', 0.0))
        }
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        # Opcional: Descomente para ver erros no log se precisar
        # print(f"   >>> [AVISO] JSON Invalido: {e}") 
        return None

# ============================================================================
# LOOP PRINCIPAL (MODO SERVIÇO)
# ============================================================================

def main():
    print(f"--- INICIANDO GATEWAY TCC (Versão Serviço Blindado) ---")
    print(f"Conectando ao banco em: {DB_CONFIG['host']}...")
    sys.stdout.flush()

    # LOOP DA IMORTALIDADE (Garante que o script nunca termine)
    while True:
        porta_serial = None
        try:
            # Tenta conectar na porta serial
            print(f"Tentando abrir porta {PORTA_SERIAL}...")
            porta_serial = serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1)
            porta_serial.flush()
            print(f"SUCESSO! Porta {PORTA_SERIAL} conectada.")
            sys.stdout.flush()

            # Loop de Leitura (enquanto a conexão existir)
            while True:
                if porta_serial.in_waiting > 0:
                    try:
                        linha = porta_serial.readline().decode('utf-8', errors='ignore').strip()
                        dados = processar_dados_serial(linha)

                        if dados:
                            status, recomendacao = calcular_status_irrigacao(
                                dados['umidade'], dados['temperatura']
                            )

                            timestamp = datetime.datetime.now().strftime("%H:%M:%S")
                            print(f"\n[{timestamp}] Sensor: {dados['sensor_id']} | Umid: {dados['umidade']}%")
                            
                            salvar_no_banco(
                                dados['sensor_id'], 
                                dados['umidade'], 
                                dados['temperatura'], 
                                status
                            )
                    except Exception as e_loop:
                        print(f"Erro no loop de leitura: {e_loop}")
                
                # Pausa para não fritar a CPU
                time.sleep(INTERVALO_LEITURA_SEGUNDOS)

        except serial.SerialException as e:
            print(f"ERRO DE SERIAL: {e}")
            print("Tentando reconectar em 5 segundos...")
            sys.stdout.flush()
            time.sleep(5) # Espera antes de tentar conectar de novo
            
        except KeyboardInterrupt:
            print("\nParada manual solicitada. Encerrando.")
            break # Único jeito de sair é com Ctrl+C manual
            
        except Exception as e_geral:
            print(f"ERRO CRITICO NÃO TRATADO: {e_geral}")
            time.sleep(5)
            
        finally:
            # Garante que fecha para reabrir limpo na próxima volta do while
            if porta_serial and porta_serial.is_open:
                porta_serial.close()

if __name__ == '__main__':
    main()
