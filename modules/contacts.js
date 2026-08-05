// ===== modules/contacts.js =====
import { getChars, saveChars, getCharHistory, saveCharHistory } from './utils.js';

let dom = {};
let detailCharId = null;
let isEditing = false;
let originalName = '';
let originalPrompt = '';

export function initContacts(d) {
  dom = d;
  bindEvents();
}

function bindEvents() {
  dom.detailEditBtn.addEventListener('click', () => {
    if (!detailCharId) return;
    const chars = getChars();
    const char = chars.find(c => c.id === detailCharId);
    if (!char) return;
    dom.viewMode.style.display = 'none';
    dom.editMode.style.display = 'block';
    isEditing = true;
    dom.detailNameInput.value = char.name || '';
    dom.detailPromptInput.value = char.prompt || '';
    originalName = char.name || '';
    originalPrompt = char.prompt || '';
    dom.detailAvatarEdit.innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
    dom.detailStatus.textContent = '';
  });

  dom.detailSaveBtn.addEventListener('click', () => {
    if (!detailCharId) return;
    const newName = dom.detailNameInput.value.trim();
    const newPrompt = dom.detailPromptInput.value.trim();
    if (!newName) { dom.detailStatus.textContent = '❌ 名字不能为空'; return; }
    let chars = getChars();
    const idx = chars.findIndex(c => c.id === detailCharId);
    if (idx !== -1) {
      chars[idx].name = newName;
      chars[idx].prompt = newPrompt;
      saveChars(chars);
      dom.detailNameDisplay.textContent = newName;
      dom.detailPromptDisplay.textContent = newPrompt || '未设置人设';
      originalName = newName;
      originalPrompt = newPrompt;
      dom.detailStatus.textContent = '✅ 保存成功！';
      dom.viewMode.style.display = 'block';
      dom.editMode.style.display = 'none';
      isEditing = false;
      if (window.renderWechatContent) window.renderWechatContent();
      setTimeout(() => { dom.detailStatus.textContent = ''; }, 2000);
    }
  });

  dom.detailCancelBtn.addEventListener('click', () => {
    if (!detailCharId) return;
    dom.detailNameInput.value = originalName;
    dom.detailPromptInput.value = originalPrompt;
    dom.viewMode.style.display = 'block';
    dom.editMode.style.display = 'none';
    isEditing = false;
    dom.detailStatus.textContent = '';
  });

  dom.detailDeleteBtn.addEventListener('click', () => {
    if (!detailCharId) return;
    if (!confirm('确定删除这个角色吗？')) return;
    let chars = getChars();
    chars = chars.filter(c => c.id !== detailCharId);
    saveChars(chars);
    localStorage.removeItem('charHistory_' + detailCharId);
    if (window.currentDialogCharId === detailCharId) window.currentDialogCharId = null;
    dom.viewMode.style.display = 'block';
    dom.editMode.style.display = 'none';
    isEditing = false;
    if (window.renderWechatContent) window.renderWechatContent();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
  });

  dom.backFromContactDetail.addEventListener('click', () => {
    if (isEditing) {
      dom.detailNameInput.value = originalName;
      dom.detailPromptInput.value = originalPrompt;
      dom.viewMode.style.display = 'block';
      dom.editMode.style.display = 'none';
      isEditing = false;
      dom.detailStatus.textContent = '';
    }
    if (window.renderWechatContent) window.renderWechatContent();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
  });
}

export function openContactDetail(charId) {
  detailCharId = charId;
  const chars = getChars();
  const char = chars.find(c => c.id === charId);
  if (!char) return;
  dom.detailAvatar.innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  dom.detailNameDisplay.textContent = char.name || '未命名';
  dom.detailPromptDisplay.textContent = char.prompt || '未设置人设';
  dom.detailAvatarEdit.innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  dom.detailNameInput.value = char.name || '';
  dom.detailPromptInput.value = char.prompt || '';
  originalName = char.name || '';
  originalPrompt = char.prompt || '';
  dom.viewMode.style.display = 'block';
  dom.editMode.style.display = 'none';
  isEditing = false;
  dom.detailStatus.textContent = '';
  dom.contactDetailTitle.textContent = '角色详情';
  document.getElementById('contactDetailPage').classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('contactDetailPage').classList.add('active');
}

export function renderContactList(container) {
  const chars = getChars();
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding:10px 16px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:14px;color:#8e8e93;">所有角色</span>
      <button id="newContactBtn" style="background:#007aff;color:#fff;border:none;border-radius:16px;padding:4px 14px;font-size:14px;cursor:pointer;">+ 新建</button>
    </div>
  `;
  if (chars.length === 0) {
    html += `<div class="empty-state">📭 还没有角色，点击“新建”创建</div>`;
  } else {
    chars.forEach(c => {
      const avatarHtml = c.avatar ? `<img src="${c.avatar}" />` : '🧑';
      html += `
        <div class="list-item" data-id="${c.id}">
          <div class="avatar">${avatarHtml}</div>
          <div class="info">
            <div class="name">${c.name || '未命名'}</div>
            <div class="preview">${c.prompt ? c.prompt.substring(0, 30) + '...' : '未设置人设'}</div>
          </div>
        </div>
      `;
    });
  }
  container.innerHTML = html;
  container.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      openContactDetail(id);
    });
  });
  const newBtn = document.getElementById('newContactBtn');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      if (window.openCreateChar) window.openCreateChar();
    });
  }
}