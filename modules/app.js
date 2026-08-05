// ===== modules/app.js =====
import { getChars, getSettings } from './utils.js';
import { initSettings, getCurrentModel } from './settings.js';
import { initChat, clearChatHistory } from './chat.js';
import { initChar, openCreateChar } from './char.js';
import { initContacts, renderContactList, openContactDetail } from './contacts.js';
import { initDialog, openDialog } from './dialog.js';

// 暴露部分函数给全局（供其他模块调用）
window.renderWechatContent = renderWechatContent;
window.openCreateChar = openCreateChar;
window.openContactDetail = openContactDetail;
window.openDialog = openDialog;
window.clearChatHistory = clearChatHistory;
window.currentDialogCharId = null;

// DOM 引用
const dom = {};

function initDOM() {
  // 状态栏
  dom.statusTime = document.getElementById('statusTime');
  // API设置
  dom.apiBase = document.getElementById('apiBase');
  dom.apiKey = document.getElementById('apiKey');
  dom.modelSelect = document.getElementById('modelSelect');
  dom.fetchModelsBtn = document.getElementById('fetchModelsBtn');
  dom.saveApiBtn = document.getElementById('saveApiBtn');
  dom.apiStatus = document.getElementById('apiStatus');
  dom.modelDisplay = document.getElementById('modelDisplay');
  dom.streamToggle = document.getElementById('streamToggle');
  dom.streamStatus = document.getElementById('streamStatus');
  // 普通聊天
  dom.chatMessages = document.getElementById('chatMessages');
  dom.userInput = document.getElementById('userInput');
  dom.sendBtn = document.getElementById('sendBtn');
  dom.newChatBtn = document.getElementById('newChatBtn');
  // Char创建
  dom.charAvatarPreview = document.getElementById('charAvatarPreview');
  dom.charAvatarInput = document.getElementById('charAvatarInput');
  dom.avatarUploadBtn = document.getElementById('avatarUploadBtn');
  dom.charNameInput = document.getElementById('charNameInput');
  dom.charPromptInput = document.getElementById('charPromptInput');
  dom.saveCharBtn = document.getElementById('saveCharBtn');
  dom.createCharStatus = document.getElementById('createCharStatus');
  dom.createCharTitle = document.getElementById('createCharTitle');
  // 通讯录详情
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
  // 角色对话
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
  // 微信内容
  dom.wechatTabContent = document.getElementById('wechatTabContent');
}

// ===== 页面导航 =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
window.showPage = showPage;

function showWechat() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
  dom.chatDialogPage.classList.remove('active');
  renderWechatContent();
}

// ===== 微信风格渲染 =====
function renderWechatContent() {
  const container = dom.wechatTabContent;
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

// ===== 初始化 =====
function init() {
  initDOM();
  initSettings(dom);
  initChat(dom);
  initChar(dom);
  initContacts(dom);
  initDialog(dom);

  // 状态栏时间
  updateTime();
  setInterval(updateTime, 10000);

  // 绑定主屏幕导航
  document.getElementById('goToWechat').addEventListener('click', showWechat);
  document.getElementById('goToWechatFromDock').addEventListener('click', showWechat);
  document.getElementById('goToSettingsFromHome').addEventListener('click', () => showPage('settingsPage'));
  document.getElementById('goToSettingsFromDock').addEventListener('click', () => showPage('settingsPage'));
  document.getElementById('backFromSettings').addEventListener('click', () => showPage('homePage'));
  document.getElementById('backFromApiSettings').addEventListener('click', () => showPage('settingsPage'));
  document.getElementById('goToApiSettings').addEventListener('click', () => showPage('apiSettingsPage'));

  // Tab切换
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderWechatContent();
    });
  });

  // 返回创建角色页
  document.getElementById('backFromCreateChar').addEventListener('click', () => {
    renderWechatContent();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
  });

  // 自动拉取模型
  autoFetchModels();

  // 初始渲染
  renderWechatContent();
}

function updateTime() {
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
      if (data.models) {
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

// 启动
document.addEventListener('DOMContentLoaded', init);