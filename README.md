# Day Trading System Frontend

A React + TypeScript + Vite application for the SENG 468 Day Trading System.

## Features

- User authentication (registration and login)
- Real-time trading dashboard
- Portfolio management
- Order placement and tracking
- Wallet management
- Dark/Light mode support

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend-monolith
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:4000/api/v1
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing

### End-to-End Testing with Cypress

The project includes comprehensive end-to-end tests using Cypress that cover the entire user journey, including:
- Company registration and stock management
- User registration and authentication
- Trading operations
- Portfolio management
- Order cancellation

#### Running Tests

1. Open Cypress Test Runner (interactive mode):
```bash
npm run test:e2e:open
```

2. Run tests headlessly (CI mode):
```bash
npm run test:e2e
```

#### Test Structure

- `cypress/e2e/company-flow.cy.ts`: Tests company registration and stock management
  - Company account registration
  - Stock creation (Google and Apple)
  - Limit sell order placement
  - Portfolio verification

- `cypress/e2e/user-flow.cy.ts`: Tests user trading operations
  - User registration and login
  - Wallet funding
  - Market and limit order placement
  - Order cancellation

#### Custom Commands

The test suite includes custom Cypress commands for common operations:
- `cy.login(username, password)`: Handles user authentication
- `cy.register(userData)`: Handles user registration
- `cy.addMoney(amount)`: Adds funds to wallet
- `cy.placeOrder(orderData)`: Places trading orders

### Available Test Scripts

- `npm run cypress:open`: Opens Cypress Test Runner
- `npm run cypress:run`: Runs Cypress tests headlessly
- `npm run test:e2e`: Starts dev server and runs tests
- `npm run test:e2e:open`: Starts dev server and opens Test Runner

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend-monolith/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   └── styles/        # Global styles
├── cypress/
│   ├── e2e/          # End-to-end tests
│   └── support/      # Test helpers and commands
└── public/           # Static assets
```

## Contributing

1. Ensure all tests pass before submitting changes
2. Add appropriate test coverage for new features
3. Follow the existing code style and conventions
4. Update documentation as needed

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Chakra UI Documentation](https://chakra-ui.com/)

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
