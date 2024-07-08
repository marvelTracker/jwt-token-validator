#!/bin/sh

# Generate certs
echo "Creating certs...."
# Generate a self-signed SSL certificate
mkdir -p /etc/ssl/certs /etc/ssl/private

# Generate server certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"

# Generate a strong Diffie-Hellman group
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Generate client certificate
openssl genpkey -algorithm RSA -out /etc/ssl/private/client.key
openssl req -new -key /etc/ssl/private/client.key -out /etc/ssl/private/client.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=client"
openssl x509 -req -in /etc/ssl/private/client.csr -CA /etc/ssl/certs/nginx-selfsigned.crt -CAkey /etc/ssl/private/nginx-selfsigned.key -CAcreateserial -out /etc/ssl/certs/client.crt -days 365 -sha256


# Start app1
node /api/app.js &

# Start app2
node /jwt-token-validator/index.js &

# Start Nginx
nginx -g 'daemon off;'
