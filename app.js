// ============================================================
// app.js - 所有 JavaScript 逻辑
// ============================================================

// ===== 存储工具 =====
function getChars() {
  try { return JSON.parse(localStorage.getItem('chars')) || []; } catch (e) { return []; }
}
function saveChars(chars) {
  localStorage.setItem('chars', JSON.stringify(chars));
}
function getCharHistory(charId) {
  try { return JSON.parse(localStorage.getItem('charHistory_' + charId)) || []; } catch (e) { return []; }
}
function saveCharHistory(charId, history) {
  localStorage.setItem('charHistory_' + charId, JSON.stringify(history));
}
function getProfile() {
  try { return JSON.parse(localStorage.getItem('userProfile')) || { name: '我', signature: '这个人很懒，什么都没写', avatar: null, cover: null, persona: '' }; } catch (e) { return { name: '我', signature: '这个人很懒，什么都没写', avatar: null, cover: null, persona: '' }; }
}
function saveProfile(profile) {
  localStorage.setItem('userProfile', JSON.stringify(profile));
}
function getMoments() {
  try { return JSON.parse(localStorage.getItem('moments')) || []; } catch (e) { return []; }
}
function saveMoments(moments) {
  localStorage.setItem('moments', JSON.stringify(moments));
}

// ===== 导航 =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('wechatApp').classList.remove('active');
  document.getElementById('chatDialogPage').classList.remove('active');
  document.getElementById('momentEditor').classList.remove('show');
  document.getElementById('popupMenu').classList.remove('show');
  document.getElementById('groupMemberSelector').classList.remove('show');
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}
function showWechat(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('wechatApp').classList.add('active');
  document.getElementById('chatDialogPage').classList.remove('active');
  document.getElementById('momentEditor').classList.remove('show');
  document.getElementById('popupMenu').classList.remove('show');
  document.getElementById('groupMemberSelector').classList.remove('show');
  if (tab) {
    document.querySelectorAll('.wechat-app .tab').forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector(`.wechat-app .tab[data-tab="${tab}"]`);
    if (targetTab) targetTab.classList.add('active');
  }
  renderWechatContent();
}
function goHome() { showPage('homePage'); }

document.getElementById('goToWechat').addEventListener('click', () => showWechat('chats'));
document.getElementById('goToWechatFromDock').addEventListener('click', () => showWechat('chats'));
document.getElementById('goToSettingsFromHome').addEventListener('click', () => showPage('settingsPage'));
document.getElementById('goToSettingsFromDock').addEventListener('click', () => showPage('settingsPage'));
document.getElementById('backFromSettings').addEventListener('click', goHome);
document.getElementById('backFromApiSettings').addEventListener('click', () => showPage('settingsPage'));
document.getElementById('goToApiSettings').addEventListener('click', () => showPage('apiSettingsPage'));
document.getElementById('wechatBack').addEventListener('click', goHome);
document.getElementById('forceRefreshBtn').addEventListener('click', function() {
  if (confirm('确定要强制刷新页面吗？将重新加载所有资源。')) location.reload(true);
});
document.getElementById('goToNovel').addEventListener('click', () => showPage('novelPage'));
document.getElementById('backFromNovel').addEventListener('click', goHome);
document.getElementById('goToMusic').addEventListener('click', () => showPage('musicPage'));
document.getElementById('backFromMusic').addEventListener('click', goHome);
document.getElementById('backFromCreateChar').addEventListener('click', () => { renderWechatContent(); showWechat('contacts'); });
document.getElementById('backFromContactDetail').addEventListener('click', () => {
  if (isEditing) {
    document.getElementById('detailNameInput').value = originalName;
    document.getElementById('detailBioInput').value = originalBio;
    document.getElementById('detailPromptInput').value = originalPrompt;
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    isEditing = false;
    document.getElementById('detailStatus').textContent = '';
  }
  renderWechatContent(); showWechat('contacts');
});
document.getElementById('backFromProfileEdit').addEventListener('click', () => { renderWechatContent(); showWechat('profile'); });
document.getElementById('editorClose').addEventListener('click', closeEditor);

document.querySelectorAll('.wechat-app .tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.wechat-app .tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    renderWechatContent();
  });
});

// ===== 状态栏时间 =====
function updateTime() {
  const now = new Date();
  document.getElementById('statusTime').textContent =
    String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
}
updateTime();
setInterval(updateTime, 10000);

// ===== 全屏适配（锁定，不可更改） =====
function applyFullscreen() {}
applyFullscreen();
if (window.matchMedia('(display-mode: standalone)').matches) {
  applyFullscreen();
}

// ===== API 设置 =====
const apiBase = document.getElementById('apiBase');
const apiKey = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');
const fetchModelsBtn = document.getElementById('fetchModelsBtn');
const saveApiBtn = document.getElementById('saveApiBtn');
const apiStatus = document.getElementById('apiStatus');
const streamToggle = document.getElementById('streamToggle');
const streamStatus = document.getElementById('streamStatus');
streamToggle.addEventListener('change', () => {
  streamStatus.textContent = streamToggle.checked ? '开启' : '关闭';
  localStorage.setItem('streamEnabled', streamToggle.checked ? 'true' : 'false');
});
function loadStreamSetting() {
  const saved = localStorage.getItem('streamEnabled');
  if (saved === 'true') { streamToggle.checked = true; streamStatus.textContent = '开启'; }
  else { streamToggle.checked = false; streamStatus.textContent = '关闭'; }
}
loadStreamSetting();

let currentDialogCharId = null;
let editingCharId = null;
let avatarDataUrl = null;
let detailCharId = null;
let isEditing = false;
let originalName = '';
let originalBio = '';
let originalPrompt = '';

