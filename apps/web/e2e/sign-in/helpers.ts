import { fixtures } from "@avel/contract-mock";
import { expect, type Page } from "@playwright/test";
import { expectNoViolationsSettled } from "../control-room/support";

export const OPERATOR = fixtures.operator;
export const SESSION_COOKIE = "better-auth.session_token";

/** login.md section 3's copy. */
export const COPY = {
  empty: "Enter your email and password.",
  mismatch: "That email and password don't match.",
  generic: "Couldn't sign in. Check your connection and try again.",
  later: "Too many attempts. Try again later.",
} as const;

export const email = (page: Page) => page.getByLabel("Email");
export const password = (page: Page) => page.getByLabel("Password", { exact: true });
export const submit = (page: Page) => page.getByRole("button", { name: /^Sign(ing)? in/ });

export async function fillAndSubmit(page: Page, pass: string) {
  await email(page).fill(OPERATOR.email);
  await password(page).fill(pass);
  await submit(page).click();
}

/** /login has drawn: its h1 is Sign in and no control room is on the page. */
export async function onLogin(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
}

/** E17 on /login, with motion settled. */
export const accessible = expectNoViolationsSettled;
