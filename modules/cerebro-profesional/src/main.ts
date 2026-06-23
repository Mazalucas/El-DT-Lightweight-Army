import './styles.css';
import { bootstrapApp } from './app/main';

const root = document.querySelector('#app') as HTMLElement | null;
if (root) bootstrapApp(root);