// ===== 微信风格渲染 (4个tab) =====
function renderWechatContent() {
  const container = document.getElementById('wechatTabContent');
  const activeTab = document.querySelector('.wechat-app .tab.active')?.dataset.tab || 'chats';
  document.getElementById('wechatTitle').textContent =
    activeTab === 'chats' ? '聊天' :
    activeTab === 'contacts' ? '通讯录' :
    activeTab === 'moments' ? '动态' : '我的';

  if (activeTab === 'chats') renderChatList(container);
  else if (activeTab === 'contacts') renderContactList(container);
  else if (activeTab === 'moments') renderMoments(container);
  else if (activeTab === 'profile') renderProfile(container);
}

// ===== 聊天列表 =====
function renderChatList(container) {
  const chars = getChars();
  const groups = JSON.parse(localStorage.getItem('groups') || '[]');
  const allItems = [...chars, ...groups.map(g => ({ ...g, isGroup: true }))];
  if (allItems.length === 0) {
    container.innerHTML = `<div class="empty-state">暂无联系人</div>`;
    return;
  }
  let html = `<div style="background:var(--bg);padding:10px 16px;font-size:14px;color:#6a7a8a;">最近聊天</div>`;
  allItems.forEach(c => {
    let name, avatarHtml, id, isGroup = false;
    if (c.isGroup) {
      isGroup = true;
      id = c.id;
      name = c.name;
      avatarHtml = '👥';
    } else {
      id = c.id;
      name = c.name || '未命名';
      avatarHtml = c.avatar ? `<img src="${c.avatar}" />` : '🧑';
    }
    const history = isGroup ? (groupChatHistory[id] || []) : getCharHistory(id);
    const lastMsg = history.length > 0 ? history[history.length-1] : null;
    const preview = lastMsg ? (lastMsg.content || '') : '暂无消息';
    const time = lastMsg ? new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}) : '';
    html += `
      <div class="list-item ${isGroup ? 'group' : ''}" data-id="${id}" data-group="${isGroup ? 'true' : 'false'}">
        <div class="avatar">${avatarHtml}</div>
        <div class="info"><div class="name">${name}</div><div class="preview">${preview}</div></div>
        <div class="time">${time}</div>
      </div>
    `;
  });
  container.innerHTML = html;
  container.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', function() {
      const id = this.dataset.id;
      const isGroup = this.dataset.group === 'true';
      if (isGroup) {
        openGroupChat(id);
      } else {
        const char = getChars().find(c => c.id === id);
        if (char) openDialog(char);
      }
    });
  });
}

// ===== 通讯录 =====
function renderContactList(container) {
  const chars = getChars();
  const groups = JSON.parse(localStorage.getItem('groups') || '[]');
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:10px 16px;border-bottom:1px solid var(--border);">
      <span style="font-size:14px;color:#6a7a8a;">所有角色</span>
      <button id="newContactBtn" style="background:var(--btn);color:#1c1c1e;border:none;border-radius:16px;padding:4px 14px;font-size:14px;cursor:pointer;">+</button>
    </div>
  `;
  groups.forEach(g => {
    html += `
      <div class="list-item group" data-id="${g.id}" data-group="true">
        <div class="avatar">👥</div>
        <div class="info"><div class="name">${g.name}</div><div class="preview">群聊 · ${g.members.length}人</div></div>
      </div>
    `;
  });
  chars.forEach(c => {
    const avatarHtml = c.avatar ? `<img src="${c.avatar}" />` : '🧑';
    const bioDisplay = c.bio || '这个人很懒，什么都没写';
    html += `
      <div class="list-item" data-id="${c.id}">
        <div class="avatar">${avatarHtml}</div>
        <div class="info"><div class="name">${c.name || '未命名'}</div><div class="preview">${bioDisplay}</div></div>
      </div>
    `;
  });
  if (chars.length === 0 && groups.length === 0) {
    html += `<div class="empty-state">暂无联系人</div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', function() {
      const id = this.dataset.id;
      const isGroup = this.dataset.group === 'true';
      if (isGroup) {
        openGroupChat(id);
      } else {
        const char = getChars().find(c => c.id === id);
        if (char) openDialog(char);
      }
    });
  });
  const newBtn = document.getElementById('newContactBtn');
  if (newBtn) {
    newBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const menu = document.getElementById('popupMenu');
      menu.classList.toggle('show');
    });
  }
}

// ===== 朋友圈 =====
let editingMomentIndex = null;

function openEditor(editIndex = null) {
  editingMomentIndex = editIndex;
  const editor = document.getElementById('momentEditor');
  const title = document.getElementById('editorTitle');
  const textarea = document.getElementById('momentText');
  const grid = document.getElementById('imageGrid');

  if (editIndex !== null) {
    title.textContent = '编辑动态';
    const moments = getMoments();
    const m = moments[editIndex];
    textarea.value = m.text || '';
    const images = m.images || [];
    renderImageGrid(grid, images);
  } else {
    title.textContent = '发布动态';
    textarea.value = '';
    renderImageGrid(grid, []);
  }
  editor.classList.add('show');
  textarea.focus();
}

function closeEditor() {
  document.getElementById('momentEditor').classList.remove('show');
  editingMomentIndex = null;
}

