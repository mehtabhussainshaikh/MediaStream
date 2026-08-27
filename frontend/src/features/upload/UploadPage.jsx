import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { MediaRenderer } from '../../components/media/MediaRenderer';
import { getApiError } from '../../services/api';
import { useUploadMediaMutation } from '../media/mediaApi';
import { UploadDropzone } from './UploadDropzone';
import { SUPPORTED_TYPES, validateUpload } from './validation';

export function UploadPage() {
  const [form, setForm] = useState({ file: null, title: '', description: '', tags: '' }); const [errors, setErrors] = useState({}); const [preview, setPreview] = useState('');
  const [upload, uploadState] = useUploadMediaMutation(); const navigate = useNavigate();
  useEffect(() => { if (!form.file) { setPreview(''); return undefined; } const url = URL.createObjectURL(form.file); setPreview(url); return () => URL.revokeObjectURL(url); }, [form.file]);
  const chooseFile = (file) => setForm((current) => ({ ...current, file, title: current.title || file.name.replace(/\.[^.]+$/, '') }));
  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const submit = async (event) => { event.preventDefault(); const nextErrors = validateUpload(form); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; const body = new FormData(); body.append('file', form.file); body.append('title', form.title.trim()); body.append('description', form.description.trim()); body.append('tags', form.tags); try { const result = await upload(body).unwrap(); navigate(`/media/${result.data.media._id}`, { state: { uploaded: true } }); } catch { /* safe error below */ } };
  return <section className="page upload-page"><header className="page-header"><div><p className="eyebrow">Add to the archive</p><h1>Upload media</h1></div><p>Bring one image, film, recording, or document into your private collection.</p></header><form className="upload-layout" noValidate onSubmit={submit}><div><UploadDropzone file={form.file} onFile={chooseFile} error={errors.file} />{form.file && <div className="file-summary"><span>{form.file.name}</span><span>{(form.file.size / 1024 / 1024).toFixed(2)} MB</span></div>}<div className="local-preview">{preview ? <MediaRenderer mediaType={SUPPORTED_TYPES[form.file.type]} src={preview} title={form.title || form.file.name} /> : <p>Selected media will appear here before upload.</p>}</div></div><div className="form-card upload-form"><h2>Describe this piece</h2><UploadField label="Title" name="title" value={form.title} error={errors.title} onChange={update} maxLength="120" /><UploadField label="Description" name="description" value={form.description} error={errors.description} onChange={update} textarea maxLength="2000" optional /><UploadField label="Tags" name="tags" value={form.tags} error={errors.tags} onChange={update} hint="Comma-separated; up to 10 tags." optional /><ErrorAlert message={uploadState.error && getApiError(uploadState.error, 'Upload failed. Your form has been preserved.')} /><button className="button button--wide" disabled={uploadState.isLoading}>{uploadState.isLoading ? 'Uploading…' : 'Upload to library'}</button></div></form></section>;
}

function UploadField({ label, name, value, error, onChange, hint, textarea, optional, ...props }) { const Input = textarea ? 'textarea' : 'input'; return <div className="field"><label htmlFor={name}>{label} {optional && <span>(optional)</span>}</label><Input id={name} name={name} value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined} {...props} />{hint && <span className="field__hint" id={`${name}-hint`}>{hint}</span>}{error && <span className="field__error" id={`${name}-error`}>{error}</span>}</div>; }
