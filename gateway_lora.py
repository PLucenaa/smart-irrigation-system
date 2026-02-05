import serial
import json
import time
import datetime
import os
import psycopg2

# ============================================================================
# CONSTANTES DE CONFIGURAÇÃO
# ============================================================================
PORTA_SERIAL = os.getenv('PORTA_SERIAL', '/dev/ttyUSB0')
BAUD_RATE = int(os.getenv('BAUD_RATE', '115200'))

# Configuração do Banco de Dados (via variáveis de ambiente)
DB_CONFIG = {
    "host": os.getenv('DB_HOST', 'localhost'),
    "database": os.getenv('DB_DATABASE', 'banco_tcc'),
    "user": os.getenv('DB_USER', 'irrigation_app'),
    "password": os.getenv('DB_PASSWORD', ''),
    "port": os.getenv('DB_PORT', '5432')
}

# Constantes para lógica de negócio (regras de irrigação)
UMIDADE_CRITICA_PERCENTUAL = 40.0
TEMPERATURA_CRITICA_CELSIUS = 30.0
INTERVALO_LEITURA_SEGUNDOS = 0.1

# ============================================================================
# FUNÇÕES DE PERSISTÊNCIA
# ============================================================================

def salvar_no_banco(sensor_id: str, umidade: float, temperatura: float, status: str) -> bool:
    """
    Conecta ao banco de dados no VPS e persiste o registro de leitura.

    Args:
        sensor_id: Identificador único do sensor
        umidade: Valor de umidade em percentual
        temperatura: Valor de temperatura em graus Celsius
        status: Status calculado (NORMAL, ATENCAO, CRITICO)

    Returns:
        True se a operação foi bem-sucedida, False caso contrário
    """
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
        return True

    except Exception as e:
        print(f"   >>> [ERRO BANCO] Falha ao conectar ou salvar no VPS: {e}")
        return False
    finally:
        if conexao:
            conexao.close()

# ============================================================================
# LÓGICA DE NEGÓCIO (EDGE COMPUTING)
# ============================================================================

def calcular_status_irrigacao(umidade: float, temperatura: float) -> tuple[str, str]:
    """
    Aplica a regra de negócio na borda (Edge Computing) para determinar
    o status e recomendação de irrigação baseado nos valores dos sensores.

    Args:
        umidade: Valor de umidade em percentual
        temperatura: Valor de temperatura em graus Celsius

    Returns:
        Tupla contendo (status, recomendacao)
        - status: 'CRITICO', 'ATENCAO' ou 'NORMAL'
        - recomendacao: Mensagem descritiva da ação recomendada
    """
    if umidade < UMIDADE_CRITICA_PERCENTUAL and temperatura > TEMPERATURA_CRITICA_CELSIUS:
        return "CRITICO", "Irrigação Imediata (Risco Térmico)"
    elif umidade < UMIDADE_CRITICA_PERCENTUAL:
        return "ATENCAO", "Planejar Irrigação"
    else:
        return "NORMAL", "Monitorando"

# ============================================================================
# PROCESSAMENTO DE DADOS SERIAIS
# ============================================================================

def processar_dados_serial(linha: str) -> dict | None:
    """
    Processa uma linha recebida da porta serial, validando e extraindo
    os dados do sensor.

    Args:
        linha: String JSON recebida da porta serial

    Returns:
        Dicionário com os dados processados ou None em caso de erro
    """
    if not (linha.startswith('{') and linha.endswith('}')):
        return None

    try:
        dados_json = json.loads(linha)

        sensor_id = dados_json.get('id', 'Desconhecido')
        umidade = float(dados_json.get('umid', 0.0))
        temperatura = float(dados_json.get('temp', 0.0))

        return {
            'sensor_id': sensor_id,
            'umidade': umidade,
            'temperatura': temperatura
        }
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"   >>> [AVISO] Erro ao processar JSON: {e}")
        return None

# ============================================================================
# LOOP PRINCIPAL
# ============================================================================

def main():
    """Função principal que gerencia o loop de leitura serial e persistência."""
    print(f"--- INICIANDO GATEWAY TCC (vFinal Corrigida) ---")
    print(f"Conectando ao banco em: {DB_CONFIG['host']}...")

    porta_serial = None

    try:
        porta_serial = serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1)
        porta_serial.flush()
        print(f"Lendo dados da porta {PORTA_SERIAL}...")

        while True:
            if porta_serial.in_waiting > 0:
                linha = porta_serial.readline().decode('utf-8', errors='ignore').strip()

                dados_processados = processar_dados_serial(linha)

                if dados_processados:
                    # Aplica lógica de negócio na borda
                    status, recomendacao = calcular_status_irrigacao(
                        dados_processados['umidade'],
                        dados_processados['temperatura']
                    )

                    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
                    print(f"\n[{timestamp}] Sensor: {dados_processados['sensor_id']} | "
                          f"Umid: {dados_processados['umidade']}% | "
                          f"Temp: {dados_processados['temperatura']}°C")
                    print(f"   >>> DECISÃO: {status} ({recomendacao})")
                    
                    # Persiste na nuvem
                    salvar_no_banco(
                        dados_processados['sensor_id'],
                        dados_processados['umidade'],
                        dados_processados['temperatura'],
                        status
                    )

            time.sleep(INTERVALO_LEITURA_SEGUNDOS)

    except serial.SerialException as e:
        print(f"ERRO: Porta {PORTA_SERIAL} não encontrada ou ocupada: {e}")
    except KeyboardInterrupt:
        print("\nEncerrando Gateway...")
    finally:
        if porta_serial and porta_serial.is_open:
            porta_serial.close()

if __name__ == '__main__':
    main()