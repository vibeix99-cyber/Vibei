/* ==========================================================================
   main.js — boot, menu wiring.
   ========================================================================== */

function bindSegment(id, onPick) {
  const box = document.querySelector(id);
  box.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    box.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('is-on', b === btn));
    onPick(btn.dataset.value);
  });
}

function boot() {
  initStage();

  bindSegment('#opt-format', v => { UI.format = parseInt(v, 10); });
  bindSegment('#opt-hide', v => { UI.hideChoices = v === '1'; });
  bindSegment('#opt-speed', v => { UI.speedMul = parseFloat(v); });

  $('#btn-to-preview').addEventListener('click', () => {
    newTeams();
    renderPreview();
    showScreen('screen-preview');
  });

  $('#btn-reroll').addEventListener('click', () => {
    newTeams();
    renderPreview();
  });

  $('#btn-back-title').addEventListener('click', () => showScreen('screen-title'));

  $('#btn-start').addEventListener('click', () => {
    if (UI.running) return;
    startBattle();
  });

  $('#btn-rematch').addEventListener('click', () => {
    resetTeams();
    startBattle();
  });

  $('#btn-new-teams').addEventListener('click', () => {
    newTeams();
    renderPreview();
    showScreen('screen-preview');
  });

  $('#btn-result-title').addEventListener('click', () => showScreen('screen-title'));

  /* click anywhere on the message bar to hurry the text along */
  $('#msgbar').addEventListener('click', () => { UI.skipFlag = true; });
  $('#stage').addEventListener('click', () => { UI.skipFlag = true; });

  window.addEventListener('keydown', onKeyDown);
}

document.addEventListener('DOMContentLoaded', boot);
