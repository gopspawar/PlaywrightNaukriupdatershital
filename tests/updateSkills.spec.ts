import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const skills = [
  'Java',    
  'Spring',
  'Spring Boot',
  'Spring MVC',
  'Microservices',
];

//test('Update Naukri Skills', async ({ page }) => {
test('Update Naukri Skills', async ({ page }) => {
  test.setTimeout(90_000);
  // Open Naukri
  await page.goto('https://www.naukri.com/', {
    waitUntil: 'domcontentloaded'
  });

  // Login
  await page.getByRole('link', {
    name: 'Login',
    exact: true
  }).click();

  await page.getByRole('textbox', {
    name: /Email ID/i
  }).fill(process.env.NAUKRI_EMAIL!);

  await page.getByRole('textbox', {
    name: /password/i
  }).fill(process.env.NAUKRI_PASSWORD!);

  await page.getByRole('button', {
    name: 'Login',
    exact: true
  }).click();

  // Wait until dashboard loads
  await page.waitForLoadState('networkidle');

  // Open Profile
  await page.getByRole('link', {
    name: /View profile/i
  }).click();

  await page.waitForLoadState('networkidle');

  // Scroll to Key Skills
  const skillSection = page.locator('#lazyKeySkills');
  await skillSection.waitFor({ state: 'visible', timeout: 30000 });
  await skillSection.scrollIntoViewIfNeeded();

  // Click Edit
  await skillSection.locator('.edit.icon').click();
  await page.waitForSelector('input[placeholder="Add skills"]', { state: 'visible', timeout: 30000 });

  // Skill input
  const skillInput = page.getByPlaceholder('Add skills').first();
  await expect(skillInput).toBeVisible({ timeout: 30000 });
  await expect(skillInput).toBeEnabled();
  await skillInput.scrollIntoViewIfNeeded();
  await skillInput.click({ timeout: 30000 });
  await skillInput.focus();
  await page.waitForTimeout(500);

  // Add only missing skills
  for (const skill of skills) {
    const existingSkill = page.locator(`//*[contains(text(),"${skill}")]`);

    if (await existingSkill.count() > 0) {
      console.log(`${skill} already exists`);
      continue;
    }

    console.log(`Adding ${skill}`);

    await skillInput.fill(skill, { timeout: 30000 });
    await page.waitForTimeout(1000);

    const suggestion = page.locator('div[role="option"], li[role="option"], .sug-option, .suggestion-item').filter({ hasText: skill }).first();
    if (await suggestion.count() > 0) {
      await suggestion.click({ timeout: 30000 });
    } else {
      await skillInput.press('ArrowDown');
      await skillInput.press('Enter');
    }

    await page.waitForTimeout(1000);
    await page.locator(`text=${skill}`).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  // Save
  const saveButton = page.getByRole('button', {
    name: 'Save'
  });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // Wait for save
  await page.waitForLoadState('networkidle');

  // Verification
  for (const skill of skills) {
    const skillLocator = page.locator(`//*[contains(text(),"${skill}")]`);

    if (await skillLocator.count() > 0) {
      await expect(skillLocator.first()).toBeVisible();
    }
  }

  //await page.locator('.crossLayer').nth(7).click();
await page.reload({
  waitUntil: 'networkidle'
});
  await page.locator('.nI-gNb-drawer__icon-img-wrapper img').click();
  await page.getByText('Logout').click();

  // If the logout page does not directly show the login button, verify by returning to the homepage.
  const loginLink = page.getByRole('link', { name: /Login/i }).first();
  if (!(await loginLink.isVisible().catch(() => false))) {
    try {
      await page.goto('https://www.naukri.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } catch {
      // homepage navigation may be blocked; keep current page and proceed to the visible check
    }
  }

  await expect(loginLink).toBeVisible({ timeout: 30000 });
  console.log('Skills updated successfully and logged out.');
});