#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 5 ]; then
  echo "Usage: $0 <resource-group> <server-name> <admin-user> <admin-password> <location>"
  exit 1
fi

RG="$1"
SERVER="$2"
ADMIN_USER="$3"
ADMIN_PASS="$4"
LOCATION="$5"

echo "Creating resource group $RG in $LOCATION..."
az group create -n "$RG" -l "$LOCATION"

echo "Creating SQL server $SERVER..."
az sql server create -g "$RG" -n "$SERVER" -l "$LOCATION" -u "$ADMIN_USER" -p "$ADMIN_PASS"

echo "Creating database WebSafari..."
az sql db create -g "$RG" -s "$SERVER" -n WebSafari --service-objective S0

MY_IP=$(curl -s https://ipinfo.io/ip)
echo "Adding firewall rule for current IP: $MY_IP"
az sql server firewall-rule create -g "$RG" -s "$SERVER" -n allow_my_ip --start-ip-address $MY_IP --end-ip-address $MY_IP

echo "Done. To get connection string (ADO.NET):"
echo "Server=tcp:${SERVER}.database.windows.net,1433;Initial Catalog=WebSafari;Persist Security Info=False;User ID=${ADMIN_USER};Password=${ADMIN_PASS};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
