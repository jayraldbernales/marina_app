// Shared validation helpers for auth forms

export const passwordRules = [
  { test: /.{8,}/, msg: "Password must be at least 8 characters long." },
  {
    test: /[A-Z]/,
    msg: "Password must contain at least one uppercase letter.",
  },
  {
    test: /[a-z]/,
    msg: "Password must contain at least one lowercase letter.",
  },
  { test: /[0-9]/, msg: "Password must contain at least one number." },
  {
    test: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    msg: "Password must contain at least one symbol.",
  },
];

export function validatePassword(password: string) {
  return passwordRules.filter((r) => !r.test.test(password)).map((r) => r.msg);
}
