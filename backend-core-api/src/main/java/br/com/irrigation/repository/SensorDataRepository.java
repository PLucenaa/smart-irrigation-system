package br.com.irrigation.repository;

import br.com.irrigation.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository para operações de persistência da entidade SensorData.
 */
@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    /**
     * Busca todas as leituras de um dispositivo específico.
     *
     * @param deviceId Identificador do dispositivo
     * @return Lista de leituras do dispositivo ordenadas por timestamp decrescente
     */
    List<SensorData> findByDeviceIdOrderByTimestampDesc(String deviceId);

    /**
     * Busca leituras de um dispositivo em um intervalo de tempo.
     *
     * @param deviceId Identificador do dispositivo
     * @param startTime Data/hora inicial
     * @param endTime Data/hora final
     * @return Lista de leituras no intervalo especificado
     */
    List<SensorData> findByDeviceIdAndTimestampBetween(String deviceId, LocalDateTime startTime, LocalDateTime endTime);
}

