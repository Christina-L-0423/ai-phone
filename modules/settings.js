import { getSettings, saveSettings } from './utils.js';
let dom = {};
export function initSettings(d) { dom = d; loadSettingsUI(); bindEvents(); }
function loadSettingsUI() {
  const s = getSettings();
  if (dom.apiBase) dom.apiBase.value = s.apiBase;
  if (dom.apiKey) dom.apiKey.value = s.apiKey;
  if (dom.modelDisplay && s.model) dom.modelDisplay.textContent = s.model;
  if (dom.streamToggle) dom.streamToggle.checked = s.stream;
  if (dom.streamStatus) dom.streamStatus.textContent = s.stream ? '开启' : '关闭';
}
function bindEvents() {
  if (dom.streamToggle) {
    dom.streamToggle.addEventListener('change', () => {
      const checked = dom.streamToggle.checked;
      if (dom.streamStatus) dom.streamStatus.textContent = checked ? '开启' : '关闭';
      saveSettings({ stream: checked });
    });
  }
  if (dom.fetchModelsBtn) {
    dom.fetchModelsBtn.addEventListener('click', async () => {
      const base = dom.apiBase?.value?.trim() || '';
      const key = dom.apiKey?.value?.trim() || '';
      if (!base || !key) { if (dom.apiStatus) dom.apiStatus.textContent = '❌ 请填写地址和Key'; return; }
      saveSettings({ apiBase: base, apiKey: key });
      if (dom.apiStatus) dom.apiStatus.textContent = '📥 拉取中...';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'models', baseUrl: base, apiKey: key })
        });
        const data = await res.json();
        if (data.models && dom.modelSelect) {
          dom.modelSelect.innerHTML = '<option value="">请选择</option>';
          data.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id || m;
            opt.textContent = m.id || m;
            dom.modelSelect.appendChild(opt);
          });
          if (dom.apiStatus) dom.apiStatus.textContent = `✅ 成功拉取 ${data.models.length} 个模型`;
          const savedModel = localStorage.getItem('selectedModel');
          if (savedModel && [...dom.modelSelect.options].some(opt => opt.value === savedModel)) {
            dom.modelSelect.value = savedModel;
          }
        } else {
          if (dom.apiStatus) dom.apiStatus.textContent = '❌ 拉取失败：' + (data.error || '未知错误');
        }
      } catch (e) {
        if (dom.apiStatus) dom.apiStatus.textContent = '❌ 请求失败：' + e.message;
      }
    });
  }
  if (dom.saveApiBtn) {
    dom.saveApiBtn.addEventListener('click', () => {
      const model = dom.modelSelect?.value || '';
      saveSettings({ apiBase: dom.apiBase?.value?.trim() || '', apiKey: dom.apiKey?.value?.trim() || '', model });
      if (model && dom.modelDisplay) dom.modelDisplay.textContent = model;
      if (dom.apiStatus) {
        dom.apiStatus.textContent = '✅ 已保存';
        setTimeout(() => { if (dom.apiStatus.textContent === '✅ 已保存') dom.apiStatus.textContent = '就绪'; }, 2000);
      }
    });
  }
  if (dom.modelSelect) {
    dom.modelSelect.addEventListener('change', () => {
      if (dom.modelSelect.value && dom.modelDisplay) {
        dom.modelDisplay.textContent = dom.modelSelect.value;
        saveSettings({ model: dom.modelSelect.value });
      }
    });
  }
}
export function getCurrentModel() { return dom.modelSelect?.value || ''; }