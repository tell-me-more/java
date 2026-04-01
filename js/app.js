const PAGE_KEY = `javaLesson::${location.pathname}`;

function decodeEntities(text) {
  const area = document.createElement('textarea');
  area.innerHTML = text;
  return area.value;
}

function normalize(text) {
  return decodeEntities(String(text || ''))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(text) {
  return normalize(text).replace(/\s*([(){};,+\-*/<>=!&|])\s*/g, '$1');
}

function parseList(value) {
  return decodeEntities(value || '')
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);
}

function hasAll(code, required) {
  const n = normalize(code);
  const c = compact(code);
  return required.every((item) => {
    const ni = normalize(item);
    const ci = compact(item);
    return n.includes(ni) || c.includes(ci);
  });
}

function hasForbidden(code, forbidden) {
  const n = normalize(code);
  const c = compact(code);
  return forbidden.some((item) => n.includes(normalize(item)) || c.includes(compact(item)));
}

function readState() {
  try {
    return JSON.parse(localStorage.getItem(PAGE_KEY) || '{"done":[]}');
  } catch {
    return { done: [] };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(PAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore if storage is blocked
  }
}

function renderProgress(tasks, state) {
  let box = document.querySelector('.lesson-progress');
  if (!box) {
    box = document.createElement('section');
    box.className = 'card lesson-progress';
    box.innerHTML = `
      <h2>Dein Lernstand</h2>
      <p class="small" id="lessonProgressText"></p>
      <div class="progress-track"><div class="progress-fill" id="lessonProgressFill"></div></div>
    `;
    const firstCard = document.querySelector('main .container .card');
    if (firstCard) {
      firstCard.insertAdjacentElement('beforebegin', box);
    }
  }

  const done = state.done.length;
  const total = tasks.length;
  const ratio = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('lessonProgressText').textContent = `${done} von ${total} Aufgaben richtig (${ratio} %)`;
  document.getElementById('lessonProgressFill').style.width = `${ratio}%`;
}

function initExamples() {
  document.querySelectorAll('.run-example').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = btn.closest('.card')?.querySelector('.output');
      if (box) box.textContent = btn.dataset.output || '(keine Ausgabe)';
    });
  });
}

function initChecks() {
  const state = readState();
  const tasks = Array.from(document.querySelectorAll('.task'));

  renderProgress(tasks, state);

  tasks.forEach((task, index) => {
    const btn = task.querySelector('.check-task');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const input = task.querySelector('textarea')?.value || '';
      const required = parseList(task.dataset.require || '');
      const forbidden = parseList(task.dataset.forbid || '');
      const fb = task.querySelector('.feedback');

      if (!fb) return;

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

        if (!state.done.includes(index)) {
          state.done.push(index);
          saveState(state);
          renderProgress(tasks, state);
        }
        return;
      }

      const firstMissing = required.find((part) => {
        const n = normalize(part);
        const c = compact(part);
        return !normalize(input).includes(n) && !compact(input).includes(c);
      });

      fb.textContent = firstMissing
        ? `Noch nicht ganz. Es fehlt wahrscheinlich: ${firstMissing}`
        : 'Noch nicht ganz. Prüfe Schreibweise und fehlende Teile.';
      fb.className = 'feedback warn';
    });
  });
}

initExamples();
initChecks();
