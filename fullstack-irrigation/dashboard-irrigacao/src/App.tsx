import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Gauge } from "./components/ui/Gauge"
import { ClimaCard } from "./components/ClimaCard"
import { RecomendacaoInteligenteCard } from "./components/RecomendacaoInteligenteCard"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts'
import {
  Droplets,
  Sprout,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react'
import { Leitura } from './types/leitura'

// Constantes de configuração
const API_ENDPOINT = '/api/leituras'
const POLLING_INTERVAL_MS = 10000
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'
const BUILD_TIME = new Date().toLocaleString('pt-BR')

// Limites para cores e alertas
const UMIDADE_CRITICA = 40
const UMIDADE_ATENCAO = 60

// Valores padrão
const DADOS_PADRAO: Partial<Leitura> = {
  umidade: 0,
  temperatura: 0,
  status: 'OFFLINE'
}

export default function Dashboard() {
  const [dados, setDados] = useState<Leitura[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [irrigando, setIrrigando] = useState(false);

  /**
   * Busca os dados da API e atualiza o estado do componente.
   */
  const buscarDados = async (): Promise<void> => {
    try {
      setErro(null);
      const response = await fetch(API_ENDPOINT);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const dadosJson: Leitura[] = await response.json();
      setDados(dadosJson);
    } catch (error) {
      const mensagemErro = error instanceof Error
          ? error.message
          : 'Erro desconhecido ao buscar dados';

      console.error('Erro ao buscar dados:', error);
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  // Polling automático
  useEffect(() => {
    void buscarDados();
    const intervalId = setInterval(() => {
      void buscarDados();
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  // Obtém a última leitura
  const ultimaLeitura: Leitura = dados.length > 0
      ? dados[0]
      : { ...DADOS_PADRAO } as Leitura;

  // Dados para o gráfico (invertidos para cronologia)
  const dadosParaGrafico = [...dados].reverse();

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  /**
   * Determina a cor do status
   */
  const obterCorStatus = (status: string): string => {
    switch (status) {
      case 'CRITICO':
        return 'bg-red-500';
      case 'ATENCAO':
        return 'bg-yellow-500';
      case 'IRRIGACAO_MANUAL':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  /**
   * Calcula o tempo desde a última leitura do sensor
   */
  const calcularTempoDesdeLeitura = (): string => {
    if (!ultimaLeitura.dataHora) return 'Nunca';

    const dataLeitura = new Date(ultimaLeitura.dataHora);
    const agora = new Date();
    const diffSegundos = Math.floor((agora.getTime() - dataLeitura.getTime()) / 1000);

    if (diffSegundos < 60) return `Há ${diffSegundos} segundos`;
    if (diffSegundos < 3600) return `Há ${Math.floor(diffSegundos / 60)} minutos`;
    if (diffSegundos < 86400) return `Há ${Math.floor(diffSegundos / 3600)} horas`;
    return `Há ${Math.floor(diffSegundos / 86400)} dias`;
  };

  /**
   * Verifica se o dispositivo está online baseado na data/hora da última leitura
   * Sensor considerado online se última leitura foi há menos de 2 minutos
   */
  const estaOnline = (): boolean => {
    if (!ultimaLeitura.dataHora) return false;

    const dataLeitura = new Date(ultimaLeitura.dataHora);
    const agora = new Date();
    const diffMinutos = Math.floor((agora.getTime() - dataLeitura.getTime()) / (1000 * 60));

    return diffMinutos < 2; // Online se < 2 minutos
  };

  // Dentro do componente Dashboard, adicionar estado:
  const [probabilidadeChuva, setProbabilidadeChuva] = useState<number>(0)

  const obterRecomendacao = (): { texto: string; tipo: 'info' | 'warning' | 'critical' } => {
    const umidade = ultimaLeitura.umidade || 0
    const status = ultimaLeitura.status || 'NORMAL'
    const online = estaOnline()

    if (!online) {
      return {
        texto: '🔴 Sensor Offline: O dispositivo não está enviando dados. Verifique a conexão e a alimentação do sensor.',
        tipo: 'critical'
      }
    }

    if (status === 'CRITICO' || umidade < UMIDADE_CRITICA) {
      return {
        texto: '⚠️ Irrigação Imediata Necessária! O solo está muito seco. Risco de dano às plantas.',
        tipo: 'critical'
      }
    }

    if (status === 'ATENCAO' || umidade < UMIDADE_ATENCAO) {
      return {
        texto: '💡 Planejar Irrigação: O solo está secando. Recomenda-se irrigar nas próximas 2 horas.',
        tipo: 'warning'
      }
    }

    return {
      texto: '✅ Condições Ideais: Solo com umidade adequada. Sistema funcionando normalmente.',
      tipo: 'info'
    }
  }

  /**
   * Handler para ativação manual de irrigação
   */
  const handleIrrigacaoManual = async (): Promise<void> => {
    try {
      setIrrigando(true);

      const response = await fetch(`${API_ENDPOINT}/irrigacao-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = 'Erro ao ativar irrigação';
        throw new Error(errorMessage);
      }

      // Recarrega os dados para mostrar a ação manual
      await buscarDados();

      alert('✅ Irrigação manual ativada com sucesso! A ação foi registrada no sistema.');
    } catch (error) {
      console.error('Erro ao ativar irrigação manual:', error);
      alert('❌ Erro ao ativar irrigação manual. Tente novamente.');
    } finally {
      setIrrigando(false);
    }
  };

  const recomendacao = obterRecomendacao();
  const tempoLeitura = calcularTempoDesdeLeitura();
  const online = estaOnline();

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 font-sans text-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Cabeçalho com Heartbeat */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Sprout className="text-green-600" /> Smart Irrigation
              </h1>
              <p className="text-slate-500 mt-1">
                Monitoramento em Tempo Real - LoRa & Spring Boot
                <span className="ml-2 text-xs text-slate-400">
                v{APP_VERSION} - {BUILD_TIME}
              </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge
                  variant="outline"
                  className={loading ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}
              >
                {loading ? "Carregando..." : "Conectado API"}
              </Badge>
              {/* Heartbeat Indicator - Bolinha no canto */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                    online ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`} title={online ? "Sensor Online" : "Sensor Offline"} />
                <Badge
                    variant="outline"
                    className={online ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                >
                  {online ? (
                      <>
                        <Wifi className="w-3 h-3 mr-1" /> Online
                      </>
                  ) : (
                      <>
                        <WifiOff className="w-3 h-3 mr-1" /> Offline
                      </>
                  )}
                </Badge>
              </div>
              {erro && (
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    Erro: {erro}
                  </Badge>
              )}
            </div>
          </div>

          {/* Cards de KPIs - Nível 1 (3 cards agora) */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Gauge de Umidade */}
            <Card className="border-2 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Umidade do Solo</CardTitle>
                <Droplets className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <Gauge value={ultimaLeitura.umidade || 0} size={200} strokeWidth={25} />
                  <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500">
                      {ultimaLeitura.umidade && ultimaLeitura.umidade >= UMIDADE_ATENCAO && '✅ Solo Úmido (60-100%)'}
                      {ultimaLeitura.umidade && ultimaLeitura.umidade >= UMIDADE_CRITICA && ultimaLeitura.umidade < UMIDADE_ATENCAO && '⚠️ Atenção (40-60%)'}
                      {ultimaLeitura.umidade && ultimaLeitura.umidade < UMIDADE_CRITICA && '🔴 Crítico (0-40%)'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Status do Sistema */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Status do Sistema</CardTitle>
                {ultimaLeitura.status === 'CRITICO' ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : ultimaLeitura.status === 'ATENCAO' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  {ultimaLeitura.status === 'IRRIGACAO_MANUAL' ? 'IRRIGAÇÃO MANUAL' : (ultimaLeitura.status || 'AGUARDANDO')}
                </div>
                <Badge
                    className={`text-white hover:bg-opacity-80 ${obterCorStatus(ultimaLeitura.status || 'NORMAL')}`}
                >
                  {ultimaLeitura.status === 'IRRIGACAO_MANUAL' ? 'IRRIGAÇÃO MANUAL' : (ultimaLeitura.status || 'AGUARDANDO')}
                </Badge>
              </CardContent>
            </Card>

            {/* Card 3: Última Atualização */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Última Leitura do Sensor</CardTitle>
                <Clock className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {tempoLeitura}
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  {online ? (
                      <>
                        <Wifi className="w-3 h-3 text-green-500" /> Sensor ativo
                      </>
                  ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-red-500" /> Sem sinal
                      </>
                  )}
                </p>
                {ultimaLeitura.dataHora && (
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(ultimaLeitura.dataHora).toLocaleString('pt-BR')}
                    </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cards de Clima e Recomendação - Nível 1.5 (2 cards lado a lado) */}
          <div className="grid gap-4 md:grid-cols-2">
            <ClimaCard
                latitude={2.9087}
                longitude={-61.3039}
                onProbabilidadeChuvaChange={setProbabilidadeChuva}
            />
            <RecomendacaoInteligenteCard
                umidade={ultimaLeitura.umidade || 0}
                probabilidadeChuva={probabilidadeChuva}
                sensorOnline={online}
            />
          </div>

          {/* Gráfico Inteligente - Nível 2 */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Histórico de Leituras - Umidade do Solo</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {dados.length} leituras
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={dadosParaGrafico}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                      dataKey="dataHora"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(t) => {
                        const date = new Date(t);
                        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      }}
                  />
                  <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      label={{ value: 'Umidade (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      labelFormatter={(t) => {
                        const date = new Date(t);
                        return `Hora: ${date.toLocaleString('pt-BR')}`;
                      }}
                      formatter={(value: unknown, name: string) => {
                        if (name === 'umidade' || String(value).includes('%')) {
                          return [`${value}%`, 'Umidade'];
                        }
                        return [String(value), name];
                      }}
                  />
                  <ReferenceLine
                      y={UMIDADE_CRITICA}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      label={{ value: "Limite Crítico (40%)", position: "top", fill: "#ef4444" }}
                  />
                  <ReferenceLine
                      y={UMIDADE_ATENCAO}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{ value: "Limite Atenção (60%)", position: "top", fill: "#f59e0b" }}
                  />
                  <Legend />
                  <Line
                      type="monotone"
                      dataKey="umidade"
                      name="Umidade (%)"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3b82f6' }}
                      activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Informações do Sensor - Nível 3 */}
          {ultimaLeitura.sensorId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-600">Informações do Sensor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Sensor ID:</span>
                      <Badge variant="outline">{ultimaLeitura.sensorId}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Status:</span>
                      <Badge className={online ? "bg-green-500" : "bg-red-500"}>
                        {online ? "🟢 Online" : "🔴 Offline"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Última leitura:</span>
                      <span className="text-sm font-medium">
                    {ultimaLeitura.dataHora
                        ? new Date(ultimaLeitura.dataHora).toLocaleString('pt-BR')
                        : 'N/A'}
                  </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
  )
}