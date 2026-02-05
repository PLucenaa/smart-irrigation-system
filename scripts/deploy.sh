#!/bin/bash

# ============================================================================
# Script de Deploy para Smart Irrigation System
# Otimizado para Debian 13 + Docker
# ============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Diretórios (ajustar conforme necessário)
BACKEND_DIR="${VPS_BACKEND_DIR:-/root/api-irrigacao}"
FRONTEND_DIR="${VPS_FRONTEND_DIR:-/var/www/dashboard}"
SERVICE_NAME="api-irrigacao"
DOCKER_CONTAINER_NAME="iot_db"

echo -e "${BLUE}🚀 Iniciando deploy no Debian 13...${NC}"

# ============================================================================
# 1. Verificar Docker e container PostgreSQL
# ============================================================================
echo -e "${GREEN}🐳 Verificando Docker...${NC}"

if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está instalado${NC}"
    exit 1
fi

# Verifica se o container PostgreSQL está rodando
if docker ps --format '{{.Names}}' | grep -qE "($DOCKER_CONTAINER_NAME|iot_db)"; then
    echo -e "${GREEN}✅ Container PostgreSQL está rodando${NC}"
    docker ps --filter "name=$DOCKER_CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || \
    docker ps --filter "name=iot_db" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${YELLOW}⚠️  Container PostgreSQL não está rodando${NC}"
    echo -e "${YELLOW}   Verifique no Gerenciador Docker ou execute: docker-compose up -d${NC}"
    # Não bloqueia o deploy, apenas avisa
fi

# ============================================================================
# 2. Backup do JAR anterior
# ============================================================================
if [ -f "$BACKEND_DIR/api-irrigacao.jar" ]; then
    echo -e "${YELLOW}📦 Criando backup do JAR anterior...${NC}"
    BACKUP_NAME="api-irrigacao.jar.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$BACKEND_DIR/api-irrigacao.jar" "$BACKEND_DIR/$BACKUP_NAME"
    echo -e "${GREEN}✅ Backup criado: $BACKUP_NAME${NC}"
fi

# ============================================================================
# 3. Verificar se o JAR foi copiado
# ============================================================================
if [ ! -f "$BACKEND_DIR/api-irrigacao.jar" ]; then
    echo -e "${RED}❌ JAR não encontrado em $BACKEND_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JAR encontrado em $BACKEND_DIR${NC}"

# ============================================================================
# 4. Verificar frontend
# ============================================================================
if [ -d "$FRONTEND_DIR" ] && [ "$(ls -A $FRONTEND_DIR 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Frontend atualizado em $FRONTEND_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend pode não ter sido atualizado${NC}"
fi

# ============================================================================
# 5. Reiniciar serviço Spring Boot (systemd) - Debian
# ============================================================================
if systemctl list-unit-files 2>/dev/null | grep -q "$SERVICE_NAME.service"; then
    echo -e "${GREEN}🔄 Gerenciando serviço systemd...${NC}"

    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        echo -e "${YELLOW}⏸️  Parando serviço...${NC}"
        sudo systemctl stop "$SERVICE_NAME"
        sleep 2
    fi

    echo -e "${GREEN}▶️  Iniciando serviço...${NC}"
    sudo systemctl start "$SERVICE_NAME"
    sleep 3

    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo -e "${GREEN}✅ Serviço $SERVICE_NAME está rodando${NC}"
        echo -e "${BLUE}📋 Status:${NC}"
        sudo systemctl status "$SERVICE_NAME" --no-pager -l | head -n 10
    else
        echo -e "${RED}❌ Erro ao iniciar serviço $SERVICE_NAME${NC}"
        echo -e "${RED}📋 Últimas linhas do log:${NC}"
        sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager || true
        exit 1
    fi
else
    echo -e "${YELLOW}ℹ️  Serviço systemd não encontrado${NC}"
    echo -e "${YELLOW}   Se você roda manualmente, execute:${NC}"
    echo -e "${YELLOW}   java -jar $BACKEND_DIR/api-irrigacao.jar${NC}"
fi

# ============================================================================
# 6. Recarregar Nginx (Debian)
# ============================================================================
echo -e "${GREEN}🌐 Recarregando Nginx...${NC}"

if command -v nginx >/dev/null 2>&1; then
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✅ Nginx recarregado${NC}"
    else
        echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
        sudo nginx -t
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Nginx não encontrado${NC}"
fi

# ============================================================================
# 7. Verificação final de saúde
# ============================================================================
echo -e "${GREEN}🔍 Verificando saúde da aplicação...${NC}"
sleep 3

# Verifica se a API está respondendo
if curl -f -s -m 5 http://localhost:8080/api/leituras > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API está respondendo corretamente${NC}"
else
    echo -e "${YELLOW}⚠️  API pode não estar respondendo ainda${NC}"
    echo -e "${YELLOW}   Aguarde alguns segundos e verifique:${NC}"
    echo -e "${YELLOW}   curl http://localhost:8080/api/leituras${NC}"
fi

# ============================================================================
# 8. Resumo final
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Status dos serviços:${NC}"

# Spring Boot
if systemctl list-unit-files 2>/dev/null | grep -q "$SERVICE_NAME.service"; then
    STATUS_SB=$(systemctl is-active "$SERVICE_NAME" 2>/dev/null || echo "inativo")
    echo -e "   Spring Boot: ${GREEN}$STATUS_SB${NC}"
else
    echo -e "   Spring Boot: ${YELLOW}não configurado como systemd${NC}"
fi

# Nginx
if command -v nginx >/dev/null 2>&1; then
    STATUS_NGINX=$(systemctl is-active nginx 2>/dev/null || echo "inativo")
    echo -e "   Nginx: ${GREEN}$STATUS_NGINX${NC}"
else
    echo -e "   Nginx: ${YELLOW}não encontrado${NC}"
fi

# PostgreSQL Docker
if docker ps --format '{{.Names}}' | grep -qE "($DOCKER_CONTAINER_NAME|iot_db)"; then
    echo -e "   PostgreSQL: ${GREEN}rodando em Docker${NC}"
    docker ps --filter "name=$DOCKER_CONTAINER_NAME" --format "      Container: {{.Names}} | Status: {{.Status}}" 2>/dev/null || \
    docker ps --filter "name=iot_db" --format "      Container: {{.Names}} | Status: {{.Status}}" 2>/dev/null
else
    echo -e "   PostgreSQL: ${YELLOW}container não está rodando${NC}"
fi

echo ""