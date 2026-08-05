import { getChars, getSettings } from './utils.js';
import { initSettings, getCurrentModel } from './settings.js';
import { initChat, clearChatHistory } from './chat.js';
import { initChar, openCreateChar } from './char.js';
import { initContacts, renderContactList, openContactDetail } from './contacts.js';
import { initDialog, openDialog } from './dialog.js';

window.renderWechatContent = renderWechatContent;
window.openCreateChar = openCreateChar;
window.openContactDetail = openContactDetail;
window.openDialog = openDialog;
window.clearChatHistory = clearChatHistory;
window.currentDialogCharId = null;

const dom = {};

function initDOM() {
  dom.statusTime = document.getElementById('statusTime');
  dom.apiBase = document.getElementById('apiBase');
  dom.apiKey = document.getElementById('apiKey');
  dom.modelSelect = document.getElementById('modelSelect');
  dom.fetchModelsBtn = document.getElementById('fetchModelsBtn');
  dom.saveApiBtn = document.getElementById('saveApiBtn');
  dom.apiStatus = document.getElementById('apiStatus');
  dom.modelDisplay = document.getElementById('modelDisplay');
  dom.streamToggle = document.getElementById('streamToggle');
  dom.streamStatus = document.getElementById('streamStatus');
  dom.chatMessages = document.getElementById('chatMessages');
  dom.userInput = document.getElementById('userInput');
  dom.sendBtn = document.getElementById('sendBtn');
  dom.newChatBtn = document.getElementById('newChatBtn');
  dom.charAvatarPreview = document.getElementById('charAvatarPreview');
  dom.charAvatarInput = document.getElementById('charAvatarInput');
  dom.avatarUploadBtn = document.getElementById('avatarUploadBtn');
  dom.charNameInput = document.getElementById('charNameInput');
  dom.charPromptInput = document.getElementById('charPromptInput');
  dom.saveCharBtn = document.getElementById('saveCharBtn');
  dom.createCharStatus = document.getElementById('createCharStatus');
  dom.createCharTitle = document.getElementById('createCharTitle');
  dom.detailAvatar = document.getElementById('detailAvatar');
  dom.detailNameDisplay = document.getElementById('detailNameDisplay');
  dom.detailPromptDisplay = document.getElementById('detailPromptDisplay');
  dom.detailAvatarEdit = document.getElementById('detailAvatarEdit');
  dom.detailNameInput = document.getElementById('detailNameInput');
  dom.detailPromptInput = document.getElementById('detailPromptInput');
  dom.detailEditBtn = document.getElementById('detailEditBtn');
  dom.detailSaveBtn = document.getElementById('detailSaveBtn');
  dom.detailCancelBtn = document.getElementById('detailCancelBtn');
  dom.detailDeleteBtn = document.getElementById('detailDeleteBtn');
  dom.detailStatus = document.getElementById('detailStatus');
  dom.contactDetailTitle = document.getElementById('contactDetailTitle');
  dom.viewMode = document.getElementById('viewMode');
  dom.editMode = document.getElementById('editMode');
  dom.backFromContactDetail = document.getElementById('backFromContactDetail');
  dom.chatDialogPage = document.getElementById('chatDialogPage');
  dom.dialogAvatar = document.getElementById('dialogAvatar');
  dom.dialogName = document.getElementById('dialogName');
  dom.dialogModel = document.getElementById('dialogModel');
  dom.dialogPromptBox = document.getElementById('dialogPromptBox');
  dom.dialogMessages = document.getElementById('dialogMessages');
  dom.dialogInput = document.getElementById('dialogInput');
  dom.dialogSendBtn = document.getElementById('dialogSendBtn');
  dom.dialogNewBtn = document.getElementById('dialogNewBtn');
  dom.backFromDialog = document.getElementById('backFromDialog');
  dom.wechatTabContent = document.getElementById('wechatTabContent');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}
window.showPage = showPage;

function showWechat() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
  if (dom.chatDialogPage) dom.chatDialogPage.classList.remove('active');
  renderWechatContent();
}

