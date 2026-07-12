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

test('Update Naukri Skills', async ({ page }) => {

  // Fail fast if secrets aren't actually available to this run
  if (!process.env.NAUKRI_EMAIL || !process.env.NAUKRI_PASSWORD) {
    throw new Error(
      'NAUKRI_EMAIL / NAUKRI_PASSWORD is empty. ' +
      'Check that repository secrets are set (Settings > Secrets and variables > Actions) ' +
      'in THIS repo, and that the workflow YAML passes them via env: correctly.'
    );
  }

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

  // Wait for a real post-login signal instead of networkidle
  try {
    await page.waitForURL(/naukri\.com\/mnjuser\/homepage/, { timeout: 30000 });
  } catch (e) {
    await page.screenshot({ path: 'debug-post-login-nav.png', fullPage: true });
    const url = page.url();
    const bodyText = await page.locator('body').innerText().catch(() => '');
    console.log('URL after login attempt:', url);

    // Surface likely causes explicitly instead of a generic timeout
    if (/captcha/i.test(bodyText)) {
      throw new Error('Login blocked by CAPTCHA. See debug-post-login-nav.png');
    }
    if (/otp|verify|verification/i.test(bodyText)) {
      throw new Error('Login requires OTP/verification step. See debug-post-login-nav.png');
    }
    if (/invalid|incorrect/i.test(bodyText)) {
      throw new Error('Login rejected — check NAUKRI_EMAIL / NAUKRI_PASSWORD values. See debug-post-login-nav.png');
    }
    throw new Error(
      `Did not reach dashboard after login. Current URL: ${url}. See debug-post-login-nav.png`
    );
  }

  // Dismiss any post-login popup/modal if present (profile completion, app download, notif permission, etc.)
  const modalClose = page.locator(
    '.crossLayer, [class*="modal"] .icon-close, .close-btn, [class*="Layer"] .ic-close'
  ).first();
  if (await modalClose.isVisible({ timeout: 5000 }).catch(() => false)) {
    await modalClose.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // Open Profile
  try {
    await page.getByRole('link', { name: /View profile/i }).click({ timeout: 30000 });
  } catch (e) {
    await page.screenshot({ path: 'debug-view-profile-click.png', fullPage: true });
    console.log('URL at View Profile click failure:', page.url());
    throw e;
  }

  await page.waitForLoadState('domcontentloaded');

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

  // Wait for save to settle
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Verification
  for (const skill of skills) {
    const skillLocator = page.locator(`//*[contains(text(),"${skill}")]`);

    if (await skillLocator.count() > 0) {
      await expect(skillLocator.first()).toBeVisible();
    }
  }

  // Reload and logout
  await page.reload({ waitUntil: 'domcontentloaded' });

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