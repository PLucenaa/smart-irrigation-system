import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Droplets, Thermometer, RefreshCw, Sprout } from 'lucide-react'
import { Leitura } from './types/leitura'


// Constantes de configuração
const API_ENDPOINT = '/api/leituras'
const POLLING_INTERVAL_MS = 10000 // 10 segundos
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const BUILD_TIME = new Date().toLocaleString('pt-BR');

// Valores padrão para quando não há dados disponíveis
const DADOS_PADRAO: Partial<Leitura> = {
  umidade: 0,
  temperatura: 0,
  status: 'OFFLINE'
}

export default function Dashboard() {
  const [dados, setDados] = useState<Leitura[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Busca os dados da API e atualiza o estado do componente.
   * Em caso de erro, atualiza o estado de erro para exibição ao usuário.
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

  // Configura o polling automático ao montar o componente
  useEffect(() => {
    buscarDados(); // Primeira busca imediata

    const intervalId = setInterval(buscarDados, POLLING_INTERVAL_MS);

    // Cleanup: remove o intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, []);

  // Obtém a última leitura ou usa valores padrão
  const ultimaLeitura: Leitura = dados.length > 0
    ? dados[0]
    : { ...DADOS_PADRAO } as Leitura;

  // Inverte os dados para exibição no gráfico (mais antigo à esquerda)
  const dadosParaGrafico = [...dados].reverse();

  // Determina a cor do badge de status baseado no valor
  const obterCorStatus = (status: string): string => {
    switch (status) {
      case 'CRITICO':
        return 'bg-red-500';
      case 'ATENCAO':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Sprout className="text-green-600" /> Smart Irrigation
              </h1>
              <p className="text-slate-500">
                Monitoramento em Tempo Real - LoRa & Spring Boot
                <span className="ml-2 text-xs text-slate-400">
                  v{APP_VERSION} - {BUILD_TIME}
                </span>
              </p>
            </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Sprout className="text-green-600" /> Smart Irrigation
            </h1>
            <p className="text-slate-500">Monitoramento em Tempo Real - LoRa & Spring Boot</p>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={loading ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}
            >
              {loading ? "Carregando..." : "Conectado API"}
            </Badge>
            {erro && (
              <Badge variant="outline" className="bg-red-100 text-red-700">
                Erro: {erro}
              </Badge>
            )}
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Umidade do Solo</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ultimaLeitura.umidade?.toFixed(1) ?? '0.0'}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Temperatura</CardTitle>
              <Thermometer className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ultimaLeitura.temperatura?.toFixed(1) ?? '0.0'}°C
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Status da Borda</CardTitle>
              <RefreshCw className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <Badge
                className={`text-white hover:bg-opacity-80 ${obterCorStatus(ultimaLeitura.status || 'NORMAL')}`}
              >
                {ultimaLeitura.status || 'AGUARDANDO'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico */}
        <Card className="col-span-4 shadow-md">
          <CardHeader>
            <CardTitle>Histórico de Leituras</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosParaGrafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="dataHora"
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  tick={{fill: '#64748b'}}
                />
                <Tooltip 
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="umidade" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}