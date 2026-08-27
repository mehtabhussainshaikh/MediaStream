import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { getApiError } from '../../services/api';
import { useLoginMutation, useRegisterMutation } from './authApi';
import { validateLogin, validateRegistration } from './validation';

export function AuthForm({ mode }) {
  const registerMode = mode === 'register';
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const navigate = useNavigate(); const location = useLocation();
  const requestState = registerMode ? registerState : loginState;
  const update = ({ target }) => setValues((current) => ({ ...current, [target.name]: target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = registerMode ? validateRegistration(values) : validateLogin(values);
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    try {
      if (registerMode) { await register({ name: values.name.trim(), email: values.email.trim(), password: values.password }).unwrap(); navigate('/login', { replace: true, state: { registered: true } }); }
      else { await login({ email: values.email.trim(), password: values.password }).unwrap(); navigate(location.state?.from?.pathname ? `${location.state.from.pathname}${location.state.from.search || ''}` : '/media', { replace: true }); }
    } catch { /* mutation state renders the safe error */ }
  };
  return <div className="auth-page"><section className="auth-copy"><p className="eyebrow">Private archive</p><h1>{registerMode ? 'Begin your collection.' : 'Welcome back.'}</h1><p>{registerMode ? 'Create a secure account for every image, recording, film, and document worth keeping.' : 'Return to a quieter place for the media that matters.'}</p></section><section className="form-card" aria-labelledby="auth-title"><p className="form-card__number">{registerMode ? '01' : '02'}</p><h2 id="auth-title">{registerMode ? 'Create account' : 'Sign in'}</h2>{location.state?.registered && <p className="status-message" role="status">Account created. Sign in to continue.</p>}<ErrorAlert message={requestState.error && getApiError(requestState.error, 'We could not complete that request.')} /><form noValidate onSubmit={submit}>{registerMode && <Field label="Full name" name="name" value={values.name} error={errors.name} onChange={update} autoComplete="name" />}<Field label="Email address" name="email" type="email" value={values.email} error={errors.email} onChange={update} autoComplete="email" /><Field label="Password" name="password" type="password" value={values.password} error={errors.password} onChange={update} autoComplete={registerMode ? 'new-password' : 'current-password'} hint={registerMode ? 'Use 8–128 characters.' : undefined} /><button className="button button--wide" disabled={requestState.isLoading}>{requestState.isLoading ? 'Please wait…' : registerMode ? 'Create account' : 'Sign in'}</button></form><p className="form-card__switch">{registerMode ? 'Already a member?' : 'New to MediaStream?'} <Link to={registerMode ? '/login' : '/register'}>{registerMode ? 'Sign in' : 'Create an account'}</Link></p></section></div>;
}

function Field({ label, name, type = 'text', value, error, onChange, autoComplete, hint }) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ') || undefined;
  return <div className="field"><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={describedBy} />{hint && <span id={`${name}-hint`} className="field__hint">{hint}</span>}{error && <span id={`${name}-error`} className="field__error">{error}</span>}</div>;
}
