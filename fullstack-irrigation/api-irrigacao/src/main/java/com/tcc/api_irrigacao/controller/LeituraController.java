package com.tcc.api_irrigacao.controller;

import com.tcc.api_irrigacao.model.Leitura;
import com.tcc.api_irrigacao.repository.LeituraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
}