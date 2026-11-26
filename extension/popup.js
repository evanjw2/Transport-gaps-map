(() => {
  const data = globalThis.TransportGapsToday;
  const $ = id => document.getElementById(id);
  if (!data) { $('title').textContent = 'No briefing yet'; $('updated').textContent = 'Run npm run morning, then reload the extension.'; return; }
  const ups = data.headsUps || [];
  const level = Math.max(0, ...ups.filter(up => !up.upcoming).map(up => up.level));
  const labels = [['🟢', 'Smooth so far'], ['🟢', 'Mostly smooth'], ['🟠', 'Allow extra time'], ['🔴', 'Expect disruption']];
  $('emoji').textContent = labels[level][0];
  $('title').textContent = labels[level][1];
  $('status').dataset.level = level;
  const generated = new Date(data.generatedAt);
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const wx = data.weather?.city;
  $('updated').textContent = `Updated ${fmt.format(generated)}${wx ? ` · ${wx.icon} ${wx.temperature}°C ${wx.label}` : ''}`;
  for (const up of ups.slice(0, 4)) {
    const li = document.createElement('li');
    li.dataset.level = up.level;
    li.textContent = `${up.icon} ${up.title}${up.includesExamples ? ' (example)' : ''}`;
    $('ups').append(li);
  }
})();
