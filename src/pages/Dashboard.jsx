import Nav from '../components/layout/Nav';
import StatusBar from '../components/layout/StatusBar';
import Overview from './Overview';

export default function Dashboard() {
  return (
    <>
      <Nav />
      <StatusBar />
      <div className="canvas">
        <Overview />
      </div>
    </>
  );
}
