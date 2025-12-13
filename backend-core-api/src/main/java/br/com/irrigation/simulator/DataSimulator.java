package br.com.irrigation.simulator;

import br.com.irrigation.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * Simulador de dados de sensores para desenvolvimento e testes.
 * Gera dados aleatórios realistas a cada 10 segundos e os persiste no banco de dados.
 * 
 * Este simulador é útil para desenvolvimento do frontend enquanto o hardware
 * (sensores e LoRa) ainda não está disponível.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSimulator {

    private final TelemetryService telemetryService;
    private final Random random = new Random();

    /**
     * Lista de dispositivos simulados.
     * Pode ser expandida conforme necessário.
     */
    private static final List<String> SIMULATED_DEVICES = Arrays.asList(
            "HELTEC-01",
            "HELTEC-02",
            "HELTEC-03"
    );

    /**
     * Gera dados simulados a cada 10 segundos (10000 ms).
     * 
     * Parâmetros realistas:
     * - Umidade do solo: entre 20% e 80%
     * - Nível de bateria: entre 3.0V e 4.2V (bateria LiPo típica)
     */
    @Scheduled(fixedRate = 10000)
    public void generateSimulatedData() {
        for (String deviceId : SIMULATED_DEVICES) {
            // Gera umidade do solo entre 20% e 80%
            double soilMoisture = 20.0 + (random.nextDouble() * 60.0);
            
            // Gera nível de bateria entre 3.0V e 4.2V
            double batteryLevel = 3.0 + (random.nextDouble() * 1.2);

            // Arredonda para 1 casa decimal
            soilMoisture = Math.round(soilMoisture * 10.0) / 10.0;
            batteryLevel = Math.round(batteryLevel * 10.0) / 10.0;

            // Salva os dados simulados usando o serviço de telemetria
            telemetryService.saveTelemetryData(deviceId, soilMoisture, batteryLevel);
            
            log.debug("Dados simulados gerados: DeviceId={}, SoilMoisture={}%, BatteryLevel={}V", 
                     deviceId, soilMoisture, batteryLevel);
        }
        
        log.info("Ciclo de simulação concluído para {} dispositivos", SIMULATED_DEVICES.size());
    }
}

