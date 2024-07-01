#!/bin/sh

# Start app1
node /api/app.js &

# Start app2
node /jwt-token-validator/index.js &

# Start Nginx
nginx -g 'daemon off;'
