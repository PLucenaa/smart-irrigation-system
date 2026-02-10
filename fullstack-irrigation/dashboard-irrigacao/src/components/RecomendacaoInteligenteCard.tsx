import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Brain, CloudRain, Droplets, AlertCircle } from 'lucide-react'

interface RecomendacaoInteligenteCardProps {
    umidade: number
    probabilidadeChuva: number
    sensorOnline: boolean
}

export const RecomendacaoInteligenteCard: React.FC<RecomendacaoInteligenteCardProps> = ({
                                                                                            umidade,
                                                                                            probabilidadeChuva,
                                                                                            sensorOnline
                                                                                        }) => {
    // Lógica de recomendação inteligente
    const obterRecomendacao = (): {
        texto: string
        tipo: 'monitorando' | 'aguardar-chuva' | 'irrigar-agora'
        corFundo: string
        corBorda: string
        icone: React.ReactNode
    } => {
        // Se sensor offline, priorizar alerta
        if (!sensorOnline) {
            return {
                texto: 'Sensor Offline - Verifique a conexão',
                tipo: 'monitorando',
                corFundo: 'bg-gray-50',
                corBorda: 'border-gray-300',
                icone: <AlertCircle className="h-5 w-5 text-gray-500" />
            }
        }

        // Se chuva alta (>60%) e umidade não crítica, aguardar
        if (probabilidadeChuva > 60 && umidade >= 40) {
            return {
                texto: 'Aguardar Chuva - Previsão de chuva alta nas próximas horas',
                tipo: 'aguardar-chuva',
                corFundo: 'bg-blue-50',
                corBorda: 'border-blue-300',
                icone: <CloudRain className="h-5 w-5 text-blue-500" />
            }
        }

        // Se umidade crítica (<40%), irrigar imediatamente
        if (umidade < 40) {
            return {
                texto: 'Irrigar Agora - Solo muito seco, risco de dano às plantas',
                tipo: 'irrigar-agora',
                corFundo: 'bg-red-50',
                corBorda: 'border-red-300',
                icone: <Droplets className="h-5 w-5 text-red-500" />
            }
        }

        // Se umidade média (40-60%) e chuva baixa, monitorar
        if (umidade >= 40 && umidade < 60 && probabilidadeChuva < 40) {
            return {
                texto: 'Monitorando - Umidade dentro da faixa, continue observando',
                tipo: 'monitorando',
                corFundo: 'bg-green-50',
                corBorda: 'border-green-300',
                icone: <Brain className="h-5 w-5 text-green-500" />
            }
        }

        // Condições ideais
        return {
            texto: 'Monitorando - Condições ideais, sistema funcionando normalmente',
            tipo: 'monitorando',
            corFundo: 'bg-green-50',
            corBorda: 'border-green-300',
            icone: <Brain className="h-5 w-5 text-green-500" />
        }
    }

    const recomendacao = obterRecomendacao()

    return (
        <Card className={`border-2 ${recomendacao.corBorda} ${recomendacao.corFundo} transition-colors`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Recomendação Inteligente</CardTitle>
                {recomendacao.icone}
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">{recomendacao.texto}</p>
                    <div className="flex gap-4 text-xs text-slate-600">
                        <span>Umidade: {umidade.toFixed(1)}%</span>
                        <span>Chuva: {probabilidadeChuva}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}