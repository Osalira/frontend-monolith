describe('Company Registration and Stock Management', () => {
  beforeEach(() => {
    // Clear local storage and cookies before each test
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Visit the home page
    cy.visit('/')
  })

  it('should complete the company registration and stock management flow', () => {
    // 1. Register company account
    cy.get('[data-cy=register-link]').click()
    cy.url().should('include', '/register')

    const companyData = {
      user_name: 'VanguardETF',
      password: 'Vang@123',
      name: 'Vanguard Corp.'
    }

    // Intercept the registration request
    cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      statusCode: 200,
      body: { success: true, data: null }
    }).as('registerCompany')

    // Fill and submit registration form
    cy.get('[data-cy=username-input]').type(companyData.user_name)
    cy.get('[data-cy=password-input]').type(companyData.password)
    cy.get('[data-cy=name-input]').type(companyData.name)
    cy.get('[data-cy=register-submit]').click()

    // Wait for registration request and verify response
    cy.wait('@registerCompany').its('response.body').should('deep.equal', {
      success: true,
      data: null
    })

    // 2. Create and add Google stock
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/stocks`, {
      statusCode: 200,
      body: { success: true, data: { symbol: 'GOOGL' } }
    }).as('addGoogleStock')

    cy.get('[data-cy=add-stock-button]').click()
    cy.get('[data-cy=stock-symbol-input]').type('GOOGL')
    cy.get('[data-cy=stock-name-input]').type('Google')
    cy.get('[data-cy=stock-price-input]').type('150.00')
    cy.get('[data-cy=submit-stock]').click()

    cy.wait('@addGoogleStock')

    // 3. Create and add Apple stock
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/stocks`, {
      statusCode: 200,
      body: { success: true, data: { symbol: 'AAPL' } }
    }).as('addAppleStock')

    cy.get('[data-cy=add-stock-button]').click()
    cy.get('[data-cy=stock-symbol-input]').type('AAPL')
    cy.get('[data-cy=stock-name-input]').type('Apple')
    cy.get('[data-cy=stock-price-input]').type('180.00')
    cy.get('[data-cy=submit-stock]').click()

    cy.wait('@addAppleStock')

    // 4. Place limit sell order for Google
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders`, {
      statusCode: 200,
      body: { success: true, orderId: 'order1' }
    }).as('sellGoogleOrder')

    cy.get('[data-cy=trading-link]').click()
    cy.get('[data-cy=stock-select]').select('GOOGL')
    cy.get('[data-cy=order-type-select]').select('SELL')
    cy.get('[data-cy=order-method-select]').select('LIMIT')
    cy.get('[data-cy=quantity-input]').type('100')
    cy.get('[data-cy=price-input]').type('155.00')
    cy.get('[data-cy=place-order-button]').click()

    cy.wait('@sellGoogleOrder')

    // 5. Place limit sell order for Apple
    cy.intercept('POST', `${Cypress.env('apiUrl')}/trading/orders`, {
      statusCode: 200,
      body: { success: true, orderId: 'order2' }
    }).as('sellAppleOrder')

    cy.get('[data-cy=stock-select]').select('AAPL')
    cy.get('[data-cy=quantity-input]').clear().type('150')
    cy.get('[data-cy=price-input]').clear().type('185.00')
    cy.get('[data-cy=place-order-button]').click()

    cy.wait('@sellAppleOrder')

    // 6. Retrieve company's stock portfolio
    cy.intercept('GET', `${Cypress.env('apiUrl')}/trading/portfolio`, {
      statusCode: 200,
      body: {
        success: true,
        data: {
          stocks: [
            { symbol: 'GOOGL', quantity: 900, averagePrice: 150.00 },
            { symbol: 'AAPL', quantity: 850, averagePrice: 180.00 }
          ]
        }
      }
    }).as('getPortfolio')

    cy.get('[data-cy=portfolio-link]').click()
    cy.wait('@getPortfolio')

    // Verify portfolio is sorted correctly (lexicographically decreasing)
    cy.get('[data-cy=portfolio-table] tbody tr')
      .should('have.length', 2)
      .then($rows => {
        const symbols = $rows.map((_, el) => 
          Cypress.$(el).find('[data-cy=stock-symbol]').text()
        ).get()
        expect(symbols).to.deep.equal(['GOOGL', 'AAPL'])
      })
  })
}) 