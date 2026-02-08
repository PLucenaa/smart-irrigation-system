package com.tcc.api_irrigacao.controller;

import com.tcc.api_irrigacao.model.Leitura;
import com.tcc.api_irrigacao.repository.LeituraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller responsável por gerenciar as requisições HTTP relacionadas às leituras dos sensores.
 * Endpoint base: /api/leituras
 */
@RestController
@RequestMapping("/api/leituras")
public class LeituraController {

    private final LeituraRepository repository;

    @Autowired
    public LeituraController(LeituraRepository repository) {
        this.repository = repository;
    }

    /**
     * Retorna todas as leituras ordenadas por data/hora (mais recentes primeiro).
     *
     * @return ResponseEntity contendo a lista de leituras ou erro em caso de falha
     */
    @GetMapping
    public ResponseEntity<List<Leitura>> obterTodasLeituras() {
        try {
            List<Leitura> leituras = repository.findAllByOrderByDataHoraDesc();
            return ResponseEntity.ok(leituras);
        } catch (Exception e) {
            // Log do erro seria ideal aqui (usando Logger)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint para ativação manual de irrigação.
     * Cria um registro no banco indicando que o usuário solicitou irrigação manualmente.
     *
     * @return ResponseEntity com a leitura criada ou erro em caso de falha
     */
    @PostMapping("/irrigacao-manual")
    public ResponseEntity<Leitura> ativarIrrigacaoManual() {
        try {
            // Obtém a última leitura para usar como base
            List<Leitura> ultimasLeituras = repository.findAllByOrderByDataHoraDesc();

            Leitura leituraManual = new Leitura();

            if (!ultimasLeituras.isEmpty()) {
                // Usa os dados do sensor mais recente
                Leitura ultima = ultimasLeituras.get(0);
                leituraManual.setSensorId(ultima.getSensorId());
                leituraManual.setUmidade(ultima.getUmidade());
                leituraManual.setTemperatura(ultima.getTemperatura());
            } else {
                // Se não houver leituras, usa valores padrão
                leituraManual.setSensorId("MANUAL");
                leituraManual.setUmidade(0.0);
                leituraManual.setTemperatura(0.0);
            }

            // Marca como ação manual
            leituraManual.setStatus("IRRIGACAO_MANUAL");
            leituraManual.setDataHora(LocalDateTime.now());

            Leitura salva = repository.save(leituraManual);

            return ResponseEntity.status(HttpStatus.CREATED).body(salva);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}