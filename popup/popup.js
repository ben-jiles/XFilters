// popup/popup.js
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const rulesList = $('#rules-list');
const emptyState = $('#empty-state');
const modal = $('#modal');
const modalTitle = $('#modal-title');
const modalTitleInput = $('#modal-title-input');
const modalRegex = $('#modal-regex');
const modalTimeStart = $('#modal-time-start');
const modalTimeEnd = $('#modal-time-end');
const modalUser = $('#modal-user');
const modalAction = $('#modal-action');  // NEW: Action dropdown
const modalSave = $('#modal-save');
const modalCancel = $('#modal-cancel');

let rules = [];
let editingId = null;

// Load rules
chrome.storage.sync.get(['rules'], data => {
  rules = data.rules || [];
  renderRules();
});

// Render all rules
function renderRules() {
  rulesList.innerHTML = '';
  if (rules.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  rules.forEach(rule => {
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.innerHTML = `
      <div class="rule-header">
        <input type="checkbox" class="rule-enabled" ${rule.enabled ? 'checked' : ''} data-id="${rule.id}">
        <strong>${escapeHtml(rule.title || `Rule ${rule.id}`)}</strong>
      </div>
      <div class="rule-regex">${escapeHtml(rule.regex)}</div>
      ${rule.timeStart && rule.timeEnd 
        ? `<div class="rule-time">Only ${formatDateTime(rule.timeStart)} – ${formatDateTime(rule.timeEnd)}</div>` 
        : ''
      }
      ${rule.user 
        ? `<div class="rule-user">Only from ${escapeHtml(rule.user)}</div>` 
        : ''
      }
      ${rule.action 
        ? `<div class="rule-action">${rule.action === 'blur' ? 'Blur' : rule.action === 'highlight' ? 'Highlight' : 'Hide'}</div>` 
        : ''
      }
      <div class="rule-actions">
        <button data-id="${rule.id}" title="Edit">Edit</button>
        <button data-id="${rule.id}" title="Delete">Delete</button>
      </div>
    `;
    rulesList.appendChild(div);
  });

  // Toggle enabled
  $$('.rule-enabled').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      const rule = rules.find(r => r.id == id);
      if (rule) {
        rule.enabled = cb.checked;
        saveAndApply();
      }
    });
  });

  // Edit / Delete
  $$('.rule-actions button').forEach(btn => {
    const id = btn.dataset.id;
    if (btn.textContent === 'Edit') {
      btn.addEventListener('click', () => openEdit(id));
    } else {
      btn.addEventListener('click', () => {
        if (confirm('Delete this rule?')) {
          rules = rules.filter(r => r.id != id);
          saveAndApply();
        }
      });
    }
  });
}

// Add Rule
$('#add-rule').addEventListener('click', () => openEdit(null));

// Edit or Add
function openEdit(id) {
  editingId = id;
  if (id) {
    const rule = rules.find(r => r.id == id);
    modalTitle.textContent = 'Edit Rule';
    modalTitleInput.value = rule.title || '';
    modalRegex.value = rule.regex;
    modalTimeStart.value = rule.timeStart ? rule.timeStart.slice(0, 16) : '';
    modalTimeEnd.value = rule.timeEnd ? rule.timeEnd.slice(0, 16) : '';
    modalUser.value = rule.user || '';
    modalAction.value = rule.action || 'hide';  // Load action
  } else {
    modalTitle.textContent = 'Add Rule';
    modalTitleInput.value = '';
    modalRegex.value = '';
    modalTimeStart.value = '';
    modalTimeEnd.value = '';
    modalUser.value = '';
    modalAction.value = 'hide';  // Default
  }
  modal.classList.add('active');
}

// Close modal
modalCancel.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

// Save rule
modalSave.addEventListener('click', () => {
  const title = modalTitleInput.value.trim();
  const regex = modalRegex.value.trim();
  const start = modalTimeStart.value;
  const end = modalTimeEnd.value;
  const user = modalUser.value.trim();
  const action = modalAction.value;  // Get action

  if (!regex) return alert('Regex is required');
  try { new RegExp(regex, 'i'); }
  catch (e) { return alert('Invalid regex: ' + e.message); }

  const timeStart = start ? new Date(start + ':00').toISOString() : null;
  const timeEnd = end ? new Date(end + ':00').toISOString() : null;

  if (editingId) {
    const rule = rules.find(r => r.id == editingId);
    if (rule) {
      rule.title = title || null;
      rule.regex = regex;
      rule.timeStart = timeStart;
      rule.timeEnd = timeEnd;
      rule.user = user || null;
      rule.action = action;  // Save action
    }
  } else {
    const newId = rules.length ? Math.max(...rules.map(r => r.id)) + 1 : 1;
    rules.push({
      id: newId,
      title: title || null,
      regex,
      enabled: true,
      timeStart,
      timeEnd,
      user: user || null,
      action: action  // Save action
    });
  }

  modal.classList.remove('active');
  saveAndApply();
});

// Save & apply to content script
function saveAndApply() {
  chrome.storage.sync.set({ rules }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'RULES_UPDATED', rules });
      }
    });
    renderRules();
  });
}

// Export
$('#export').addEventListener('click', () => {
  const data = JSON.stringify(rules, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'xfilters-rules.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Import
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (Array.isArray(imported)) {
        rules = imported.map((r, i) => ({
          id: i + 1,
          title: r.title || null,
          regex: r.regex || '',
          enabled: r.enabled !== false,
          timeStart: r.timeStart || null,
          timeEnd: r.timeEnd || null,
          user: r.user || null,
          action: r.action || 'hide'  // Default action
        }));
        saveAndApply();
      }
    } catch (e) { alert('Invalid JSON'); }
  };
  reader.readAsText(file);
});

// === LOAD PROFANITY PRESET (10 WORDS) ===
$('#load-profanity').addEventListener('click', () => {
  const profanityRule = {
    id: rules.length ? Math.max(...rules.map(r => r.id)) + 1 : 1,
    title: 'Profanity Filter',
    regex: '\\b(fuck|shit|piss|damn|hell|ass|bastard|bitch|cunt|prick)\\b',
    enabled: true,
    timeStart: null,
    timeEnd: null,
    user: null,
    action: 'blur'  // Default to blur for safety
  };

  const exists = rules.some(r => r.title === 'Profanity Filter');
  if (exists) {
    if (!confirm('Profanity Filter already exists. Replace it?')) return;
    rules = rules.filter(r => r.title !== 'Profanity Filter');
  }

  rules.push(profanityRule);
  saveAndApply();
});

// Helpers
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  });
}
