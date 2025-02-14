import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    // Default command timeout
    defaultCommandTimeout: 10000,
    // Wait for API calls
    responseTimeout: 30000,
    // Retry failed tests
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
  // Environment variables
  env: {
    apiUrl: 'http://localhost:4000/api/v1',
  },
}) 