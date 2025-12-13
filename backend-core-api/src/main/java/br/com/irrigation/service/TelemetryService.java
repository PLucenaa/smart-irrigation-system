package br.com.irrigation.service;

import br.com.irrigation.model.SensorData;
import br.com.irrigation.repository.SensorDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Serviço responsável por processar e persistir dados de telemetria dos sensores.
 * Implementa a lógica de fusão de dados e alertas de seca.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryService {

    private static final double SOIL_MOISTURE_THRESHOLD = 30.0;

    private final SensorDataRepository sensorDataRepository;

    /**
     * Salva uma leitura de sensor e aplica a lógica de fusão de dados.
     * Se a umidade do solo estiver abaixo de 30%, gera um alerta de seca.
     *
     * @param deviceId Identificador do dispositivo
     * @param soilMoisture Umidade do solo em percentual
     * @param batteryLevel Nível de bateria em Volts
     * @return SensorData salvo no banco de dados
     */
    @Transactional
    public SensorData saveTelemetryData(String deviceId, Double soilMoisture, Double batteryLevel) {
        // Gera o timestamp no momento da recepção
        LocalDateTime timestamp = LocalDateTime.now();

        // Cria a entidade com os dados recebidos
        SensorData sensorData = SensorData.builder()
                .deviceId(deviceId)
                .soilMoisture(soilMoisture)
                .batteryLevel(batteryLevel)
                .timestamp(timestamp)
                .build();

        // Lógica de Fusão de Dados: Verifica alerta de seca
        if (soilMoisture < SOIL_MOISTURE_THRESHOLD) {
            log.warn("ALERTA DE SECA: Iniciando protocolo de irrigação para o dispositivo {}", deviceId);
        }

        // Persiste os dados
        SensorData savedData = sensorDataRepository.save(sensorData);
        log.debug("Dados de telemetria salvos: DeviceId={}, SoilMoisture={}%, BatteryLevel={}V", 
                  deviceId, soilMoisture, batteryLevel);

        return savedData;
    }

    /**
     * Busca todos os dados de telemetria, ordenados por timestamp decrescente.
     *
     * @return Lista de todos os SensorData
     */
    public List<SensorData> getAllTelemetryData() {
        return sensorDataRepository.findAll();
    }
}

