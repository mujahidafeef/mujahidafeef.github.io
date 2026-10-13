// ============================================================
//  ai-settings.js — shared AI Settings modal for EduMinat
//  Load AFTER i18n.js and ai.js.
// ============================================================

function openAiSettings() {
    document.getElementById('aiSettingsModal')?.remove();

    const hasKey = typeof AI !== 'undefined' && AI.hasAiKey();

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop show';
    overlay.id = 'aiSettingsModal';
    overlay.innerHTML = `
    <div class="modal" style="max-width:520px;">
      <div class="modal-header">
        <div>
          <h3>${I18N.t('reflect.ai_settings')}</h3>
          <p class="sub">${I18N.t('reflect.no_key_warning')}</p>
        </div>
        <button class="modal-close" onclick="document.getElementById('aiSettingsModal').remove()">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>${I18N.t('reflect.ai_key')}</label>
          <input
            type="password"
            id="aiKeyField"
            placeholder="${I18N.t('reflect.ai_key_ph')}"
            value="${hasKey ? AI.AI_CONFIG.apiKey : ''}"
          >
        </div>

        <div class="card" style="background:#fafaff;border:1px dashed #d0d0e0;padding:0.9rem 1.1rem;margin:0;">
          <p style="font-size:0.85rem;color:var(--text-muted);margin:0;line-height:1.6;">
            Get a free key at <strong>aistudio.google.com/app/apikey</strong>.
            Your key is stored only in this browser and never sent to our servers.
          </p>
        </div>

        ${hasKey ? `
          <div style="margin-top:0.8rem;display:flex;justify-content:flex-end;">
            <button class="btn btn-outline btn-sm" id="aiKeyClearBtn" style="color:var(--danger);border-color:#ffd5dd;">
              <i class="fas fa-trash"></i> Remove key
            </button>
          </div>
        ` : ''}
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" onclick="document.getElementById('aiSettingsModal').remove()">
          ${I18N.t('common.cancel')}
        </button>
        <button class="btn btn-primary" id="aiKeySaveBtn">
          <i class="fas fa-save"></i> ${I18N.t('reflect.save_key')}
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target.id === 'aiSettingsModal') overlay.remove();
    });

    // Close on Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Save handler
    document.getElementById('aiKeySaveBtn').addEventListener('click', () => {
        const key = document.getElementById('aiKeyField').value.trim();
        AI.setAiKey(key);
        overlay.remove();
        if (typeof showToast === 'function') {
            showToast(I18N.t('reflect.key_saved'), 'check-circle');
        }
        updateAiStatusBadge();
    });

    // Clear handler (only if key exists)
    document.getElementById('aiKeyClearBtn')?.addEventListener('click', () => {
        AI.setAiKey('');
        overlay.remove();
        if (typeof showToast === 'function') {
            showToast('API key removed', 'info-circle');
        }
        updateAiStatusBadge();
    });
}

// ============================================================
//  Status badge — small dot next to the "AI Settings" nav item
// ============================================================
function updateAiStatusBadge() {
    const dot = document.getElementById('aiKeyStatus');
    if (!dot) return;

    const hasKey = typeof AI !== 'undefined' && AI.hasAiKey();

    if (hasKey) {
        dot.textContent = '✓';
        dot.style.background = '#e3f7ec';
        dot.style.color = '#0f8b4b';
        dot.title = 'AI enabled';
    } else {
        dot.textContent = '!';
        dot.style.background = '#fff2e0';
        dot.style.color = '#b45f06';
        dot.title = 'AI disabled — click to add a key';
    }
}

// Auto-update badge when the page loads
document.addEventListener('DOMContentLoaded', updateAiStatusBadge);