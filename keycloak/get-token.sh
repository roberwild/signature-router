#!/bin/bash
# Script para obtener tokens JWT de Keycloak para diferentes usuarios

KEYCLOAK_URL="http://localhost:8180"
REALM="signature-router"
CLIENT_ID="signature-router-api"
CLIENT_SECRET="signature-router-secret-key-12345"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Keycloak Token Generator${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Función para obtener token
get_token() {
    local USERNAME=$1
    local PASSWORD=$2
    local ROLE=$3
    
    echo -e "${YELLOW}Obteniendo token para: ${USERNAME} (${ROLE})${NC}"
    
    RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "client_id=${CLIENT_ID}" \
      -d "client_secret=${CLIENT_SECRET}" \
      -d "grant_type=password" \
      -d "username=${USERNAME}" \
      -d "password=${PASSWORD}")
    
    ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
    
    if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
        echo -e "${GREEN}✅ Token obtenido exitosamente${NC}\n"
        echo -e "${BLUE}Access Token (${USERNAME}):${NC}"
        echo "$ACCESS_TOKEN"
        echo ""
        echo -e "${BLUE}Token decodificado:${NC}"
        echo "$ACCESS_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq '.' 2>/dev/null || echo "Error al decodificar"
        echo ""
        echo -e "${BLUE}Expires in:${NC} $(echo $RESPONSE | jq -r '.expires_in') seconds"
        echo -e "${BLUE}Refresh token:${NC} $(echo $RESPONSE | jq -r '.refresh_token' | cut -c1-50)..."
        echo ""
    else
        echo -e "${RED}❌ Error al obtener token${NC}"
        echo "$RESPONSE" | jq '.'
    fi
    
    echo -e "${BLUE}========================================${NC}\n"
}

# Verificar si jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq no está instalado. Instálalo con: sudo apt install jq${NC}"
    exit 1
fi

# Menu de usuarios
echo "Selecciona el usuario:"
echo "1) admin (ADMIN + USER)"
echo "2) user (USER)"
echo "3) support (SUPPORT + USER)"
echo "4) auditor (AUDITOR)"
echo "5) Todos"
echo ""
read -p "Opción: " OPTION

case $OPTION in
    1)
        get_token "admin" "admin123" "ADMIN"
        ;;
    2)
        get_token "user" "user123" "USER"
        ;;
    3)
        get_token "support" "support123" "SUPPORT"
        ;;
    4)
        get_token "auditor" "auditor123" "AUDITOR"
        ;;
    5)
        get_token "admin" "admin123" "ADMIN"
        get_token "user" "user123" "USER"
        get_token "support" "support123" "SUPPORT"
        get_token "auditor" "auditor123" "AUDITOR"
        ;;
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac

