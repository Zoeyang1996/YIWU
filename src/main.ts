import './styles.css';
import { mountApp } from './app/mountApp';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('缺少网页挂载容器');
const dispose = mountApp(root);
if (import.meta.hot) import.meta.hot.dispose(dispose);
