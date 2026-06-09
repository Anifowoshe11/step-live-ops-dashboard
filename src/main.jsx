import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import './index.css';
import App from './App.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);
ChartJS.defaults.font.family = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = '#5f6368';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
