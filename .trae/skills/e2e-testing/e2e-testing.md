---
name: "e2e-testing"
description: "E2E testing with Playwright/Cypress. Use when writing end-to-end tests for critical user flows like login, checkout, or registration."
---

# Skill: E2E Testing (Cypress/Playwright)

## Purpose
To simulate real user scenarios from start to finish, ensuring that the integrated system (Frontend + Backend + Database) works as expected.

## When to Use
- Testing critical flows: Login, Checkout, Registration.
- Ensuring no regressions in core business logic.

## Procedure

### 1. Installation
Initialize Playwright in your project.
```bash
npm init playwright@latest
```

### 2. Writing a Test Case
```typescript
import { test, expect } from '@playwright/test';
test('user can login and see dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

### 3. Page Object Model (POM)
Organize code into reusable Page Objects for better maintainability.
```typescript
export class LoginPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/login'); }
  async login(email, pass) {
    await this.page.fill('#email', email);
    await this.page.fill('#pass', pass);
    await this.page.click('#submit');
  }
}
```

### 4. Running Tests
```bash
npx playwright test
npx playwright test --ui  # Debug mode
```

## Constraints
- **Test Independence**: Each test should be able to run in isolation.
- **Avoid Fragile Selectors**: Use `getByRole`, `getByLabel`, or `data-testid`.
- **Wait Strategically**: Use Playwright's auto-waiting features.

## Expected Output
A set of robust E2E tests that reliably verify critical user journeys.
