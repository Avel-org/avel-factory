import { expect, test } from "@playwright/test";
import { attachShot } from "../support/page";
import { accessible, COPY, fillAndSubmit, OPERATOR, onLogin, password } from "./helpers";

// T-F12-06 · Step 1 test 7: the 11th failed sign-in within 15 minutes is refused, even with the
// right password. It locks the one operator on its mock, so it runs on its own dev server (the
// config's "lockout" project), never the one every other spec signs in on.
test("the 11th failed sign-in is refused with Too many attempts, even with the right password", async ({
  page,
  request,
}, info) => {
  // Ten wrong passwords, straight at the mock's wire: the 10th failure starts the lockout.
  for (let i = 0; i < 10; i++) {
    const res = await request.post("/api/auth/sign-in/email", {
      data: { email: OPERATOR.email, password: `wrong-${i}` },
    });
    expect(res.status()).toBe(401);
  }
  await page.goto("/login");
  await onLogin(page);
  await fillAndSubmit(page, OPERATOR.password);
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Too many attempts");
  await expect(alert).not.toHaveText(COPY.mismatch);
  await expect(page).toHaveURL(/\/login/);
  await expect(password(page)).toHaveValue(OPERATOR.password);
  await accessible(page);
  await attachShot(page, info, "lockout-11th");
});
