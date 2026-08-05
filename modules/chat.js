import { getSettings } from './utils.js';
let dom = {}, chatHistory = [];
export function initChat(d) {
  dom = d;
  if (!dom.chatMessages || !dom.userInput || !dom.sendBtn) { console.log('普通聊天元素缺失，跳过'); return; }
  loadChatHistory(); renderChatMessages(); bindEvents();
}
function loadChatHistory() { try { const s = localStorage.getItem('chatHistory'); chatHistory = s ? JSON.parse(s) : []; } catch (e) { chatHistory = []; } }
function saveChatHistory() { localStorage.setItem('chatHistory', JSON.stringify(chatHistory)); }
function renderChatMessages() {
  if (!dom.chatMessages) return;
  if (chatHistory.length === 0) { dom.chatMessages.innerHTML = '<div style="color:#8e8e93;text-align:center;padding:40px 0;font-size:16px;">开始新的对话吧 💬</div>'; return; }
  let html = '';
  chatHistory.forEach(msg => {
    const t = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    html += `<div class="message ${msg.role}">${msg.content}<div class="msg-time">${t}</div></div>`;
  });
  dom.chatMessages.innerHTML = html;
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}
function addChatMessage(role, content) { chatHistory.push({ role, content }); saveChatHistory(); renderChatMessages(); }
export function clearChatHistory() {
  if (chatHistory.length > 0 && !confirm('确定清空聊天记录吗？')) return;
  chatHistory = []; saveChatHistory(); renderChatMessages();
}
function bindEvents() {
  dom.sendBtn.addEventListener('click', async () => {
    const settings = getSettings();
    const base = settings.apiBase, key = settings.apiKey;
    const model = dom.modelSelect?.value || '';
    const msg = dom.userInput?.value?.trim() || '';
    if (!base || !key) { alert('请先设置 API'); window.showPage('apiSettingsPage'); return; }
    if (!model) { alert('请先选择模型'); return; }
    if (!msg) { alert('请输入问题'); return; }
    addChatMessage('user', msg);
    dom.userInput.value = '';
    dom.userInput.style.height = 'auto';
    chatHistory.push({ role: 'assistant', content: '🤔 思考中...' });
    saveChatHistory(); renderChatMessages();
    const isStream = settings.stream;
    const messages = chatHistory.filter(m => m.content !== '🤔 思考中...');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', baseUrl: base, apiKey: key, model, messages, stream: isStream })
      });
      if (isStream) {
        chatHistory.pop(); saveChatHistory();
        chatHistory.push({ role: 'assistant', content: '' });
        saveChatHistory(); renderChatMessages();
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
                  if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant') {
                    chatHistory[chatHistory.length - 1].content = full;
                  }
                  saveChatHistory(); renderChatMessages();
                }
              } catch (e) {}
            }
          }
        }
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant') {
          chatHistory[chatHistory.length - 1].content = full || '无回复';
        }
        saveChatHistory(); renderChatMessages();
      } else {
        const data = await res.json();
        chatHistory.pop(); saveChatHistory();
        if (data.reply) addChatMessage('assistant', data.reply);
        else addChatMessage('assistant', '❌ 无回复');
      }
    } catch (e) {
      chatHistory.pop(); saveChatHistory();
      addChatMessage('assistant', '❌ 出错：' + e.message);
    }
  });
  dom.userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dom.sendBtn.click(); }
  });
  dom.userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });
  dom.newChatBtn.addEventListener('click', clearChatHistory);
}