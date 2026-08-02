export const PASSWORD_MIN_LENGTH = 12

export const PASSWORD_REQUIREMENTS =
  'Use at least 12 characters, including uppercase, lowercase, a number, and a symbol.'

export function getNewPasswordValidationError(
  password: string,
  passwordConfirmation: string,
) {
  if (password !== passwordConfirmation) {
    return 'Enter the same new password twice.'
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return PASSWORD_REQUIREMENTS
  }

  if (!/[a-z]/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  if (!/[A-Z]/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  if (!/\d/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  return null
}
