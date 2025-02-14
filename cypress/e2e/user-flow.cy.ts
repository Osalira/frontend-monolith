describe('User Registration and Trading', () => {
  beforeEach(() => {
    // Clear local storage and cookies before each test
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Visit the home page
    cy.visit('/')
  })

  it('should complete the user registration and trading flow', () => {
    // 7. Register user account
    cy.get('[data-cy=register-link]').click()
    cy.url().should('include', '/register')

    const userData = {
      user_name: 'FinanceGuru',
      password: 'Fguru@2024',
      name: 'The Finance Guru'
    }

    // Intercept the registration request
    cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      statusCode: 200,
      body: { success: true, data: null }
    }).as('registerUser')

    // Fill and submit registration form
    cy.get('[data-cy=username-input]').type(userData.user_name)
    cy.get('[data-cy=password-input]').type(userData.password)
    cy.get('[data-cy=name-input]').type(userData.name)
    cy.get('[data-cy=register-submit]').click()

    cy.wait('@registerUser')

    // 8. Login user
    cy.get('[data-cy=login-link]').click()
    cy.url().should('include', '/login')

    // Intercept login request
    cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/login`, {
      statusCode: 200,
      body: {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: { id: 'user1', username: userData.user_name }
        }
      }
    }).as('loginUser')

    cy.get('[data-cy=username-input]').type(userData.user_name)
    cy.get('[data-cy=password-input]').type(userData.password)
    cy.get('[data-cy=login-submit]').click()

    cy.wait('@loginUser')

    // 9. Add money to wallet
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/wallet/deposit`, {
      statusCode: 200,
      body: {
        success: true,
        data: { balance: 10000 }
      }
    }).as('addMoney')

    cy.get('[data-cy=wallet-link]').click()
    cy.get('[data-cy=deposit-amount]').type('10000')
    cy.get('[data-cy=deposit-submit]').click()

    cy.wait('@addMoney')

    // 10. Check wallet balance
    cy.intercept('GET', `${Cypress.env('apiUrl')}/trading/wallet`, {
      statusCode: 200,
      body: {
        success: true,
        data: { balance: 10000 }
      }
    }).as('getBalance')

    cy.get('[data-cy=refresh-balance]').click()
    cy.wait('@getBalance')
    cy.get('[data-cy=wallet-balance]').should('contain', '10,000.00')

    // 11. Place market buy order for Google
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders`, {
      statusCode: 200,
      body: { success: true, orderId: 'order3' }
    }).as('buyGoogleOrder')

    cy.get('[data-cy=trading-link]').click()
    cy.get('[data-cy=stock-select]').select('GOOGL')
    cy.get('[data-cy=order-type-select]').select('BUY')
    cy.get('[data-cy=order-method-select]').select('MARKET')
    cy.get('[data-cy=quantity-input]').type('50')
    cy.get('[data-cy=place-order-button]').click()

    cy.wait('@buyGoogleOrder')

    // 12. Place market buy order for Apple
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders`, {
      statusCode: 200,
      body: { success: true, orderId: 'order4' }
    }).as('buyAppleOrder')

    cy.get('[data-cy=stock-select]').select('AAPL')
    cy.get('[data-cy=quantity-input]').clear().type('30')
    cy.get('[data-cy=place-order-button]').click()

    cy.wait('@buyAppleOrder')

    // 13. Place sell limit order for Google
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders`, {
      statusCode: 200,
      body: { success: true, orderId: 'order5' }
    }).as('sellGoogleLimitOrder')

    cy.get('[data-cy=stock-select]').select('GOOGL')
    cy.get('[data-cy=order-type-select]').select('SELL')
    cy.get('[data-cy=order-method-select]').select('LIMIT')
    cy.get('[data-cy=quantity-input]').clear().type('25')
    cy.get('[data-cy=price-input]').type('160.00')
    cy.get('[data-cy=place-order-button]').click()

    cy.wait('@sellGoogleLimitOrder')

    // 14. Attempt another buy market order for Google (should fail)
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders`, {
      statusCode: 400,
      body: {
        success: false,
        error: 'Insufficient stock quantity available'
      }
    }).as('failedBuyOrder')

    cy.get('[data-cy=stock-select]').select('GOOGL')
    cy.get('[data-cy=order-type-select]').select('BUY')
    cy.get('[data-cy=order-method-select]').select('MARKET')
    cy.get('[data-cy=quantity-input]').clear().type('1000')
    cy.get('[data-cy=place-order-button]').click()

    cy.wait('@failedBuyOrder')
    cy.get('[data-cy=error-message]').should('be.visible')
      .and('contain', 'Insufficient stock quantity available')

    // 15. Cancel pending transactions
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders/cancel-partial`, {
      statusCode: 200,
      body: {
        success: true,
        data: { cancelledOrders: ['order3', 'order4'] }
      }
    }).as('cancelPartial')

    cy.get('[data-cy=orders-link]').click()
    cy.get('[data-cy=cancel-partial-orders]').click()
    cy.get('[data-cy=confirm-cancel]').click()

    cy.wait('@cancelPartial')
    cy.get('[data-cy=success-message]').should('be.visible')
      .and('contain', 'Successfully cancelled partial orders')
  })
}) 