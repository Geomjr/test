import { expect, test } from "@playwright/test";

/**
 * Walks every main screen as the seeded demo user and captures screenshots
 * per project (iphone/desktop × light/dark) into e2e/screenshots/.
 */
test("screenshot tour", async ({ page }, testInfo) => {
  const dir = `e2e/screenshots/${testInfo.project.name}`;
  const shot = async (name: string) => {
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false });
  };

  await page.goto("/sign-in");
  await shot("01-sign-in");

  await page.getByPlaceholder("you@school.edu").fill("demo@orbit.app");
  await page.getByPlaceholder("Your password").fill("orbit-demo");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/");
  await expect(page.getByRole("heading", { name: "Reach out" })).toBeVisible();
  await shot("02-today");

  await page.goto("/contacts");
  await expect(page.getByText("Priya Raman")).toBeVisible();
  await shot("03-people");

  await page.getByRole("link", { name: /Priya Raman/ }).click();
  await page.waitForURL(/\/contacts\//);
  await expect(page.getByRole("heading", { name: "Priya Raman" })).toBeVisible();
  await shot("04-profile");

  await page.goto("/pipeline");
  await expect(page.getByText("To Reach Out")).toBeVisible();
  await shot("05-pipeline");

  await page.goto("/analytics");
  await expect(page.getByText("people in your orbit")).toBeVisible();
  await shot("06-analytics");

  await page.goto("/tasks");
  await shot("07-tasks");

  await page.goto("/review");
  await expect(page.getByText("Overdue follow-ups", { exact: false }).first()).toBeVisible();
  await shot("08-review");

  await page.goto("/search");
  await page.getByPlaceholder("People, notes, transcripts…").fill("consulting");
  await page.waitForTimeout(500);
  await shot("09-search");

  await page.goto("/assistant");
  await shot("10-assistant");

  await page.goto("/import");
  await shot("11-import");

  await page.goto("/settings");
  await expect(page.getByText("demo@orbit.app")).toBeVisible();
  await shot("12-settings");
});
