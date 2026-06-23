import type { ThemePreference } from '@shared/types.js';
import { icon } from './icons.js';

export function themeSegmentedControl(
  value: ThemePreference,
  onChange: (v: ThemePreference) => void,
): HTMLElement {
  const options: { id: ThemePreference; label: string; iconName: string }[] = [
    { id: 'dark', label: 'Oscuro', iconName: 'moon' },
    { id: 'light', label: 'Claro', iconName: 'sun' },
    { id: 'system', label: 'Sistema', iconName: 'monitor' },
  ];

  const wrap = document.createElement('div');
  wrap.className = 'segmented';
  wrap.setAttribute('role', 'radiogroup');
  wrap.setAttribute('aria-label', 'Tema de apariencia');

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `segmented-option${value === opt.id ? ' active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', value === opt.id ? 'true' : 'false');
    btn.innerHTML = `${icon(opt.iconName)}<span>${opt.label}</span>`;
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.segmented-option').forEach((el) => {
        el.classList.remove('active');
        el.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      onChange(opt.id);
    });
    wrap.appendChild(btn);
  });

  return wrap;
}