function renderImageGrid(container, images) {
  const maxSlots = 9;
  let html = '';
  for (let i = 0; i < maxSlots; i++) {
    if (i < images.length) {
      const img = images[i];
      html += `
        <div class="slot" data-index="${i}">
          <img src="${img}" />
          <span class="remove-btn" data-index="${i}">✕</span>
        </div>
      `;
    } else if (i === images.length && images.length < maxSlots) {
      html += `<div class="slot" id="addImageSlot">+</div>`;
    } else {
      html += `<div class="slot" style="border:none;background:transparent;"></div>`;
    }
  }
  container.innerHTML = html;

  const addSlot = document.getElementById('addImageSlot');
  if (addSlot) {
    addSlot.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
          const dataUrl = ev.target.result;
          let images = [];
          if (editingMomentIndex !== null) {
            const moments = getMoments();
            images = moments[editingMomentIndex].images || [];
          } else {
            const slots = container.querySelectorAll('.slot img');
            slots.forEach(img => { if (img && img.src) images.push(img.src); });
          }
          if (images.length >= 9) { alert('最多添加9张图片'); return; }
          images.push(dataUrl);
          if (editingMomentIndex !== null) {
            const moments = getMoments();
            moments[editingMomentIndex].images = images;
            saveMoments(moments);
          }
          renderImageGrid(container, images);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const idx = parseInt(this.dataset.index);
      let images = [];
      if (editingMomentIndex !== null) {
        const moments = getMoments();
        images = moments[editingMomentIndex].images || [];
        images.splice(idx, 1);
        moments[editingMomentIndex].images = images;
        saveMoments(moments);
      } else {
        const slots = container.querySelectorAll('.slot img');
        const temp = [];
        slots.forEach(img => { if (img && img.src) temp.push(img.src); });
        temp.splice(idx, 1);
        images = temp;
      }
      renderImageGrid(container, images);
    });
  });
}

document.getElementById('publishMomentBtn2').addEventListener('click', function() {
  const text = document.getElementById('momentText').value.trim();
  if (!text) { alert('请输入内容'); return; }
  const grid = document.getElementById('imageGrid');
  const imgElements = grid.querySelectorAll('.slot img');
  const images = [];
  imgElements.forEach(img => { if (img && img.src) images.push(img.src); });

  const moments = getMoments();
  if (editingMomentIndex !== null) {
    moments[editingMomentIndex].text = text;
    moments[editingMomentIndex].images = images;
    saveMoments(moments);
  } else {
    moments.push({
      text: text,
      time: Date.now(),
      images: images,
      likes: 0,
      liked: false,
      likedUsers: [],
      comments: []
    });
    saveMoments(moments);
  }
  closeEditor();
  renderWechatContent();
});

// ===== 渲染动态卡片 =====
function renderMoments(container) {
  const profile = getProfile();
  const moments = getMoments();
  let html = `
    <div class="moments-cover" id="coverUpload">
      ${profile.cover ? `<img src="${profile.cover}" />` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#d5e0ec,#b8cce0);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">点击上传封面</div>'}
      <div class="cover-hint">点击更换封面</div>
    </div>
    <input type="file" id="coverFileInput" accept="image/*" style="display:none;" />
    <div class="moments-profile">
      <div class="avatar">${profile.avatar ? `<img src="${profile.avatar}" />` : '👤'}</div>
      <div class="info"><div class="name">${profile.name}</div><div class="sig">${profile.signature}</div></div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button id="publishMomentBtn" style="background:var(--btn);color:#1c1c1e;border:none;border-radius:16px;padding:6px 16px;font-size:14px;cursor:pointer;">+ 发布动态</button>
    </div>
    <div id="momentsList"></div>
  `;
  container.innerHTML = html;

  document.getElementById('coverUpload').addEventListener('click', () => document.getElementById('coverFileInput').click());
  document.getElementById('coverFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const profile = getProfile();
      profile.cover = ev.target.result;
      saveProfile(profile);
      renderWechatContent();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('publishMomentBtn').addEventListener('click', function() {
    openEditor(null);
  });

  const list = document.getElementById('momentsList');
  const momentsData = getMoments();
  if (momentsData.length === 0) {
    list.innerHTML = `<div class="empty-state">还没有动态，发布一条吧</div>`;
  } else {
    const profile = getProfile();
    let items = '';
    momentsData.slice().reverse().forEach((m, idx) => {
      const realIdx = momentsData.length - 1 - idx;
      const avatarHtml = profile.avatar ? `<img src="${profile.avatar}" />` : '👤';
      const likedClass = m.liked ? 'liked' : '';
      let imagesHtml = '';
      if (m.images && m.images.length > 0) {
        imagesHtml = '<div class="image-grid">';
        m.images.forEach(img => {
          imagesHtml += `<div class="img-slot"><img src="${img}" /></div>`;
        });
        imagesHtml += '</div>';
      }
      const likedUsersHtml = m.likedUsers && m.likedUsers.length > 0 
        ? `<div class="liked-users">${m.likedUsers.map(name => `<span class="name">${name}</span>`).join('、')} 赞了</div>`
        : '';
      
      items += `
        <div class="moment-card">
          <div class="header">
            <div class="avatar">${avatarHtml}</div>
            <span class="name">${profile.name}</span>
            <span class="time">${new Date(m.time).toLocaleString('zh-CN', {hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'})}</span>
          </div>
          <div class="content">${m.text}</div>
          ${imagesHtml}
          <div class="actions">
            <span class="action-icon ${likedClass}" data-idx="${realIdx}" data-action="like">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#C5C8F0" fill="none" stroke-width="2"/>
              </svg>
              <span>${m.liked ? '取消赞' : '赞'}</span>
            </span>
            <span class="action-icon" data-idx="${realIdx}" data-action="comment">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="#C5C8F0" fill="none" stroke-width="2"/>
              </svg>
              <span>评论</span>
            </span>
            <span class="action-icon" data-idx="${realIdx}" data-action="edit">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="#C5C8F0" fill="none" stroke-width="2"/>
              </svg>
              <span>编辑</span>
            </span>
            <span class="action-icon" data-idx="${realIdx}" data-action="delete">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#C5C8F0" fill="none" stroke-width="2"/>
              </svg>
              <span>删除</span>
            </span>
          </div>
          ${likedUsersHtml}
          ${m.comments && m.comments.length > 0 ? `<div class="comments">${m.comments.map(c => `<div class="comment"><span class="name">${c.name || '我'}</span>：${c.text}</div>`).join('')}</div>` : ''}
        </div>
      `;
    });
    list.innerHTML = items;

    list.querySelectorAll('.action-icon').forEach(el => {
      el.addEventListener('click', function(e) {
        const idx = parseInt(this.dataset.idx);
        const action = this.dataset.action;
        const moments = getMoments();

        if (action === 'like') {
          const profile = getProfile();
          moments[idx].liked = !moments[idx].liked;
          if (!moments[idx].likedUsers) moments[idx].likedUsers = [];
          if (moments[idx].liked) {
            if (!moments[idx].likedUsers.includes(profile.name)) {
              moments[idx].likedUsers.push(profile.name);
            }
          } else {
            moments[idx].likedUsers = moments[idx].likedUsers.filter(n => n !== profile.name);
          }
          saveMoments(moments);
          renderWechatContent();
        } else if (action === 'comment') {
          const commentText = prompt('输入评论：');
          if (commentText && commentText.trim() !== '') {
            const profile = getProfile();
            if (!moments[idx].comments) moments[idx].comments = [];
            moments[idx].comments.push({ name: profile.name, text: commentText.trim() });
            saveMoments(moments);
            renderWechatContent();
          }
        } else if (action === 'edit') {
          openEditor(idx);
        } else if (action === 'delete') {
          if (confirm('确定删除这条动态吗？')) {
            moments.splice(idx, 1);
            saveMoments(moments);
            renderWechatContent();
          }
        }
      });
    });
  }
}

// ===== 我的（个人主页） =====
function renderProfile(container) {
  const profile = getProfile();
  container.innerHTML = `
    <div style="padding:20px 16px;background:var(--bg);flex:1;display:flex;flex-direction:column;align-items:center;">
      <div class="avatar-large" style="width:100px;height:100px;border-radius:50%;background:#e5e5ea;display:flex;align-items:center;justify-content:center;font-size:48px;overflow:hidden;border:2px solid var(--border);margin-bottom:16px;">
        ${profile.avatar ? `<img src="${profile.avatar}" />` : '👤'}
      </div>
      <div style="font-size:20px;font-weight:600;color:#1c1c1e;margin-bottom:4px;">${profile.name}</div>
      <div style="font-size:14px;color:#6a7a8a;margin-bottom:8px;">${profile.signature}</div>
      ${profile.persona ? `<div style="font-size:14px;color:#3a3a3c;background:var(--card-bg);padding:8px 12px;border-radius:8px;width:100%;text-align:center;margin-bottom:12px;">🧠 ${profile.persona}</div>` : ''}
      <button id="editProfileBtn" style="background:var(--btn);color:#1c1c1e;border:none;padding:10px 24px;border-radius:20px;font-size:16px;font-weight:600;cursor:pointer;">编辑资料</button>
    </div>
  `;
  document.getElementById('editProfileBtn').addEventListener('click', function() {
    const profile = getProfile();
    document.getElementById('profileEditAvatar').innerHTML = profile.avatar ? `<img src="${profile.avatar}" />` : '👤';
    document.getElementById('profileEditName').value = profile.name;
    document.getElementById('profileEditSig').value = profile.signature;
    document.getElementById('profileEditPersona').value = profile.persona || '';
    showPage('profileEditPage');
  });
}

// ===== 个人资料编辑页 =====
document.getElementById('profileEditAvatar').addEventListener('click', function() {
  document.getElementById('profileEditAvatarInput').click();
});
document.getElementById('profileEditAvatarInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const dataUrl = ev.target.result;
    const profile = getProfile();
    profile.avatar = dataUrl;
    saveProfile(profile);
    document.getElementById('profileEditAvatar').innerHTML = `<img src="${dataUrl}" />`;
  };
  reader.readAsDataURL(file);
});
document.getElementById('profileEditSaveBtn').addEventListener('click', function() {
  const name = document.getElementById('profileEditName').value.trim() || '我';
  const sig = document.getElementById('profileEditSig').value.trim() || '这个人很懒，什么都没写';
  const persona = document.getElementById('profileEditPersona').value.trim();
  const profile = getProfile();
  profile.name = name;
  profile.signature = sig;
  profile.persona = persona;
  saveProfile(profile);
  alert('✅ 保存成功！');
  renderWechatContent();
  showWechat('profile');
});