function renderWechatContent() {
  const container = dom.wechatTabContent;
  if (!container) return;
  const chars = getChars();
  const activeTab = document.querySelector('.tab.active')?.dataset.tab || 'chats';
  if (activeTab === 'chats') {
    renderChatList(container, chars);
  } else {
    renderContactList(container);
  }
}

function renderChatList(container, chars) {
  if (chars.length === 0) {
    container.innerHTML = `<div class="empty-state">📭 还没有联系人<br>去通讯录添加吧</div>`;
    return;
  }
  let html = `<div style="background:#fff;padding:10px 16px;font-size:14px;color:#8e8e93;border-bottom:1px solid #f0f0f0;">最近聊天</div>`;
  chars.forEach(c => {
    const history = JSON.parse(localStorage.getItem('charHistory_' + c.id) || '[]');
    const lastMsg = history.length > 0 ? history[history.length - 1] : null;
    const preview = lastMsg ? (lastMsg.content || '') : '暂无消息';
    const time = lastMsg ? new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
    const avatarHtml = c.avatar ? `<img src="${c.avatar}" />` : '🧑';
    html += `
      <div class="list-item" data-id="${c.id}">
        <div class="avatar">${avatarHtml}</div>
        <div class="info">
          <div class="name">${c.name || '未命名'}</div>
          <div class="preview">${preview}</div>
        </div>
        <div class="time">${time}</div>
      </div>
    `;
  });
  container.innerHTML = html;
  container.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const char = getChars().find(c => c.id === id);
      if (char) { window.currentDialogCharId = id;
        openDialog(char); }
    });
  });
}

function init() {
  initDOM();
  initSettings(dom);
  if (dom.chatMessages) initChat(dom);
  initChar(dom);
  initContacts(dom);
  initDialog(dom);

  updateTime();
  setInterval(updateTime, 10000);

  const goToWechat = document.getElementById('goToWechat');
  const goToWechatFromDock = document.getElementById('goToWechatFromDock');
  const goToSettingsFromHome = document.getElementById('goToSettingsFromHome');
  const goToSettingsFromDock = document.getElementById('goToSettingsFromDock');
  const backFromSettings = document.getElementById('backFromSettings');
  const backFromApiSettings = document.getElementById('backFromApiSettings');
  const goToApiSettings = document.getElementById('goToApiSettings');

  if (goToWechat) goToWechat.addEventListener('click', showWechat);
  if (goToWechatFromDock) goToWechatFromDock.addEventListener('click', showWechat);
  if (goToSettingsFromHome) goToSettingsFromHome.addEventListener('click', () => showPage('settingsPage'));
  if (goToSettingsFromDock) goToSettingsFromDock.addEventListener('click', () => showPage('settingsPage'));
  if (backFromSettings) backFromSettings.addEventListener('click', () => showPage('homePage'));
  if (backFromApiSettings) backFromApiSettings.addEventListener('click', () => showPage('settingsPage'));
  if (goToApiSettings) goToApiSettings.addEventListener('click', () => showPage('apiSettingsPage'));

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderWechatContent();
    });
  });

  const backFromCreateChar = document.getElementById('backFromCreateChar');
  if (backFromCreateChar) {
    backFromCreateChar.addEventListener('click', () => {
      renderWechatContent();
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
    });
  }

  autoFetchModels();
  renderWechatContent();
}

function updateTime() {
  if (!dom.statusTime) return;
  const now = new Date();
  dom.statusTime.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

async function autoFetchModels() {
  const settings = getSettings();
  if (settings.apiBase && settings.apiKey && settings.model) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'models', baseUrl: settings.apiBase, apiKey: settings.apiKey })
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
        if ([...dom.modelSelect.options].some(opt => opt.value === settings.model)) {
          dom.modelSelect.value = settings.model;
        }
      }
    } catch (e) { console.log('自动拉取失败'); }
  }
}

document.addEventListener('DOMContentLoaded', init);