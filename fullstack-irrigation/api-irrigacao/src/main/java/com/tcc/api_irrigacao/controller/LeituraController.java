package com.tcc.api_irrigacao.controller; 

import com.tcc.api_irrigacao.model.Leitura;
import com.tcc.api_irrigacao.repository.LeituraRepository; 

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/leituras")
@CrossOrigin(origins = "*") // Libera o React acessar
public class LeituraController {

    @Autowired
    private LeituraRepository repository;

    @GetMapping
    public List<Leitura> listar() {
        return repository.findAllByOrderByDataHoraDesc();
    }
}