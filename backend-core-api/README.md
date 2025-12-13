# Smart Irrigation System - Backend Core API

Sistema de Irrigação de Precisão via LoRa - Backend Core API

## Tecnologias

- Java 17+
- Spring Boot 3.2.0
- PostgreSQL
- Maven
- Lombok

## Estrutura do Projeto

```
backend-core-api/
├── src/
│   └── main/
│       ├── java/br/com/irrigation/
│       │   ├── Application.java                    # Classe principal com @EnableScheduling
│       │   ├── controller/
│       │   │   └── TelemetryController.java        # REST Controller para /api/telemetry
│       │   ├── dto/
│       │   │   └── TelemetryRequest.java           # DTO de entrada
│       │   ├── model/
│       │   │   └── SensorData.java                 # Entidade JPA
│       │   ├── repository/
│       │   │   └── SensorDataRepository.java       # Interface JPA Repository
│       │   ├── service/
│       │   │   └── TelemetryService.java           # Serviço com lógica de fusão de dados
│       │   └── simulator/
│       │       └── DataSimulator.java              # Simulador com @Scheduled
│       └── resources/
│           └── application.properties              # Configurações do banco de dados
└── pom.xml                                         # Configuração Maven
```

## Configuração do Banco de Dados

Antes de executar a aplicação, crie o banco de dados PostgreSQL:

```sql
CREATE DATABASE irrigation_db;
```

Edite o arquivo `application.properties` se necessário para ajustar:
- Usuário do banco (padrão: `postgres`)
- Senha do banco (padrão: `postgres`)
- Porta do banco (padrão: `5432`)

## Executando a Aplicação

```bash
mvn spring-boot:run
```

A aplicação iniciará na porta `8080`.

## Endpoints

### POST /api/telemetry

Recebe dados de telemetria dos sensores.

**Request Body:**
```json
{
  "deviceId": "HELTEC-01",
  "soilMoisture": 45.2,
  "batteryLevel": 3.7
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "deviceId": "HELTEC-01",
  "soilMoisture": 45.2,
  "batteryLevel": 3.7,
  "timestamp": "2024-01-15T10:30:00"
}
```

## Simulador de Dados

O `DataSimulator` gera dados aleatórios a cada 10 segundos para 3 dispositivos:
- HELTEC-01
- HELTEC-02
- HELTEC-03

Parâmetros simulados:
- Umidade do solo: 20% a 80%
- Nível de bateria: 3.0V a 4.2V

## Lógica de Fusão de Dados

Quando a umidade do solo (`soilMoisture`) for menor que 30%, o sistema loga um WARN:
```
ALERTA DE SECA: Iniciando protocolo de irrigação para o dispositivo HELTEC-01
```


