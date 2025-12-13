import { useState, useEffect, useCallback } from 'react';
import { telemetryService } from '../services/api';
import type { SensorData } from '../types/telemetry';

/**
 * Hook customizado para buscar dados de telemetria com polling automático.
 * Faz requisições a cada 5 segundos para manter os dados atualizados.
 * 
 * @param pollingInterval Intervalo de polling em milissegundos (padrão: 5000ms)
 * @returns Objeto com dados de telemetria, loading state, error e função de refresh manual
 */
export const useTelemetry = (pollingInterval: number = 5000) => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Função para buscar dados da API.
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const telemetryData = await telemetryService.getAllTelemetry();
      
      // Ordena por timestamp mais recente primeiro
      const sortedData = telemetryData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setData(sortedData);
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido ao buscar dados');
      setError(error);
      setLoading(false);
      console.error('Erro no hook useTelemetry:', error);
    }
  }, []);

  /**
   * Efeito para iniciar o polling automático.
   */
  useEffect(() => {
    // Busca inicial
    fetchData();

    // Configura o intervalo de polling
    const intervalId = setInterval(() => {
      fetchData();
    }, pollingInterval);

    // Limpa o intervalo quando o componente desmonta
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, pollingInterval]);

  /**
   * Função para refresh manual dos dados.
   */
  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};

