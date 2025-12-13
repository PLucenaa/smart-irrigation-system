# EcoFlow Irrigation Dashboard

Dashboard moderno e responsivo para visualização em tempo real dos dados de irrigação via LoRa.

## Stack Tecnológica

- **React 18** com Vite
- **TypeScript** (Strict mode)
- **TailwindCSS** para estilização
- **Recharts** para gráficos interativos
- **Lucide-React** para ícones
- **Axios** para consumo de API
- **date-fns** para formatação de datas

## Estrutura do Projeto

```
frontend-dashboard-ui/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Sidebar.tsx      # Barra lateral de navegação
│   │   ├── StatusCard.tsx   # Card para KPIs
│   │   ├── SoilMoistureChart.tsx  # Gráfico de umidade
│   │   └── AlertsLog.tsx    # Log de alertas
│   ├── hooks/               # Custom hooks
│   │   └── useTelemetry.ts  # Hook com polling automático
│   ├── pages/               # Páginas da aplicação
│   │   └── Dashboard.tsx    # Página principal
│   ├── services/            # Serviços de API
│   │   └── api.ts           # Configuração Axios e serviços
│   ├── types/               # Definições TypeScript
│   │   └── telemetry.ts     # Interfaces de dados
│   ├── App.tsx              # Componente raiz
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais (Tailwind)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Instalação

1. Instale as dependências:

```bash
npm install
```

ou

```bash
yarn install
```

## Executando o Projeto

```bash
npm run dev
```

ou

```bash
yarn dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Configuração

### Proxy da API

O Vite está configurado para fazer proxy das requisições `/api` para `http://localhost:8080` (backend Spring Boot). Isso pode ser ajustado no arquivo `vite.config.ts`.

### Backend

Certifique-se de que o backend Spring Boot está rodando na porta 8080 e que o endpoint `GET /api/telemetry` está disponível.

## Funcionalidades

### Dashboard

- **Cards de Status (KPIs):**
  - Última Umidade Lida (%)
  - Nível de Bateria do Sensor (Volts)
  - Status do Sistema (Monitorando/Irrigando/Atenção)

- **Gráfico de Histórico:**
  - Gráfico de linha mostrando a evolução da umidade do solo nas últimas 24 horas
  - Suporta múltiplos dispositivos simultaneamente

- **Log de Alertas:**
  - Lista dos últimos alertas de solo seco (umidade < 30%)
  - Alertas de bateria baixa (< 3.2V)
  - Atualização automática a cada 5 segundos

### Polling Automático

O hook `useTelemetry` faz polling automático a cada 5 segundos para manter os dados atualizados em tempo real.

## Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`.

## Preview da Build

```bash
npm run preview
```

## Design

O dashboard utiliza uma paleta de cores verde e azul, remetendo ao tema agro/água:

- **Verde (Primary):** Tons de verde para elementos principais e status positivo
- **Azul (Water):** Tons de azul para elementos relacionados à água
- **Design Responsivo:** Adapta-se a diferentes tamanhos de tela

## Próximos Passos

- [ ] Adicionar autenticação
- [ ] Página de detalhes por dispositivo
- [ ] Histórico completo de dados
- [ ] Configurações do sistema
- [ ] Exportação de dados