// ===== 单聊功能 =====
function openDialog(char) {
  currentDialogCharId = char.id;
  document.getElementById('dialogAvatar').innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  document.getElementById('dialogName').textContent = char.name || '未命名';
  document.getElementById('dialogModel').textContent = '模型: ' + (modelSelect.value || '未选择');
  updateDialogPrompt();
  renderDialogMessages();
  document.getElementById('chatDialogPage').classList.add('active');
  document.getElementById('chatDialogPage').dataset.groupId = '';
}
function updateDialogPrompt() {
  if (!currentDialogCharId) { document.getElementById('dialogPromptBox').innerHTML = ''; return; }
  const chars = getChars();
  const char = chars.find(c => c.id === currentDialogCharId);
  if (char && char.prompt) {
    document.getElementById('dialogPromptBox').innerHTML = `<div><span class="label">📋 人设：</span>${char.prompt}</div>`;
  } else {
    document.getElementById('dialogPromptBox').innerHTML = `<div style="color:#6a7a8a;">⚠️ 未设置人设</div>`;
  }
}
document.getElementById('dialogAvatar').addEventListener('click', () => {
  document.getElementById('dialogPromptBox').classList.toggle('show');
});
function renderDialogMessages() {
  const container = document.getElementById('dialogMessages');
  if (!currentDialogCharId) { container.innerHTML = ''; return; }
  const history = getCharHistory(currentDialogCharId);
  if (history.length === 0) {
    container.innerHTML = `<div style="color:#6a7a8a;text-align:center;padding:40px 0;font-size:16px;">开始对话吧 💬</div>`;
    return;
  }
  let html = '';
  history.forEach(msg => {
    const t = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
    html += `<div class="message ${msg.role}">${msg.content}<div class="msg-time">${t}</div></div>`;
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}
function addDialogMessage(role, content) {
  if (!currentDialogCharId) return;
  const history = getCharHistory(currentDialogCharId);
  history.push({ role, content });
  saveCharHistory(currentDialogCharId, history);
  renderDialogMessages();
  renderWechatContent();
}
function clearDialogHistory() {
  if (!currentDialogCharId) return;
  const history = getCharHistory(currentDialogCharId);
  if (history.length > 0 && !confirm('确定清空该角色的聊天记录吗？')) return;
  saveCharHistory(currentDialogCharId, []);
  renderDialogMessages();
  renderWechatContent();
}
document.getElementById('backFromDialog').addEventListener('click', function() {
  document.getElementById('chatDialogPage').classList.remove('active');
  document.getElementById('chatDialogPage').dataset.groupId = '';
  renderWechatContent();
});
document.getElementById('dialogNewBtn').addEventListener('click', clearDialogHistory);

// ===== 发送消息（仅记录，不触发AI） =====
document.getElementById('dialogSendBtn').addEventListener('click', function() {
  const msg = document.getElementById('dialogInput').value.trim();
  if (!msg) return;
  const groupId = document.getElementById('chatDialogPage').dataset.groupId;
  if (groupId) {
    if (!groupChatHistory[groupId]) groupChatHistory[groupId] = [];
    groupChatHistory[groupId].push({ content: msg, isUser: true, senderName: '我' });
    document.getElementById('dialogInput').value = '';
    document.getElementById('dialogInput').style.height = 'auto';
    renderGroupMessages();
  } else {
    if (!currentDialogCharId) { alert('没有选中的角色'); return; }
    const history = getCharHistory(currentDialogCharId);
    history.push({ role: 'user', content: msg });
    saveCharHistory(currentDialogCharId, history);
    document.getElementById('dialogInput').value = '';
    document.getElementById('dialogInput').style.height = 'auto';
    renderDialogMessages();
  }
});

// ===== 分句函数 =====
function splitSentences(text) {
  const parts = text.split(/([。！？；\n]+)/);
  let sentences = [];
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = (parts[i] || '') + (parts[i+1] || '');
    if (sentence.trim()) sentences.push(sentence.trim());
  }
  if (sentences.length === 0) sentences = [text];
  return sentences;
}

// ===== 箭头按钮触发AI =====
document.getElementById('dialogArrowBtn').addEventListener('click', function() {
  const groupId = document.getElementById('chatDialogPage').dataset.groupId;
  if (groupId) {
    sendGroupMessages(groupId);
  } else {
    sendSingleMessages();
  }
});

// ===== 单聊批量发送 =====
async function sendSingleMessages() {
  const base = apiBase.value.trim(), key = apiKey.value.trim(), model = modelSelect.value;
  if (!base || !key) { alert('请先设置 API'); showPage('apiSettingsPage'); return; }
  if (!model) { alert('请先选择模型'); return; }
  if (!currentDialogCharId) { alert('没有选中的角色'); return; }
  const chars = getChars();
  const char = chars.find(c => c.id === currentDialogCharId);
  if (!char) { alert('角色不存在'); return; }

  let history = getCharHistory(currentDialogCharId);
  let lastAssistantIdx = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant' && history[i].content !== '🤔 思考中...') {
      lastAssistantIdx = i;
      break;
    }
  }
  const pendingMessages = history.slice(lastAssistantIdx + 1).filter(m => m.role === 'user');
  if (pendingMessages.length === 0) {
    alert('没有待回复的消息');
    return;
  }

  const messages = [];
  const profile = getProfile();
  if (profile.persona) messages.push({ role: 'system', content: '用户人设：' + profile.persona });
  if (char.prompt) messages.push({ role: 'system', content: char.prompt });
  const filtered = history.filter(m => m.content !== '🤔 思考中...');
  messages.push(...filtered);
  messages.push({ role: 'system', content: '请根据对话内容，生成多条独立的回复（每条用[SEP]分隔），数量由你决定，但不要超过5条。每条回复要完整、连贯。' });

  history.push({ role: 'assistant', content: '🤔 思考中...' });
  saveCharHistory(currentDialogCharId, history);
  renderDialogMessages();

  try {
    const res = await fetch('/api/batch-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl: base, apiKey: key, model, messages })
    });
    const data = await res.json();
    let h = getCharHistory(currentDialogCharId);
    if (h.length > 0 && h[h.length-1].content === '🤔 思考中...') {
      h.pop();
      saveCharHistory(currentDialogCharId, h);
    }
    if (data.replies && data.replies.length > 0) {
      data.replies.forEach(reply => {
        const sentences = splitSentences(reply);
        sentences.forEach(s => addDialogMessage('assistant', s));
      });
    } else if (data.reply) {
      const sentences = splitSentences(data.reply);
      sentences.forEach(s => addDialogMessage('assistant', s));
    } else {
      addDialogMessage('assistant', '❌ 无回复');
    }
  } catch (e) {
    let h = getCharHistory(currentDialogCharId);
    if (h.length > 0 && h[h.length-1].content === '🤔 思考中...') {
      h.pop();
      saveCharHistory(currentDialogCharId, h);
    }
    addDialogMessage('assistant', '❌ 出错：' + e.message);
  }
}

