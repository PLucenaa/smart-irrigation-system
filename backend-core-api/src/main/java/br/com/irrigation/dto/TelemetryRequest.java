package br.com.irrigation.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para receber dados de telemetria do dispositivo no campo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryRequest {

    @NotBlank(message = "deviceId é obrigatório")
    private String deviceId;

    @NotNull(message = "soilMoisture é obrigatório")
    @DecimalMin(value = "0.0", message = "soilMoisture deve ser maior ou igual a 0.0")
    @DecimalMax(value = "100.0", message = "soilMoisture deve ser menor ou igual a 100.0")
    private Double soilMoisture;

    @NotNull(message = "batteryLevel é obrigatório")
    @DecimalMin(value = "0.0", message = "batteryLevel deve ser maior ou igual a 0.0")
    private Double batteryLevel;
}

