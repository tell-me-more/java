function normalize(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function hasAll(code, required) {
  const n = normalize(code);
  return required.every((item) => n.includes(item));
}

function hasForbidden(code, forbidden) {
  const n = normalize(code);
  return forbidden.some((item) => n.includes(item));
}

document.querySelectorAll('.run-example').forEach((btn) => {
  btn.addEventListener('click', () => {
    const box = btn.closest('.card').querySelector('.output');
    box.textContent = btn.dataset.output || '(keine Ausgabe)';
  });
});

document.querySelectorAll('.check-task').forEach((btn) => {
  btn.addEventListener('click', () => {
    const task = btn.closest('.task');
    const input = task.querySelector('textarea').value;
    const required = (task.dataset.require || '').split('|').map((x) => x.trim()).filter(Boolean);
    const forbidden = (task.dataset.forbid || '').split('|').map((x) => x.trim()).filter(Boolean);
    const fb = task.querySelector('.feedback');

    if (!input.trim()) {
      fb.textContent = 'Bitte erst Code eingeben.';
      fb.className = 'feedback warn';
      return;
    }

    if (hasForbidden(input, forbidden)) {
      fb.textContent = 'Fast. Entferne nicht erlaubte Teile und versuche es erneut.';
      fb.className = 'feedback warn';
      return;
    }

    if (hasAll(input, required)) {
      fb.textContent = 'Richtig! Das passt zu dieser Aufgabe.';
      fb.className = 'feedback ok';
      return;
    }

    fb.textContent = 'Noch nicht ganz. Prüfe Schreibweise und fehlende Teile.';
    fb.className = 'feedback warn';
  });
});