// ===== 群聊功能 =====
let groupChatHistory = {};
let currentGroupId = null;

function openGroupChat(groupId) {
  currentGroupId = groupId;
  const groups = JSON.parse(localStorage.getItem('groups') || '[]');
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  document.getElementById('dialogAvatar').innerHTML = '👥';
  document.getElementById('dialogName').textContent = group.name;
  document.getElementById('dialogModel').textContent = '群聊';
  document.getElementById('dialogPromptBox').innerHTML = '';
  if (!groupChatHistory[groupId]) groupChatHistory[groupId] = [];
  renderGroupMessages();
  document.getElementById('chatDialogPage').classList.add('active');
  document.getElementById('chatDialogPage').dataset.groupId = groupId;
}

function renderGroupMessages() {
  const container = document.getElementById('dialogMessages');
  const history = groupChatHistory[currentGroupId] || [];
  if (history.length === 0) {
    container.innerHTML = `<div style="color:#6a7a8a;text-align:center;padding:40px 0;font-size:16px;">群聊开始 💬</div>`;
    return;
  }
  let html = '';
  history.forEach(msg => {
    const sender = msg.senderName || '用户';
    const avatarHtml = msg.senderAvatar ? `<img src="${msg.senderAvatar}" />` : (msg.isUser ? '👤' : '🧑');
    const time = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
    html += `
      <div class="message ${msg.isUser ? 'user' : 'assistant'}">
        ${!msg.isUser ? `<div class="sender">${sender}</div>` : ''}
        ${msg.content}
        <div class="msg-time">${time}</div>
      </div>
    `;
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

async function sendGroupMessages(groupId) {
  const base = apiBase.value.trim(), key = apiKey.value.trim(), model = modelSelect.value;
  if (!base || !key) { alert('请先设置 API'); showPage('apiSettingsPage'); return; }
  if (!model) { alert('请先选择模型'); return; }
  const groups = JSON.parse(localStorage.getItem('groups') || '[]');
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  const members = group.members;
  const chars = getChars();
  const memberChars = members.map(id => chars.find(c => c.id === id)).filter(Boolean);
  if (memberChars.length === 0) { alert('群聊成员不存在'); return; }

  if (!groupChatHistory[groupId]) groupChatHistory[groupId] = [];
  let history = groupChatHistory[groupId];
  let lastAssistantIdx = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (!history[i].isUser) {
      lastAssistantIdx = i;
      break;
    }
  }
  const pending = history.slice(lastAssistantIdx + 1).filter(m => m.isUser);
  if (pending.length === 0) {
    alert('没有待回复的消息');
    return;
  }

  const thinkingMsgs = memberChars.map(c => ({
    content: '🤔 思考中...',
    isUser: false,
    senderName: c.name,
    senderAvatar: c.avatar
  }));
  history.push(...thinkingMsgs);
  renderGroupMessages();

  const promises = memberChars.map(async (c) => {
    const messages = [];
    const profile = getProfile();
    if (profile.persona) messages.push({ role: 'system', content: '用户人设：' + profile.persona });
    if (c.prompt) messages.push({ role: 'system', content: c.prompt });
    const convHistory = history.filter(m => m.senderName === '我' || m.senderName === c.name);
    convHistory.forEach(m => {
      messages.push({ role: m.isUser ? 'user' : 'assistant', content: m.content });
    });
    pending.forEach(m => messages.push({ role: 'user', content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', baseUrl: base, apiKey: key, model, messages, stream: false })
      });
      const data = await res.json();
      return { char: c, reply: data.reply || '无回复' };
    } catch (e) {
      return { char: c, reply: '出错：' + e.message };
    }
  });

  const results = await Promise.all(promises);
  const newHistory = history.filter(m => m.content !== '🤔 思考中...');
  groupChatHistory[groupId] = newHistory;
  results.forEach(r => {
    const sentences = splitSentences(r.reply);
    sentences.forEach(s => {
      newHistory.push({
        content: s,
        isUser: false,
        senderName: r.char.name,
        senderAvatar: r.char.avatar
      });
    });
  });
  renderGroupMessages();
}

// ===== 通讯录弹出菜单 =====
document.getElementById('menuAddFriend').addEventListener('click', function() {
  document.getElementById('popupMenu').classList.remove('show');
  editingCharId = null;
  document.getElementById('createCharTitle').textContent = '新建 Char';
  document.getElementById('charNameInput').value = '';
  document.getElementById('charBioInput').value = '';
  document.getElementById('charPromptInput').value = '';
  document.getElementById('charAvatarPreview').innerHTML = '🧑';
  document.getElementById('charAvatarPreview').querySelector('img')?.remove();
  avatarDataUrl = null;
  document.getElementById('createCharStatus').textContent = '';
  showPage('createCharPage');
});

document.getElementById('menuCreateGroup').addEventListener('click', function() {
  document.getElementById('popupMenu').classList.remove('show');
  openGroupSelector();
});

function openGroupSelector() {
  const chars = getChars();
  const container = document.getElementById('memberList');
  container.innerHTML = '';
  chars.forEach(c => {
    const div = document.createElement('div');
    div.className = 'item';
    const avatarHtml = c.avatar ? `<img src="${c.avatar}" />` : '🧑';
    div.innerHTML = `
      <input type="checkbox" value="${c.id}" />
      <div class="avatar">${avatarHtml}</div>
      <span>${c.name}</span>
    `;
    container.appendChild(div);
  });
  if (chars.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#8a9aa8;">暂无好友，请先添加</div>';
  }
  document.getElementById('groupMemberSelector').classList.add('show');
}

document.getElementById('groupCancelBtn').addEventListener('click', function() {
  document.getElementById('groupMemberSelector').classList.remove('show');
});

document.getElementById('groupConfirmBtn').addEventListener('click', function() {
  const checked = document.querySelectorAll('#memberList input[type="checkbox"]:checked');
  if (checked.length < 2) {
    alert('请至少选择两位成员');
    return;
  }
  const memberIds = Array.from(checked).map(cb => cb.value);
  const chars = getChars();
  const names = memberIds.map(id => chars.find(c => c.id === id)?.name || '未知').join('、');
  const group = {
    id: 'group_' + Date.now(),
    name: names,
    members: memberIds,
    isGroup: true,
    created: Date.now()
  };
  let groups = JSON.parse(localStorage.getItem('groups') || '[]');
  groups.push(group);
  localStorage.setItem('groups', JSON.stringify(groups));
  document.getElementById('groupMemberSelector').classList.remove('show');
  renderWechatContent();
});

// ===== 角色详情（含头像编辑） =====
function openContactDetail(charId) {
  detailCharId = charId;
  const chars = getChars();
  const char = chars.find(c => c.id === charId);
  if (!char) return;
  document.getElementById('detailAvatar').innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  document.getElementById('detailNameDisplay').textContent = char.name || '未命名';
  document.getElementById('detailBioDisplay').textContent = char.bio || '未设置';
  document.getElementById('detailPromptDisplay').textContent = char.prompt || '未设置';
  document.getElementById('detailAvatarEdit').innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  document.getElementById('detailNameInput').value = char.name || '';
  document.getElementById('detailBioInput').value = char.bio || '';
  document.getElementById('detailPromptInput').value = char.prompt || '';
  originalName = char.name || '';
  originalBio = char.bio || '';
  originalPrompt = char.prompt || '';
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('editMode').style.display = 'none';
  isEditing = false;
  document.getElementById('detailStatus').textContent = '';
  document.getElementById('contactDetailTitle').textContent = '角色详情';
  document.getElementById('avatarHint').textContent = '点击修改进入编辑';
  showPage('contactDetailPage');
}

document.getElementById('detailAvatar').addEventListener('click', function() {
  if (!isEditing) {
    alert('请先点击"修改"进入编辑模式');
    return;
  }
  if (!detailCharId) return;
  document.getElementById('detailAvatarInput').click();
});
document.getElementById('detailAvatarInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file || !detailCharId) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const dataUrl = ev.target.result;
    let chars = getChars();
    const idx = chars.findIndex(c => c.id === detailCharId);
    if (idx !== -1) {
      chars[idx].avatar = dataUrl;
      saveChars(chars);
      document.getElementById('detailAvatar').innerHTML = `<img src="${dataUrl}" />`;
      document.getElementById('detailAvatarEdit').innerHTML = `<img src="${dataUrl}" />`;
    }
  };
  reader.readAsDataURL(file);
});

