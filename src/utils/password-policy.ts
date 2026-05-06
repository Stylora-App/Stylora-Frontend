export const PASSWORD_POLICY_MESSAGE =
  'Password must contain at least 8 characters, one uppercase letter, and one special character.';

export function hasMinPasswordLength(password: string): boolean {
  return password.length >= 8;
}

export function hasUppercaseLetter(password: string): boolean {
  return /[A-Z]/.test(password);
}

export function hasSpecialCharacter(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password);
}

export function isPasswordPolicyValid(password: string): boolean {
  return (
    hasMinPasswordLength(password) &&
    hasUppercaseLetter(password) &&
    hasSpecialCharacter(password)
  );
}
