export function getChars() {
  try { return JSON.parse(localStorage.getItem('chars')) || []; } catch (e) { return []; }
}
export function saveChars(chars) {
  localStorage.setItem('chars', JSON.stringify(chars));
}
export function getCharHistory(charId) {
  try { return JSON.parse(localStorage.getItem('charHistory_' + charId)) || []; } catch (e) { return []; }
}
export function saveCharHistory(charId, history) {
  localStorage.setItem('charHistory_' + charId, JSON.stringify(history));
}
export function getSettings() {
  try {
    return {
      apiBase: localStorage.getItem('apiBase') || 'https://api.deepseek.com/v1',
      apiKey: localStorage.getItem('apiKey') || '',
      model: localStorage.getItem('selectedModel') || '',
      stream: localStorage.getItem('streamEnabled') === 'true'
    };
  } catch (e) { return { apiBase: 'https://api.deepseek.com/v1', apiKey: '', model: '', stream: false }; }
}
export function saveSettings(settings) {
  if (settings.apiBase !== undefined) localStorage.setItem('apiBase', settings.apiBase);
  if (settings.apiKey !== undefined) localStorage.setItem('apiKey', settings.apiKey);
  if (settings.model !== undefined) localStorage.setItem('selectedModel', settings.model);
  if (settings.stream !== undefined) localStorage.setItem('streamEnabled', settings.stream ? 'true' : 'false');
}