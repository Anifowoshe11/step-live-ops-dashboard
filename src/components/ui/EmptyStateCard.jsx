export default function EmptyStateCard({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-copy">{description}</div>
    </div>
  );
}
