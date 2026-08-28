import { useRef } from 'react';

export function UploadDropzone({ file, onFile, error }) {
  const inputRef = useRef(null);
  const select = (files) => files?.[0] && onFile(files[0]);
  return <div className={`dropzone${error ? ' dropzone--error' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); select(event.dataTransfer.files); }}><input ref={inputRef} className="sr-only" id="media-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp4,application/pdf" onChange={(event) => select(event.target.files)} /><div className="dropzone__icon" aria-hidden="true">＋</div><label htmlFor="media-file">{file ? 'Replace selected file' : 'Choose a media file'}</label><span>or drag and drop it here</span><small>Images up to 10 MB · Videos up to 100 MB · Audio up to 25 MB · PDFs up to 20 MB</small>{error && <p className="field__error" role="alert">{error}</p>}</div>;
}
