#!/bin/bash
set -e

# Define the directory where the application is deployed
APP_DIR=/usr/share/nginx/html

# Function to replace environment variables
replace_env_variables() {
  # Find all JS files in the build directory
  echo "Injecting environment variables..."
  
  # Replace the placeholder with actual value in the main script
  if [ -n "$VITE_API_URL" ]; then
    echo "Setting API URL: $VITE_API_URL"
    find $APP_DIR -type f -name "*.js" -exec sed -i "s|VITE_API_URL_PLACEHOLDER|$VITE_API_URL|g" {} \;
  fi
  
  if [ -n "$VITE_WS_URL" ]; then
    echo "Setting WebSocket URL: $VITE_WS_URL"
    find $APP_DIR -type f -name "*.js" -exec sed -i "s|VITE_WS_URL_PLACEHOLDER|$VITE_WS_URL|g" {} \;
  fi
  
  echo "Environment variable injection complete."
}

# Call the function to replace environment variables
replace_env_variables

# Start Nginx
echo "Starting Nginx..."
exec nginx -g "daemon off;" 