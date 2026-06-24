interface LoadingSpinnerProps {
  label?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ label = 'Loading…', fullPage }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner-wrap${fullPage ? ' loading-spinner-full' : ''}`}>
      <div className="loading-spinner" />
      {label && <p className="loading-spinner-label">{label}</p>}
    </div>
  );
}
