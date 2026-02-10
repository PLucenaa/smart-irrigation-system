package com.tcc.api_irrigacao.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller responsável por fazer proxy da API de clima (HG Brasil).
 * Resolve problemas de CORS ao fazer a requisição no backend.
 * Endpoint base: /api/clima
 */
@RestController
@RequestMapping("/api/clima")
@CrossOrigin(origins = "*") // Permite requisições do frontend
public class ClimaController {

    private final RestTemplate restTemplate;

    @Value("${HG_API_KEY:}")
    private String hgApiKey;

    public ClimaController() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Busca dados do clima na API HG Brasil e retorna para o frontend.
     *
     * @param latitude Latitude da localização (padrão: 2.9087)
     * @param longitude Longitude da localização (padrão: -61.3039)
     * @return ResponseEntity com os dados do clima ou erro
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> obterClima(
            @RequestParam(defaultValue = "2.9087") Double latitude,
            @RequestParam(defaultValue = "-61.3039") Double longitude) {

        try {
            if (hgApiKey == null || hgApiKey.isEmpty()) {
                Map<String, Object> erro = new HashMap<>();
                erro.put("erro", "Chave da API HG Brasil não configurada");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
            }

            // Monta a URL da API HG Brasil
            String url = String.format(
                    "https://api.hgbrasil.com/weather?key=%s&lat=%s&lon=%s&locale=pt",
                    hgApiKey, latitude, longitude
            );

            // Faz a requisição para a API externa
            Map<String, Object> resposta = restTemplate.getForObject(url, Map.class);

            if (resposta == null) {
                Map<String, Object> erro = new HashMap<>();
                erro.put("erro", "Resposta vazia da API HG Brasil");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
            }

            // Verifica se a chave é válida
            Boolean validKey = (Boolean) resposta.get("valid_key");
            if (validKey != null && !validKey) {
                Map<String, Object> erro = new HashMap<>();
                erro.put("erro", "Chave da API inválida");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(erro);
            }

            return ResponseEntity.ok(resposta);

        } catch (Exception e) {
            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", "Erro ao buscar dados do clima: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
        }
    }
}