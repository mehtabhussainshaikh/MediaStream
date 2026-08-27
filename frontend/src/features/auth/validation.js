export function validateLogin(values) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegistration(values) {
  const errors = validateLogin(values);
  if (values.name.trim().length < 2 || values.name.trim().length > 80) errors.name = 'Name must be between 2 and 80 characters.';
  if (values.password.length < 8 || values.password.length > 128) errors.password = 'Password must be between 8 and 128 characters.';
  return errors;
}
