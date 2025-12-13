package br.com.irrigation.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade que representa uma leitura de dados do sensor no campo.
 * Armazena informações de umidade do solo, nível de bateria e metadados do dispositivo.
 */
@Entity
@Table(name = "sensor_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Identificador único do dispositivo no campo (ex: "HELTEC-01", "HELTEC-A")
     */
    @Column(name = "device_id", nullable = false, length = 50)
    private String deviceId;

    /**
     * Umidade do solo em percentual (0.0 a 100.0)
     */
    @Column(name = "soil_moisture", nullable = false)
    private Double soilMoisture;

    /**
     * Nível de bateria em Volts (ex: 3.7V)
     */
    @Column(name = "battery_level", nullable = false)
    private Double batteryLevel;

    /**
     * Timestamp da leitura (gerado pelo servidor no momento da recepção)
     */
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    /**
     * Método pré-persistência para garantir que o timestamp seja definido
     * caso não tenha sido informado explicitamente.
     */
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}

