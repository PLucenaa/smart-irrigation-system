package com.tcc.api_irrigacao.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "leituras")
public class Leitura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sensor_id")
    private String sensorId;

    private Double umidade;
    
    private Double temperatura;
    
    private String status;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;
}