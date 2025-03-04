# Stage 1: Build the React application with Vite
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Set environment variables for build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Add bash for easier debugging
RUN apk add --no-cache bash

# Copy the build output from Vite dist folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy a startup script to handle environment variables at runtime
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use the entrypoint script to start Nginx
ENTRYPOINT ["/docker-entrypoint.sh"] 