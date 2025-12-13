package br.com.irrigation.controller;

import br.com.irrigation.dto.TelemetryRequest;
import br.com.irrigation.model.SensorData;
import br.com.irrigation.service.TelemetryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para receber dados de telemetria dos dispositivos no campo.
 */
@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
@Slf4j
public class TelemetryController {

    private final TelemetryService telemetryService;

    /**
     * Endpoint para receber dados de telemetria dos sensores.
     * O timestamp é gerado automaticamente pelo servidor no momento da recepção.
     *
     * @param request DTO com os dados do sensor (deviceId, soilMoisture, batteryLevel)
     * @return ResponseEntity com o SensorData salvo e status HTTP 201 (CREATED)
     */
    @PostMapping
    public ResponseEntity<SensorData> receiveTelemetry(@Valid @RequestBody TelemetryRequest request) {
        log.info("Recebendo telemetria do dispositivo: {}", request.getDeviceId());

        SensorData savedData = telemetryService.saveTelemetryData(
                request.getDeviceId(),
                request.getSoilMoisture(),
                request.getBatteryLevel()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(savedData);
    }

    /**
     * Endpoint para buscar todos os dados de telemetria.
     *
     * @return ResponseEntity com lista de SensorData ordenada por timestamp decrescente
     */
    @GetMapping
    public ResponseEntity<List<SensorData>> getAllTelemetry() {
        log.debug("Buscando todos os dados de telemetria");

        List<SensorData> allData = telemetryService.getAllTelemetryData();
        
        // Ordena por timestamp decrescente (mais recente primeiro)
        allData.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

        return ResponseEntity.ok(allData);
    }
}

