# Use the official Node.js Alpine image as the base
FROM node:alpine AS builder

# Install necessary packages for Nginx and Lua
RUN apk add --no-cache \
    build-base \
    pcre \
    pcre-dev \
    zlib \
    zlib-dev \
    openssl \
    openssl-dev \
    wget

# Download and build Nginx with the required modules
RUN wget https://nginx.org/download/nginx-1.27.0.tar.gz && \
    tar zxpf nginx-1.27.0.tar.gz && \
    cd nginx-1.27.0 && \
    ./configure --sbin-path=/usr/bin/nginx --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log \
    --with-pcre --pid-path=/var/run/nginx.pid \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_auth_request_module && \
    make && \
    make install

# Create directories for the apps and copy the application code
WORKDIR /api
COPY api /api
RUN npm ci

# Copy Nginx configuration file
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/ssl-config.conf /etc/nginx/snippets/ssl-config.conf

FROM jwt-token-validator:v1 as jwt-validator-builder

# Use a smaller base image for the final stage
FROM node:alpine

# Install runtime dependencies for Nginx
RUN apk add --no-cache pcre zlib openssl curl \
    && mkdir -p /etc/nginx/snippets/ \
    && mkdir -p /usr/local/nginx/ \
    && mkdir -p /etc/ssl/cert/

# Copy built Nginx and installed Node.js applications from the builder stage
COPY --from=builder /etc/nginx /etc/nginx
COPY --from=builder /usr/bin/nginx /usr/bin/nginx
COPY --from=builder /var/log/nginx /var/log/nginx
COPY --from=builder /var/log/nginx /var/log/nginx
COPY --from=builder /var/log/nginx /var/log/nginx
COPY --from=builder /etc/nginx/snippets /etc/nginx/snippets

COPY --from=builder /api /api
COPY --from=jwt-validator-builder /app /jwt-token-validator

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
COPY nginx/gen-certs.sh /gen-certs.sh
RUN chmod +x /entrypoint.sh
RUN chmod +x /gen-certs.sh

# Expose the ports
EXPOSE 80 443

# Run the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
