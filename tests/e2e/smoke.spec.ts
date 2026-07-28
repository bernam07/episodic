import { expect, test } from "@playwright/test";

test("redirects an unauthenticated visitor to the auth screen", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/auth$/);
});

test("renders the sign-in form", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: /Track every episode/ })).toBeVisible();
  await expect(page.getByPlaceholder("Username or email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In", exact: true })).toBeVisible();
});

test("sign up requires a username", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  const username = page.getByPlaceholder("Username", { exact: true });
  await expect(username).toBeVisible();
  await expect(username).toHaveAttribute("required", "");
});

test("offers a forgot-password entry point", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText("Forgot your password?")).toBeVisible();
});

test("declares a PWA manifest", async ({ page }) => {
  await page.goto("/auth");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
});

test("an unknown route falls back into the app", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page).toHaveURL(/\/auth$/);
});

test("has no horizontal overflow", async ({ page }) => {
  await page.goto("/auth");
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test("logs no console errors on the auth screen", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/auth");
  await page.waitForTimeout(1000);

  const meaningful = errors.filter(
    (text) => !text.includes("favicon") && !text.includes("manifest") && !text.toLowerCase().includes("404")
  );
  expect(meaningful).toEqual([]);
});
