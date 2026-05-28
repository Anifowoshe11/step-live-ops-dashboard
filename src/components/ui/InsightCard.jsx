export default function InsightCard({ type, icon, tag, text }) {
  return (
    <div className={`ins ${type}`}>
      <div className="ins-ico">{icon}</div>
      <div>
        <div className="ins-tag">{tag}</div>
        <div className="ins-txt">{text}</div>
      </div>
    </div>
  );
}
