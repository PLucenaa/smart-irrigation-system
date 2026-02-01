package com.tcc.api_irrigacao.repository; 

import com.tcc.api_irrigacao.model.Leitura; 
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeituraRepository extends JpaRepository<Leitura, Long> {
    // Busca as últimas leituras ordenadas por data
    List<Leitura> findAllByOrderByDataHoraDesc();
}