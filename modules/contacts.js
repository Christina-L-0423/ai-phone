import { getChars, saveChars, getCharHistory, saveCharHistory } from './utils.js';
let dom = {}, detailCharId = null, isEditing = false, originalName = '', originalPrompt = '';
export function initContacts(d) { dom = d; bindEvents(); }
function bindEvents() {
  if (dom.detailEditBtn) {
    dom.detailEditBtn.addEventListener('click', () => {
      if (!detailCharId) return;
      const chars = getChars();
      const char = chars.find(c => c.id === detailCharId);
      if (!char) return;
      if (dom.viewMode) dom.viewMode.style.display = 'none';
      if (dom.editMode) dom.editMode.style.display = 'block';
      isEditing = true;
      if (dom.detailNameInput) dom.detailNameInput.value = char.name || '';
      if (dom.detailPromptInput) dom.detailPromptInput.value = char.prompt || '';
      originalName = char.name || '';
      originalPrompt = char.prompt || '';
      if (dom.detailAvatarEdit) dom.detailAvatarEdit.innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
      if (dom.detailStatus) dom.detailStatus.textContent = '';
    });
  }
  if (dom.detailSaveBtn) {
    dom.detailSaveBtn.addEventListener('click', () => {
      if (!detailCharId) return;
      const newName = dom.detailNameInput?.value?.trim() || '';
      const newPrompt = dom.detailPromptInput?.value?.trim() || '';
      if (!newName) { if (dom.detailStatus) dom.detailStatus.textContent = '❌ 名字不能为空'; return; }
      let chars = getChars();
      const idx = chars.findIndex(c => c.id === detailCharId);
      if (idx !== -1) {
        chars[idx].name = newName;
        chars[idx].prompt = newPrompt;
        saveChars(chars);
        if (dom.detailNameDisplay) dom.detailNameDisplay.textContent = newName;
        if (dom.detailPromptDisplay) dom.detailPromptDisplay.textContent = newPrompt || '未设置人设';
        originalName = newName;
        originalPrompt = newPrompt;
        if (dom.detailStatus) dom.detailStatus.textContent = '✅ 保存成功！';
        if (dom.viewMode) dom.viewMode.style.display = 'block';
        if (dom.editMode) dom.editMode.style.display = 'none';
        isEditing = false;
        if (window.renderWechatContent) window.renderWechatContent();
        setTimeout(() => { if (dom.detailStatus) dom.detailStatus.textContent = ''; }, 2000);
      }
    });
  }
  if (dom.detailCancelBtn) {
    dom.detailCancelBtn.addEventListener('click', () => {
      if (!detailCharId) return;
      if (dom.detailNameInput) dom.detailNameInput.value = originalName;
      if (dom.detailPromptInput) dom.detailPromptInput.value = originalPrompt;
      if (dom.viewMode) dom.viewMode.style.display = 'block';
      if (dom.editMode) dom.editMode.style.display = 'none';
      isEditing = false;
      if (dom.detailStatus) dom.detailStatus.textContent = '';
    });
  }
  if (dom.detailDeleteBtn) {
    dom.detailDeleteBtn.addEventListener('click', () => {
      if (!detailCharId) return;
      if (!confirm('确定删除这个角色吗？')) return;
      let chars = getChars();
      chars = chars.filter(c => c.id !== detailCharId);
      saveChars(chars);
      localStorage.removeItem('charHistory_' + detailCharId);
      if (window.currentDialogCharId === detailCharId) window.currentDialogCharId = null;
      if (dom.viewMode) dom.viewMode.style.display = 'block';
      if (dom.editMode) dom.editMode.style.display = 'none';
      isEditing = false;
      if (window.renderWechatContent) window.renderWechatContent();
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
    });
  }
  if (dom.backFromContactDetail) {
    dom.backFromContactDetail.addEventListener('click', () => {
      if (isEditing) {
        if (dom.detailNameInput) dom.detailNameInput.value = originalName;
        if (dom.detailPromptInput) dom.detailPromptInput.value = originalPrompt;
        if (dom.viewMode) dom.viewMode.style.display = 'block';
        if (dom.editMode) dom.editMode.style.display = 'none';
        isEditing = false;
        if (dom.detailStatus) dom.detailStatus.textContent = '';
      }
      if (window.renderWechatContent) window.renderWechatContent();
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
    });
  }
}
export function openContactDetail(charId) {
  detailCharId = charId;
  const chars = getChars();
  const char = chars.find(c => c.id === charId);
  if (!char) return;
  if (dom.detailAvatar) dom.detailAvatar.innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  if (dom.detailNameDisplay) dom.detailNameDisplay.textContent = char.name || '未命名';
  if (dom.detailPromptDisplay) dom.detailPromptDisplay.textContent = char.prompt || '未设置人设';
  if (dom.detailAvatarEdit) dom.detailAvatarEdit.innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  if (dom.detailNameInput) dom.detailNameInput.value = char.name || '';
  if (dom.detailPromptInput) dom.detailPromptInput.value = char.prompt || '';
  originalName = char.name || '';
  originalPrompt = char.prompt || '';
  if (dom.viewMode) dom.viewMode.style.display = 'block';
  if (dom.editMode) dom.editMode.style.display = 'none';
  isEditing = false;
  if (dom.detailStatus) dom.detailStatus.textContent = '';
  if (dom.contactDetailTitle) dom.contactDetailTitle.textContent = '角色详情';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('contactDetailPage');
  if (page) page.classList.add('active');
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