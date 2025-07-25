#!/bin/bash
# SSL Certificate Generation Script
# /Users/jakespringer/Desktop/Replytics Website/scripts/generate-ssl.sh

set -euo pipefail

echo "🔐 Generating SSL certificates for Replytics..."

# Configuration
SSL_DIR="ssl"
CERT_FILE="$SSL_DIR/replytics.crt"
KEY_FILE="$SSL_DIR/replytics.key"
CSR_FILE="$SSL_DIR/replytics.csr"
CONFIG_FILE="$SSL_DIR/openssl.conf"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Create OpenSSL configuration file
cat > "$CONFIG_FILE" << EOF
[req]
default_bits = 4096
prompt = no
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=California
L=San Francisco
O=Replytics Inc
OU=Engineering
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = replytics.local
DNS.4 = *.replytics.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

echo "📝 Generating private key..."
openssl genrsa -out "$KEY_FILE" 4096

echo "📝 Generating certificate signing request..."
openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" -config "$CONFIG_FILE"

echo "📝 Generating self-signed certificate..."
openssl x509 -req -in "$CSR_FILE" -signkey "$KEY_FILE" -out "$CERT_FILE" -days 365 -extensions v3_req -extfile "$CONFIG_FILE"

echo "🔒 Setting secure permissions..."
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "🧹 Cleaning up temporary files..."
rm -f "$CSR_FILE" "$CONFIG_FILE"

echo "✅ SSL certificates generated successfully!"
echo "   Certificate: $CERT_FILE"
echo "   Private Key: $KEY_FILE"

echo ""
echo "📋 Certificate details:"
openssl x509 -in "$CERT_FILE" -text -noout | grep -E "(Subject:|DNS:|IP Address:)" | head -10

echo ""
echo "⚠️  Note: This is a self-signed certificate for development/testing."
echo "   For production, use certificates from a trusted CA like Let's Encrypt."