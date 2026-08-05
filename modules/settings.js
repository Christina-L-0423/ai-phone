// ===== modules/settings.js =====
import { getSettings, saveSettings } from './utils.js';

// DOM 引用（由 app.js 注入）
let dom = {};

export function initSettings(d) {
  dom = d;
  loadSettingsUI();
  bindEvents();
}

function loadSettingsUI() {
  const settings = getSettings();
  dom.apiBase.value = settings.apiBase;
  dom.apiKey.value = settings.apiKey;
  if (settings.model) {
    dom.modelDisplay.textContent = settings.model;
  }
  dom.streamToggle.checked = settings.stream;
  dom.streamStatus.textContent = settings.stream ? '开启' : '关闭';
}

function bindEvents() {
  dom.streamToggle.addEventListener('change', () => {
    const checked = dom.streamToggle.checked;
    dom.streamStatus.textContent = checked ? '开启' : '关闭';
    saveSettings({ stream: checked });
  });

  dom.fetchModelsBtn.addEventListener('click', async () => {
    const base = dom.apiBase.value.trim();
    const key = dom.apiKey.value.trim();
    if (!base || !key) {
      dom.apiStatus.textContent = '❌ 请填写地址和Key';
      return;
    }
    saveSettings({ apiBase: base, apiKey: key });
    dom.apiStatus.textContent = '📥 拉取中...';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'models', baseUrl: base, apiKey: key })
      });
      const data = await res.json();
      if (data.models) {
        dom.modelSelect.innerHTML = '<option value="">请选择</option>';
        data.models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id || m;
          opt.textContent = m.id || m;
          dom.modelSelect.appendChild(opt);
        });
        dom.apiStatus.textContent = `✅ 成功拉取 ${data.models.length} 个模型`;
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel && [...dom.modelSelect.options].some(opt => opt.value === savedModel)) {
          dom.modelSelect.value = savedModel;
        }
      } else {
        dom.apiStatus.textContent = '❌ 拉取失败：' + (data.error || '未知错误');
      }
    } catch (e) {
      dom.apiStatus.textContent = '❌ 请求失败：' + e.message;
    }
  });

  dom.saveApiBtn.addEventListener('click', () => {
    const model = dom.modelSelect.value;
    saveSettings({ apiBase: dom.apiBase.value.trim(), apiKey: dom.apiKey.value.trim(), model });
    if (model) dom.modelDisplay.textContent = model;
    dom.apiStatus.textContent = '✅ 已保存';
    setTimeout(() => { if (dom.apiStatus.textContent === '✅ 已保存') dom.apiStatus.textContent = '就绪'; }, 2000);
  });

  dom.modelSelect.addEventListener('change', () => {
    if (dom.modelSelect.value) {
      dom.modelDisplay.textContent = dom.modelSelect.value;
      saveSettings({ model: dom.modelSelect.value });
    }
  });
}

export function getCurrentModel() {
  return dom.modelSelect?.value || '';
}