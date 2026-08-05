// ===== modules/char.js =====
import { getChars, saveChars } from './utils.js';

let dom = {};
let editingCharId = null;
let avatarDataUrl = null;

export function initChar(d) {
  dom = d;
  bindEvents();
}

function bindEvents() {
  dom.avatarUploadBtn.addEventListener('click', () => dom.charAvatarInput.click());
  dom.charAvatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      avatarDataUrl = ev.target.result;
      dom.charAvatarPreview.innerHTML = `<img src="${avatarDataUrl}" />`;
    };
    reader.readAsDataURL(file);
  });

  dom.saveCharBtn.addEventListener('click', () => {
    const name = dom.charNameInput.value.trim();
    const prompt = dom.charPromptInput.value.trim();
    if (!name) { dom.createCharStatus.textContent = '❌ 请填写名字'; return; }
    if (!prompt) { dom.createCharStatus.textContent = '❌ 请填写人设'; return; }
    let chars = getChars();
    if (editingCharId) {
      const idx = chars.findIndex(c => c.id === editingCharId);
      if (idx !== -1) {
        chars[idx].name = name;
        chars[idx].prompt = prompt;
        if (avatarDataUrl) chars[idx].avatar = avatarDataUrl;
      }
    } else {
      chars.push({ id: 'char_' + Date.now(), name, prompt, avatar: avatarDataUrl || null, created: Date.now() });
    }
    saveChars(chars);
    dom.createCharStatus.textContent = '✅ 保存成功！';
    setTimeout(() => {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.wechat-app').forEach(w => w.classList.add('active'));
      if (window.renderWechatContent) window.renderWechatContent();
    }, 500);
  });
}

export function openCreateChar() {
  editingCharId = null;
  dom.createCharTitle.textContent = '新建 Char';
  dom.charNameInput.value = '';
  dom.charPromptInput.value = '';
  dom.charAvatarPreview.innerHTML = '🧑';
  dom.charAvatarPreview.querySelector('img')?.remove();
  avatarDataUrl = null;
  dom.createCharStatus.textContent = '';
}