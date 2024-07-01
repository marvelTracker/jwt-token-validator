# Use the official Node.js image with Alpine Linux as the base
FROM node:alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the Node.js application files
COPY app/package.json ./
COPY app/app.js ./app.js

# Install Node.js dependencies
RUN npm install

# Expose the port that the Node.js application will run on
EXPOSE 4000

# Install necessary packages for Nginx and Lua
RUN apk add --no-cache \
    build-base \
    pcre \
    pcre-dev \
    zlib \
    zlib-dev \
    openssl-dev

RUN wget https://nginx.org/download/nginx-1.27.0.tar.gz && \
    tar zxpf nginx-1.27.0.tar.gz && \
    cd nginx-1.27.0 && \
    ./configure --sbin-path=/usr/bin/nginx --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log \
    --with-pcre --pid-path=/var/run/nginx.pid \
    --with-http_ssl_module \
    -with-http_auth_request_module


# Copy custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy your Node.js application into the container
COPY app/package.json .
COPY app/app.js .

# Start both NGINX and Node.js
CMD ["sh", "-c", "nginx && node app.js"]

# Expose ports for Nginx and Node.js
EXPOSE 80
EXPOSE 4000