document.getElementById('detailEditBtn').addEventListener('click', () => {
  if (!detailCharId) return;
  document.getElementById('viewMode').style.display = 'none';
  document.getElementById('editMode').style.display = 'block';
  isEditing = true;
  document.getElementById('avatarHint').textContent = '点击头像更换';
  const chars = getChars();
  const char = chars.find(c => c.id === detailCharId);
  if (char) {
    document.getElementById('detailNameInput').value = char.name || '';
    document.getElementById('detailBioInput').value = char.bio || '';
    document.getElementById('detailPromptInput').value = char.prompt || '';
    originalName = char.name || '';
    originalBio = char.bio || '';
    originalPrompt = char.prompt || '';
    document.getElementById('detailAvatarEdit').innerHTML = char.avatar ? `<img src="${char.avatar}" />` : '🧑';
  }
  document.getElementById('detailStatus').textContent = '';
});
document.getElementById('detailSaveBtn').addEventListener('click', () => {
  if (!detailCharId) return;
  const newName = document.getElementById('detailNameInput').value.trim();
  const newBio = document.getElementById('detailBioInput').value.trim();
  const newPrompt = document.getElementById('detailPromptInput').value.trim();
  if (!newName) { document.getElementById('detailStatus').textContent = '❌ 名字不能为空'; return; }
  let chars = getChars();
  const idx = chars.findIndex(c => c.id === detailCharId);
  if (idx !== -1) {
    chars[idx].name = newName;
    chars[idx].bio = newBio;
    chars[idx].prompt = newPrompt;
    saveChars(chars);
    document.getElementById('detailNameDisplay').textContent = newName;
    document.getElementById('detailBioDisplay').textContent = newBio || '未设置';
    document.getElementById('detailPromptDisplay').textContent = newPrompt || '未设置';
    originalName = newName; originalBio = newBio; originalPrompt = newPrompt;
    document.getElementById('detailStatus').textContent = '✅ 保存成功！';
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    isEditing = false;
    document.getElementById('avatarHint').textContent = '点击修改进入编辑';
    renderWechatContent();
    setTimeout(() => { document.getElementById('detailStatus').textContent = ''; }, 2000);
  }
});
document.getElementById('detailCancelBtn').addEventListener('click', () => {
  if (!detailCharId) return;
  document.getElementById('detailNameInput').value = originalName;
  document.getElementById('detailBioInput').value = originalBio;
  document.getElementById('detailPromptInput').value = originalPrompt;
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('editMode').style.display = 'none';
  isEditing = false;
  document.getElementById('avatarHint').textContent = '点击修改进入编辑';
  document.getElementById('detailStatus').textContent = '';
});
document.getElementById('detailDeleteBtn').addEventListener('click', () => {
  if (!detailCharId) return;
  if (!confirm('确定删除这个角色吗？')) return;
  let chars = getChars();
  chars = chars.filter(c => c.id !== detailCharId);
  saveChars(chars);
  localStorage.removeItem('charHistory_' + detailCharId);
  if (currentDialogCharId === detailCharId) currentDialogCharId = null;
  renderWechatContent();
  showWechat('contacts');
});

