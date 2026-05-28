import { useData } from '../../context/DataContext';

export default function StatusBar() {
  const { status } = useData();
  return (
    <div className={`status ${status.type}`}>
      {status.message}
    </div>
  );
}
