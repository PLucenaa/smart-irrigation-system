# 🌾 Sistema de Monitoramento de Irrigação IoT (TCC)

Este projeto consiste em um ecossistema IoT para monitoramento de umidade e temperatura em tempo real, utilizando a arquitetura de **Computação de Borda (Edge Computing)** e **Computação em Nuvem**.

---

## 🏗️ Arquitetura do Sistema
1. **Sensor Node (Heltec V3):** Coleta dados de umidade e envia via Rádio LoRa (915MHz).
2. **Bridge/Gateway (Heltec V3 + Raspberry Pi):** Recebe os pacotes LoRa e os envia via Serial (USB) para o Raspberry Pi.
3. **Processamento de Borda (Raspberry Pi):** Executa lógica de decisão (Normal/Atenção/Crítico) e envia para a Nuvem.
4. **Nuvem (VPS Hostinger):** Armazena os dados em um banco PostgreSQL dentro de um container Docker.

---

## 🍓 1. Raspberry Pi (Gateway de Borda)

Sempre que o Raspberry Pi for iniciado, siga os passos abaixo para rodar o gateway.

### Comandos Iniciais
```bash
# Entrar na pasta do projeto
cd ~/tcc_project

# Ativar o ambiente virtual (VITAL)
source venv/bin/activate

# Rodar o script principal
python3 gateway_lora.py


#  Instalação de dependencias
python3 -m venv venv
source venv/bin/activate
pip install pyserial requests psycopg2-binary
