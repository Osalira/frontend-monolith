/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user
       * @example cy.login('username', 'password')
       */
      login(username: string, password: string): Chainable<void>

      /**
       * Custom command to register a new user
       * @example cy.register({ username: 'test', password: 'pass', name: 'Test User' })
       */
      register(userData: { user_name: string; password: string; name: string }): Chainable<void>

      /**
       * Custom command to add money to wallet
       * @example cy.addMoney(1000)
       */
      addMoney(amount: number): Chainable<void>

      /**
       * Custom command to place an order
       * @example cy.placeOrder({ symbol: 'AAPL', type: 'BUY', method: 'MARKET', quantity: 10 })
       */
      placeOrder(orderData: {
        symbol: string
        type: 'BUY' | 'SELL'
        method: 'MARKET' | 'LIMIT'
        quantity: number
        price?: number
      }): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/login`).as('loginRequest')
  
  cy.visit('/login')
  cy.get('[data-cy=username-input]').type(username)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=login-submit]').click()
  
  cy.wait('@loginRequest')
})

// Register command
Cypress.Commands.add('register', (userData) => {
  cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/register`).as('registerRequest')
  
  cy.visit('/register')
  cy.get('[data-cy=username-input]').type(userData.user_name)
  cy.get('[data-cy=password-input]').type(userData.password)
  cy.get('[data-cy=name-input]').type(userData.name)
  cy.get('[data-cy=register-submit]').click()
  
  cy.wait('@registerRequest')
})

// Add money command
Cypress.Commands.add('addMoney', (amount: number) => {
  cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/wallet/deposit`).as('depositRequest')
  
  cy.get('[data-cy=wallet-link]').click()
  cy.get('[data-cy=deposit-amount]').type(amount.toString())
  cy.get('[data-cy=deposit-submit]').click()
  
  cy.wait('@depositRequest')
})

// Place order command
Cypress.Commands.add('placeOrder', (orderData) => {
  cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders`).as('orderRequest')
  
  cy.get('[data-cy=trading-link]').click()
  cy.get('[data-cy=stock-select]').select(orderData.symbol)
  cy.get('[data-cy=order-type-select]').select(orderData.type)
  cy.get('[data-cy=order-method-select]').select(orderData.method)
  cy.get('[data-cy=quantity-input]').clear().type(orderData.quantity.toString())
  
  if (orderData.method === 'LIMIT' && orderData.price) {
    cy.get('[data-cy=price-input]').clear().type(orderData.price.toString())
  }
  
  cy.get('[data-cy=place-order-button]').click()
  cy.wait('@orderRequest')
}) 