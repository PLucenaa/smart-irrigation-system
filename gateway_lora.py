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
PORTA_SERIAL = os.getenv('PORTA_SERIAL', 'COM4') # Ajuste para a sua porta
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

# Arquivo que servirá como "memória" se a internet cair
ARQUIVO_BUFFER = "dados_pendentes.csv"

# ============================================================================
# FUNÇÕES DE BANCO DE DADOS E BUFFER (STORE AND FORWARD)
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
        print(f"   >>> [NUVEM] Sucesso! Dado salvo no DB (VPS).")
        sys.stdout.flush()
        return True
    except Exception as e:
        print(f"   >>> [ERRO BANCO] Falha ao conectar na VPS (Sem Internet?). Erro: {e}")
        sys.stdout.flush()
        return False
    finally:
        if conexao:
            conexao.close()

def salvar_no_buffer(sensor_id: str, umidade: float, temperatura: float, status: str):
    """ Salva o dado localmente se o banco de dados estiver inacessível """
    with open(ARQUIVO_BUFFER, "a", encoding="utf-8") as f:
        f.write(f"{sensor_id},{umidade},{temperatura},{status}\n")
    print("   >>> [OFFLINE] Dado guardado em segurança no buffer local (CSV).")
    sys.stdout.flush()

def sincronizar_buffer():
    """ Tenta enviar os dados represados para a nuvem quando a internet volta """
    if not os.path.exists(ARQUIVO_BUFFER):
        return # Não tem arquivo, não faz nada

    with open(ARQUIVO_BUFFER, "r", encoding="utf-8") as f:
        linhas = f.readlines()

    if not linhas:
        return

    print(f"   >>> [SYNC] Internet detectada! Tentando enviar {len(linhas)} registros represados...")

    linhas_restantes = []
    sucesso_geral = True

    for linha in linhas:
        linha = linha.strip()
        if not linha: continue

        # Separa os dados salvos no CSV
        partes = linha.split(',')
        if len(partes) == 4:
            s_id, u, t, st = partes
            # Tenta salvar no banco de dados novamente
            if salvar_no_banco(s_id, float(u), float(t), st):
                pass # Sucesso, a linha não vai para "linhas_restantes"
            else:
                sucesso_geral = False
                linhas_restantes.append(linha)
                break # A internet caiu de novo, para o loop e guarda o resto

    # Se tudo foi enviado, apaga o arquivo. Se não, reescreve só o que faltou.
    if sucesso_geral:
        os.remove(ARQUIVO_BUFFER)
        print("   >>> [SYNC] Sincronização concluída com sucesso! Buffer limpo.")
    else:
        with open(ARQUIVO_BUFFER, "w", encoding="utf-8") as f:
            for r in linhas_restantes:
                f.write(r + "\n")

# ============================================================================
# LÓGICA DE BORDA (EDGE COMPUTING)
# ============================================================================
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
            'temperatura': float(dados_json.get('temp', 0.0))
        }
    except Exception:
        return None

def main():
    print(f"--- INICIANDO EDGE GATEWAY (Raspberry Pi / PC) ---")
    sys.stdout.flush()

    while True:
        porta_serial = None
        try:
            porta_serial = serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1)
            porta_serial.flush()
            print(f"Porta {PORTA_SERIAL} conectada. Aguardando dados LoRa...")

            while True:
                if porta_serial.in_waiting > 0:
                    try:
                        linha = porta_serial.readline().decode('utf-8', errors='ignore').strip()
                        dados = processar_dados_serial(linha)

                        if dados:
                            # 1. Edge Computing: Calcula a heurística
                            status, rec = calcular_status_irrigacao(dados['umidade'], dados['temperatura'])
                            print(f"\n[RX] Sensor {dados['sensor_id']} | Umid: {dados['umidade']}% | Heurística: {status}")

                            # 2. Tenta sincronizar dados velhos presos no Buffer
                            sincronizar_buffer()

                            # 3. Tenta salvar o dado atual na nuvem
                            sucesso_nuvem = salvar_no_banco(dados['sensor_id'], dados['umidade'], dados['temperatura'], status)

                            # 4. Se a nuvem falhou, salva no Buffer local
                            if not sucesso_nuvem:
                                salvar_no_buffer(dados['sensor_id'], dados['umidade'], dados['temperatura'], status)

                    except Exception as e:
                        pass

                time.sleep(0.1)

        except serial.SerialException:
            print(f"Aguardando placa na porta {PORTA_SERIAL}...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nEncerrando Gateway.")
            break
        finally:
            if porta_serial and porta_serial.is_open:
                porta_serial.close()

if __name__ == '__main__':
    main()