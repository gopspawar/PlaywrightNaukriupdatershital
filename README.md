# playwright-naukri

Lightweight Playwright + TypeScript script that logs into your own Naukri account and adds any missing key skills from a reusable list — without duplicating or removing skills already on your profile.

## Features
- Playwright Automation
- Auto Login
- Resume Update

## Project Structure

```
playwright-naukri/
├── tests/
│   └── updateSkills.spec.ts
├── .env
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## Setup

```bash
npm install
npx playwright install chromium
cp .env
```

Edit `.env` with your own credentials:
```
NAUKRI_EMAIL=your_email@gmail.com
NAUKRI_PASSWORD=your_password
```

**Never commit `.env`** — it's already in `.gitignore`.

Edit the `skills` array at the top of `tests/updateSkills.spec.ts` to whatever skills you want ensured on your profile.

## Run

```bash
# Run all tests
npx playwright test

# Run only this test
npx playwright test tests/updateSkills.spec.ts

# Run headed (visible browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run with UI
npx playwright test --ui

# Generate + open HTML report
npx playwright test --reporter=html
npx playwright show-report

# Record a new script by interacting with the site
npx playwright codegen https://www.naukri.com
```

Or via the npm scripts already wired up in `package.json`:

```bash
npm run test:update-skills
npm run test:headed
npm run test:debug
npm run test:ui
npm run report
npm run codegen
```

## How the skill update works

1. Logs in with credentials from `.env`.
2. Opens your profile and the Key Skills edit panel.
3. For each skill in the `skills` list: if it's already on the profile, it's left alone; if it's missing, it's added via the autosuggest input.
4. Saves and verifies every skill in the list is now present on the profile.

## Notes

- `headless: false` in `playwright.config.ts` runs the browser visibly by default; screenshots, video, and trace are captured automatically on failure.
- Naukri's DOM can change over time — if a selector (e.g. `#lazyKeySkills`, the `Login`/`View profile` link names, or `Add skills` textbox) stops matching, open `npx playwright codegen https://www.naukri.com` to find the current one and update it in `tests/updateSkills.spec.ts`.
"# PlaywrightNaukriupdater" 
