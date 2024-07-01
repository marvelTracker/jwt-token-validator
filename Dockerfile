# Use the official Node.js Alpine image as the base
FROM node:alpine AS builder

# Install necessary packages for Nginx and Lua
RUN apk add --no-cache \
    build-base \
    pcre \
    pcre-dev \
    zlib \
    zlib-dev \
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
    --with-http_auth_request_module && \
    make && \
    make install

# Create directories for the apps and copy the application code
WORKDIR /api
COPY api /api
RUN npm ci

# WORKDIR /jwt-token-validator
# COPY jwt-token-validator /jwt-token-validator
# RUN npm ci


COPY nginx/nginx.conf /etc/nginx/nginx.conf


FROM jwt-token-validator:latest as jwt-validator-builder


# Use a smaller base image for the final stage
FROM node:alpine

# Copy built Nginx and installed Node.js applications from the builder stage
COPY --from=builder /etc/nginx /etc/nginx
COPY --from=builder /usr/bin/nginx /usr/bin/nginx
COPY --from=builder /var/log/nginx /var/log/nginx
COPY --from=builder /usr/local/nginx /usr/local/nginx

#COPY --from=builder /etc/nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /api /api
COPY --from=jwt-validator-builder /app /jwt-token-validator

# Install runtime dependencies for Nginx
RUN apk add --no-cache pcre zlib openssl

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create a non-root user and switch to it
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

# Expose the ports
EXPOSE 80

# Run the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]