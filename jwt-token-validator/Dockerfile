# Dockerfile for JWT Token Validation App (Docker Image B)
FROM node:alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json /app/

# Install dependencies
RUN npm install

# Copy TypeScript source code
COPY . /app

# Build TypeScript files
RUN npm run build

RUN cp -R /app/dist/* /app/

# Command to run the application
CMD ["node", "index.js"]
