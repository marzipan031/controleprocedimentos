export type PasswordRule = {
  id: string;
  label: string;
  test: (pw: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Mínimo de 8 caracteres", test: (pw) => pw.length >= 8 },
  { id: "upper", label: "Uma letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "Uma letra minúscula", test: (pw) => /[a-z]/.test(pw) },
  { id: "number", label: "Um número", test: (pw) => /[0-9]/.test(pw) },
  { id: "special", label: "Um caractere especial", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function isPasswordValid(pw: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}
