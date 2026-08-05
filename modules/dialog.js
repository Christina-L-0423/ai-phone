import { getChars, getCharHistory, saveCharHistory, getSettings } from './utils.js';
let dom = {}, currentCharId = null;
export function initDialog(d) { dom = d; bindEvents(); }
function bindEvents() {
  if (dom.backFromDialog) {
    dom.backFromDialog.addEventListener('click', () => {
      if (dom.chatDialogPage) dom.chatDialogPage.classList.remove('active');
      if (window.renderWechatContent) window.renderWechatContent();
    });
  }
  if (dom.dialogNewBtn) dom.dialogNewBtn.addEventListener('click', clearDialogHistory);
  if (dom.dialogAvatar) dom.dialogAvatar.addEventListener('click', () => {
    if (dom.dialogPromptBox) dom.dialogPromptBox.classList.toggle('show');
  });
  if (dom.dialogSendBtn) {
    dom.dialogSendBtn.addEventListener('click', async () => {
      const settings = getSettings();
      const base = settings.apiBase, key = settings.apiKey;
      const model = dom.modelSelect?.value || '';
      const msg = dom.dialogInput?.value?.trim() || '';
      if (!base || !key) { alert('请先设置 API'); if (window.showPage) window.showPage('apiSettingsPage'); return; }
      if (!model) { alert('请先选择模型'); return; }
      if (!msg) { alert('请输入问题'); return; }
      if (!currentCharId) { alert('没有选中的角色'); return; }
      const chars = getChars();
      const char = chars.find(c => c.id === currentCharId);
      if (!char) { alert('角色不存在'); return; }
      addDialogMessage('user', msg);
      if (dom.dialogInput) { dom.dialogInput.value = ''; dom.dialogInput.style.height = 'auto'; }
      let history = getCharHistory(currentCharId);
      const messages = [];
      if (char.prompt) messages.push({ role: 'system', content: char.prompt });
      const filtered = history.filter(m => m.content !== '🤔 思考中...');
      messages.push(...filtered);
      history.push({ role: 'assistant', content: '🤔 思考中...' });
      saveCharHistory(currentCharId, history);
      renderDialogMessages();
      const isStream = settings.stream;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'chat', baseUrl: base, apiKey: key, model, messages, stream: isStream })
        });
        if (isStream) {
          let h = getCharHistory(currentCharId);
          if (h.length > 0 && h[h.length - 1].content === '🤔 思考中...') { h.pop(); saveCharHistory(currentCharId, h); }
          h.push({ role: 'assistant', content: '' });
          saveCharHistory(currentCharId, h);
          renderDialogMessages();
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let done = false, full = '';
          while (!done) {
            const { value, done: d } = await reader.read();
            done = d;
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const json = line.slice(6);
                if (json === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(json);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    full += delta;
                    let cur = getCharHistory(currentCharId);
                    if (cur.length > 0 && cur[cur.length - 1].role === 'assistant') {
                      cur[cur.length - 1].content = full;
                      saveCharHistory(currentCharId, cur);
                      renderDialogMessages();
                    }
                  }
                } catch (e) {}
              }
            }
          }
          let fin = getCharHistory(currentCharId);
          if (fin.length > 0 && fin[fin.length - 1].role === 'assistant') {
            fin[fin.length - 1].content = full || '无回复';
            saveCharHistory(currentCharId, fin);
            renderDialogMessages();
            if (window.renderWechatContent) window.renderWechatContent();
          }
        } else {
          const data = await res.json();
          let h = getCharHistory(currentCharId);
          if (h.length > 0 && h[h.length - 1].content === '🤔 思考中...') { h.pop(); saveCharHistory(currentCharId, h); }
          if (data.reply) addDialogMessage('assistant', data.reply);
          else addDialogMessage('assistant', '❌ 无回复');
        }
      } catch (e) {
        let h = getCharHistory(currentCharId);
        if (h.length > 0 && h[h.length - 1].content === '🤔 思考中...') { h.pop(); saveCharHistory(currentCharId, h); }
        addDialogMessage('assistant', '❌ 出错：' + e.message);
      }
    });
  }
  if (dom.dialogInput) {
    dom.dialogInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (dom.dialogSendBtn) dom.dialogSendBtn.click(); }
    });
    dom.dialogInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  }
}
function renderDialogMessages() {
  if (!dom.dialogMessages || !currentCharId) return;
  const history = getCharHistory(currentCharId);
  if (history.length === 0) { dom.dialogMessages.innerHTML = '<div style="color:#8e8e93;text-align:center;padding:40px 0;font-size:16px;">开始对话吧 💬</div>'; return; }
  let html = '';
  history.forEach(msg => {
    const t = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    html += `<div class="message ${msg.role}">${msg.content}<div class="msg-time">${t}</div></div>`;
  });
  dom.dialogMessages.innerHTML = html;
  dom.dialogMessages.scrollTop = dom.dialogMessages.scrollHeight;
}
function addDialogMessage(role, content) {
  if (!currentCharId) return;
  const history = getCharHistory(currentCharId);
  history.push({ role, content });
  saveCharHistory(currentCharId, history);
  renderDialogMessages();
  if (window.renderWechatContent) window.renderWechatContent();
}
function clearDialogHistory() {
  if (!currentCharId) return;
  const history = getCharHistory(currentCharId);
  if (history.length > 0 && !confirm('确定清空该角色的聊天记录吗？')) return;
  saveCharHistory(currentCharId, []);
  renderDialogMessages();
  if (window.renderWechatContent) window.renderWechatContent();
}
export function openDialog(char) {
  currentCharId = char.id;
  if (dom.dialogAvatar) dom.dialogAvatar.innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  if (dom.dialogName) dom.dialogName.textContent = char.name || '未命名';
  if (dom.dialogModel) dom.dialogModel.textContent = '模型: ' + (dom.modelSelect?.value || '未选择');
  updateDialogPrompt();
  renderDialogMessages();
  if (dom.chatDialogPage) dom.chatDialogPage.classList.add('active');
}
function updateDialogPrompt() {
  if (!currentCharId) { if (dom.dialogPromptBox) dom.dialogPromptBox.innerHTML = ''; return; }
  const chars = getChars();
  const char = chars.find(c => c.id === currentCharId);
  if (dom.dialogPromptBox) {
    if (char && char.prompt) {
      dom.dialogPromptBox.innerHTML = `<div><span class="label">📋 人设：</span>${char.prompt}</div>`;
    } else {
      dom.dialogPromptBox.innerHTML = `<div style="color:#8e8e93;">⚠️ 未设置人设</div>`;
    }
  }
}