// ===== 创建角色 =====
document.getElementById('avatarUploadBtn').addEventListener('click', () => document.getElementById('charAvatarInput').click());
document.getElementById('charAvatarInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    avatarDataUrl = ev.target.result;
    document.getElementById('charAvatarPreview').innerHTML = `<img src="${avatarDataUrl}" />`;
  };
  reader.readAsDataURL(file);
});
document.getElementById('saveCharBtn').addEventListener('click', () => {
  const name = document.getElementById('charNameInput').value.trim();
  const bio = document.getElementById('charBioInput').value.trim();
  const prompt = document.getElementById('charPromptInput').value.trim();
  if (!name) { document.getElementById('createCharStatus').textContent = '❌ 请填写名字'; return; }
  if (!prompt) { document.getElementById('createCharStatus').textContent = '❌ 请填写人设'; return; }
  let chars = getChars();
  if (editingCharId) {
    const idx = chars.findIndex(c => c.id === editingCharId);
    if (idx !== -1) { chars[idx].name = name; chars[idx].bio = bio; chars[idx].prompt = prompt; if (avatarDataUrl) chars[idx].avatar = avatarDataUrl; }
  } else {
    chars.push({ id: 'char_' + Date.now(), name, bio, prompt, avatar: avatarDataUrl || null, created: Date.now() });
  }
  saveChars(chars);
  document.getElementById('createCharStatus').textContent = '✅ 保存成功！';
  setTimeout(() => { renderWechatContent(); showWechat('contacts'); }, 500);
});

