// Compact companion shown on google.com/maps: today's Munich status + top heads-ups + link to the full briefing.
// It does not read or change Google's map; it is a floating card in its own shadow DOM.
(() => {
  const data = globalThis.TransportGapsToday;
  if (!data || document.getElementById('transport-gaps-companion')) return;
  const briefingUrl = chrome.runtime.getURL('index.html');
  const ups = data.headsUps || [];
  const level = Math.max(0, ...ups.filter(up => !up.upcoming).map(up => up.level));
  const LABELS = [['🟢', 'Smooth so far'], ['🟢', 'Mostly smooth'], ['🟠', 'Allow extra time'], ['🔴', 'Expect disruption']];
  const COLORS = ['#2f7d4f', '#2f7d4f', '#e08a12', '#bc155a'];
  const wx = data.weather?.city;
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }).format(new Date(data.generatedAt));

  const host = document.createElement('div');
  host.id = 'transport-gaps-companion';
  host.style.cssText = 'position:fixed;left:16px;bottom:96px;z-index:2147483000;';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    [hidden] { display: none !important; }
    * { box-sizing: border-box; font-family: ui-rounded, "SF Pro Rounded", -apple-system, "Segoe UI", Roboto, sans-serif; }
    .pill { display: flex; align-items: center; gap: 8px; padding: 9px 14px 9px 10px; border: 0; border-radius: 99px; background: #253731; color: #fffdf7; font-size: 13px; font-weight: 750; cursor: pointer; box-shadow: 0 6px 20px #0004; }
    .pill b { width: 10px; height: 10px; border-radius: 50%; background: ${COLORS[level]}; box-shadow: 0 0 0 3px #ffffff33; }
    .card { width: 320px; padding: 14px; border-radius: 16px; background: #fffdf7; color: #253731; box-shadow: 0 12px 40px #0005; border-top: 5px solid ${COLORS[level]}; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .eyebrow { font-size: 10px; font-weight: 850; letter-spacing: 1.3px; color: #52634f; }
    h2 { margin: 6px 0 2px; font-size: 19px; letter-spacing: -.4px; }
    p { margin: 0; font-size: 12px; color: #64716b; }
    ul { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 6px; }
    li { padding: 7px 9px; border-radius: 9px; background: #f2f5e8; font-size: 12.5px; font-weight: 650; line-height: 1.3; }
    li[data-l="3"] { background: #fde6ee; } li[data-l="2"] { background: #fff1dc; }
    a { display: block; padding: 9px 12px; border-radius: 10px; background: #253731; color: #fffdf7; text-align: center; font-size: 13px; font-weight: 750; text-decoration: none; }
    button.x { border: 0; background: #f2f5e8; border-radius: 99px; width: 28px; height: 28px; cursor: pointer; font-size: 14px; color: #253731; }
    :focus-visible { outline: 3px solid #236a9b; outline-offset: 2px; }`;
  root.append(style);

  function el(tag, props = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
    node.append(...kids);
    return node;
  }

  const pill = el('button', { class: 'pill', type: 'button', 'aria-expanded': 'false', onclick: () => toggle(true) }, el('b'), `Munich: ${LABELS[level][1]}`);
  const card = el('section', { class: 'card', 'aria-label': 'Transport Gaps Munich briefing', hidden: '' },
    el('div', { class: 'row' }, el('span', { class: 'eyebrow', text: `🚎 TRANSPORT GAPS · ${time}` }), el('button', { class: 'x', type: 'button', 'aria-label': 'Minimise', text: '–', onclick: () => toggle(false) })),
    el('h2', { text: `${LABELS[level][0]} ${LABELS[level][1]}` }),
    el('p', { text: wx ? `${wx.icon} ${wx.temperature}°C · ${wx.label} in Munich` : 'Munich this morning' }),
    el('ul', {}, ...ups.slice(0, 4).map(up => el('li', { 'data-l': String(up.level), text: `${up.icon} ${up.title}${up.includesExamples ? ' (example)' : ''}` }))),
    el('a', { href: briefingUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Open full briefing & map ↗' }));
  function toggle(open) {
    card.hidden = !open;
    pill.hidden = open;
    pill.setAttribute('aria-expanded', String(open));
    try { sessionStorage.setItem('transport-gaps-open', open ? '1' : '0'); } catch { /* ignore */ }
  }
  root.append(pill, card);
  document.documentElement.append(host);
  let remembered = null;
  try { remembered = sessionStorage.getItem('transport-gaps-open'); } catch { /* storage blocked */ }
  if (remembered === '1' || (remembered !== '0' && level >= 2)) toggle(true);
})();
