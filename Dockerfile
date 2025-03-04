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

# Remove the entrypoint script - we'll use inline commands instead
# COPY docker-entrypoint.sh /
# RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use inline commands to replace the entrypoint script functionality
CMD bash -c '\
    APP_DIR=/usr/share/nginx/html && \
    echo "Injecting environment variables..." && \
    if [ -n "$VITE_API_URL" ]; then \
        echo "Setting API URL: $VITE_API_URL" && \
        find $APP_DIR -type f -name "*.js" -exec sed -i "s|VITE_API_URL_PLACEHOLDER|$VITE_API_URL|g" {} \; ; \
    fi && \
    if [ -n "$VITE_WS_URL" ]; then \
        echo "Setting WebSocket URL: $VITE_WS_URL" && \
        find $APP_DIR -type f -name "*.js" -exec sed -i "s|VITE_WS_URL_PLACEHOLDER|$VITE_WS_URL|g" {} \; ; \
    fi && \
    echo "Environment variable injection complete." && \
    echo "Starting Nginx..." && \
    nginx -g "daemon off;"' 