// ===== 设置 & 模型 =====
function loadSettings() {
  const savedBase = localStorage.getItem('apiBase');
  const savedKey = localStorage.getItem('apiKey');
  const savedModel = localStorage.getItem('selectedModel');
  if (savedBase) apiBase.value = savedBase;
  if (savedKey) apiKey.value = savedKey;
  if (savedModel) window._savedModel = savedModel;
}
function saveSettings(includeModel) {
  localStorage.setItem('apiBase', apiBase.value.trim());
  localStorage.setItem('apiKey', apiKey.value.trim());
  if (includeModel && modelSelect.value) localStorage.setItem('selectedModel', modelSelect.value);
  apiStatus.textContent = '✅ 已保存';
  setTimeout(() => { if (apiStatus.textContent === '✅ 已保存') apiStatus.textContent = '就绪'; }, 2000);
}
loadSettings();

fetchModelsBtn.addEventListener('click', async () => {
  const base = apiBase.value.trim(), key = apiKey.value.trim();
  if (!base || !key) { apiStatus.textContent = '❌ 请填写地址和Key'; return; }
  saveSettings(false);
  apiStatus.textContent = '📥 拉取中...';
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'models', baseUrl: base, apiKey: key })
    });
    const data = await res.json();
    if (data.models) {
      modelSelect.innerHTML = '<option value="">请选择</option>';
      data.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id || m;
        opt.textContent = m.id || m;
        modelSelect.appendChild(opt);
      });
      apiStatus.textContent = `✅ 成功拉取 ${data.models.length} 个模型`;
      const savedModel = localStorage.getItem('selectedModel');
      if (savedModel && [...modelSelect.options].some(opt => opt.value === savedModel)) {
        modelSelect.value = savedModel;
      }
    } else {
      apiStatus.textContent = '❌ 拉取失败：' + (data.error || '未知错误');
    }
  } catch (e) {
    apiStatus.textContent = '❌ 请求失败：' + e.message;
  }
});
saveApiBtn.addEventListener('click', () => { saveSettings(true); });
modelSelect.addEventListener('change', () => {
  if (modelSelect.value) localStorage.setItem('selectedModel', modelSelect.value);
});

// ===== 小说 =====
document.getElementById('importNovelBtn').addEventListener('click', () => document.getElementById('novelFileInput').click());
document.getElementById('novelFileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('novelContent').textContent = ev.target.result;
  };
  reader.readAsText(file, 'UTF-8');
});

// ===== 音乐 =====
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const musicInfo = document.getElementById('musicInfo');
document.getElementById('importMusicBtn').addEventListener('click', () => document.getElementById('musicFileInput').click());
document.getElementById('musicFileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  audioPlayer.src = url;
  audioPlayer.load();
  musicInfo.textContent = `已加载: ${file.name}`;
  playPauseBtn.textContent = '▶️ 播放';
});
playPauseBtn.addEventListener('click', function() {
  if (!audioPlayer.src) { alert('请先导入 MP3 文件'); return; }
  if (audioPlayer.paused) {
    audioPlayer.play().catch(err => alert('播放失败：' + err.message));
    this.textContent = '⏸ 暂停';
  } else {
    audioPlayer.pause();
    this.textContent = '▶️ 播放';
  }
});
audioPlayer.addEventListener('ended', function() {
  playPauseBtn.textContent = '▶️ 播放';
  this.currentTime = 0;
});

// ===== 初始化 =====
window.addEventListener('load', async () => {
  document.documentElement.style.backgroundColor = '#F0F4FA';
  document.documentElement.style.colorScheme = 'light';
  document.body.style.backgroundColor = '#F0F4FA';
  applyFullscreen();

  const versionEl = document.getElementById('versionInfo');
  if (versionEl) {
    const lastMod = new Date(document.lastModified);
    versionEl.textContent = 'v1.0.0 · ' + lastMod.toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
  }

  const savedBase = localStorage.getItem('apiBase');
  const savedKey = localStorage.getItem('apiKey');
  const savedModel = localStorage.getItem('selectedModel');
  if (savedBase) apiBase.value = savedBase;
  if (savedKey) apiKey.value = savedKey;
  if (savedModel) {
    if (savedBase && savedKey) {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'models', baseUrl: savedBase, apiKey: savedKey })
        });
        const data = await res.json();
        if (data.models) {
          modelSelect.innerHTML = '<option value="">请选择</option>';
          data.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id || m;
            opt.textContent = m.id || m;
            modelSelect.appendChild(opt);
          });
          if ([...modelSelect.options].some(opt => opt.value === savedModel)) {
            modelSelect.value = savedModel;
            localStorage.setItem('selectedModel', savedModel);
          }
          apiStatus.textContent = `✅ 自动拉取 ${data.models.length} 个模型`;
          setTimeout(() => { if (apiStatus.textContent.includes('自动拉取')) apiStatus.textContent = '就绪'; }, 3000);
        }
      } catch (e) { console.log('自动拉取失败'); }
    }
  }
  showPage('homePage');
});

// ===== 点击其他地方关闭弹出菜单 =====
document.addEventListener('click', function(e) {
  const menu = document.getElementById('popupMenu');
  if (!menu.contains(e.target) && e.target.id !== 'newContactBtn') {
    menu.classList.remove('show');
  }
});