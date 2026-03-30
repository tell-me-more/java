const STORAGE_KEY = "javaSyntaxProgressV1";

const state = {
  activeTask: "zuordnen",
  completed: {
    zuordnen: false,
    verschieben: false,
    fehlersuche: false,
    code: false,
  },
};

const rules = [
  {
    title: "1) Jede Anweisung endet mit ;",
    text: "Ein Semikolon zeigt Java: Diese Anweisung ist zu Ende. Ohne ; kann das Programm nicht richtig übersetzt werden.",
  },
  {
    title: "2) Blöcke nutzen geschweifte Klammern { }",
    text: "Klammern fassen zusammen, was zu einer Klasse, Methode oder Schleife gehört. Öffnende und schließende Klammer müssen zusammenpassen.",
  },
  {
    title: "3) Das Programm startet in main",
    text: "Die main-Methode ist der Einstiegspunkt. Dort beginnt Java die Ausführung.",
  },
  {
    title: "4) Groß-/Kleinschreibung ist wichtig",
    text: "main und Main sind unterschiedlich. Auch System muss genau so geschrieben werden.",
  },
];

const sortTarget = [
  "public class Main {",
  "public static void main(String[] args) {",
  "System.out.println(\"Hallo\");",
  "}",
  "}",
];

const sortInitial = [
  "}",
  "public static void main(String[] args) {",
  "public class Main {",
  "}",
  "System.out.println(\"Hallo\");",
];

const errorLines = [
  "public class Main {",
  "public static void Main(String[] args) {",
  "int zahl = 10",
  "System.out.println(zahl);",
  "}",
  "",
  "}",
];

const errorIndexes = [1, 2, 5];

try {
  init();
} catch (err) {
  console.error("Die Seite konnte nicht vollständig initialisiert werden.", err);
}

function init() {
  loadState();
  renderRuleCards();
  initTabs();
  initSortTask();
  initErrorTask();
  initCodeTask();
  bindChecks();
  updateProgress();
  activateTask(state.activeTask);
}

function loadState() {
  const raw = safeStorageGet(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.activeTask) state.activeTask = parsed.activeTask;
    if (parsed.completed) {
      state.completed = { ...state.completed, ...parsed.completed };
    }
  } catch (err) {
    console.warn("Fortschritt konnte nicht geladen werden.", err);
  }
}

function saveState() {
  safeStorageSet(STORAGE_KEY, JSON.stringify(state));
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("localStorage ist nicht verfügbar. Fortschritt wird nicht geladen.", err);
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("localStorage ist nicht verfügbar. Fortschritt wird nicht gespeichert.", err);
  }
}

function renderRuleCards() {
  const container = document.getElementById("ruleGrid");
  container.innerHTML = "";

  rules.forEach((rule, index) => {
    const card = document.createElement("div");
    card.className = "rule-card";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = rule.title;
    button.setAttribute("aria-expanded", "false");

    const text = document.createElement("p");
    text.className = "hidden";
    text.id = `rule-${index}`;
    text.textContent = rule.text;

    button.addEventListener("click", () => {
      const hidden = text.classList.toggle("hidden");
      button.setAttribute("aria-expanded", String(!hidden));
    });

    card.append(button, text);
    container.appendChild(card);
  });
}

function initTabs() {
  document.querySelectorAll(".task-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTask(tab.dataset.task);
      state.activeTask = tab.dataset.task;
      saveState();
    });
  });
}

function activateTask(taskName) {
  document.querySelectorAll(".task-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.task === taskName);
  });

  document.querySelectorAll(".task-card").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.taskPanel === taskName);
  });
}

function bindChecks() {
  document.querySelectorAll("[data-check]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = button.dataset.check;
      if (task === "zuordnen") checkZuordnen();
      if (task === "verschieben") checkVerschieben();
      if (task === "fehlersuche") checkFehlersuche();
      if (task === "code") checkCode();
    });
  });
}

function setFeedback(task, text) {
  const el = document.getElementById(`feedback-${task}`);
  el.textContent = text;
}

function markDone(task) {
  if (!state.completed[task]) {
    state.completed[task] = true;
    saveState();
    updateProgress();
  }
}

function updateProgress() {
  const done = Object.values(state.completed).filter(Boolean).length;
  const total = Object.keys(state.completed).length;
  document.getElementById("progressText").textContent = `Fortschritt: ${done} / ${total} erledigt`;
  document.getElementById("progressBar").style.width = `${(done / total) * 100}%`;
}

function checkZuordnen() {
  const checks = {
    matchClass: "class",
    matchMain: "main",
    matchOutput: "ausgabe",
    matchSemicolon: "semicolon",
  };

  const allCorrect = Object.entries(checks).every(([id, expected]) => {
    return document.getElementById(id).value === expected;
  });

  if (allCorrect) {
    markDone("zuordnen");
    setFeedback("zuordnen", "Stark! Du hast die Grundbestandteile korrekt zugeordnet.");
    return;
  }

  setFeedback(
    "zuordnen",
    "Noch nicht ganz. Tipp: Die Startmethode enthält immer das Wort main, und eine Konsolenausgabe erkennst du an System.out.println(...).",
  );
}

function initSortTask() {
  renderSortList(sortInitial);
}

function renderSortList(lines) {
  const list = document.getElementById("sortList");
  list.innerHTML = "";

  lines.forEach((line, idx) => {
    const item = document.createElement("li");
    item.className = "line-item";
    item.dataset.index = String(idx);

    const code = document.createElement("code");
    code.textContent = line;

    const controls = document.createElement("div");
    controls.className = "line-controls";

    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "↑";
    up.addEventListener("click", () => moveLine(idx, -1));

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "↓";
    down.addEventListener("click", () => moveLine(idx, 1));

    controls.append(up, down);
    item.append(code, controls);
    list.appendChild(item);
  });
}

function currentSortLines() {
  return [...document.querySelectorAll("#sortList .line-item code")].map((el) => el.textContent);
}

function moveLine(index, direction) {
  const lines = currentSortLines();
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= lines.length) return;
  [lines[index], lines[newIndex]] = [lines[newIndex], lines[index]];
  renderSortList(lines);
}

function checkVerschieben() {
  const lines = currentSortLines();
  const ok = lines.every((line, i) => line === sortTarget[i]);

  if (ok) {
    markDone("verschieben");
    setFeedback("verschieben", "Sehr gut! Die Reihenfolge ist logisch und ausführbar.");
    return;
  }

  setFeedback(
    "verschieben",
    "Noch nicht korrekt. Tipp: Erst kommt die Klasse, dann main, dann die Ausgabe. Die schließenden Klammern kommen zuletzt.",
  );
}

function initErrorTask() {
  const container = document.getElementById("errorLines");

  errorLines.forEach((line, idx) => {
    const label = document.createElement("label");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = String(idx);

    const code = document.createElement("code");
    code.textContent = `${idx + 1}: ${line || "(leere Zeile)"}`;

    label.append(cb, code);
    container.appendChild(label);
  });
}

function checkFehlersuche() {
  const selected = [...document.querySelectorAll("#errorLines input:checked")]
    .map((input) => Number(input.value))
    .sort((a, b) => a - b);

  const correct = selected.length === errorIndexes.length && selected.every((v, i) => v === errorIndexes[i]);

  if (correct) {
    markDone("fehlersuche");
    setFeedback("fehlersuche", "Super erkannt! Du hast alle fehlerhaften Zeilen gefunden.");
    return;
  }

  setFeedback(
    "fehlersuche",
    "Noch nicht passend. Tipp: Achte auf korrekte Schreibweise von main, fehlende Semikolons und unnötige Leerzeilen innerhalb des Codes.",
  );
}

function initCodeTask() {
  const textarea = document.getElementById("codeInput");
  textarea.value = [
    "public class Main {",
    "  public static void main(String[] args) {",
    "    // Schreibe hier deinen Code",
    "  }",
    "}",
  ].join("\n");

  textarea.addEventListener("input", updatePreview);
  updatePreview();
}

function updatePreview() {
  const code = document.getElementById("codeInput").value;
  const output = document.getElementById("previewOutput");

  const prints = [...code.matchAll(/System\.out\.println\(([^)]+)\)\s*;/g)].map((m) => m[1]);

  if (!prints.length) {
    output.textContent = "(Noch keine Ausgabe erkannt)";
    return;
  }

  output.textContent = prints
    .map((entry) => entry.replace(/^"|"$/g, ""))
    .join("\n");
}

function checkCode() {
  const code = document.getElementById("codeInput").value;
  const normalized = code.replace(/\s+/g, " ").trim();

  const hasClass = /public\s+class\s+Main/.test(code);
  const hasMain = /public\s+static\s+void\s+main\s*\(\s*String\[\]\s+args\s*\)/.test(code);
  const hasOutput = /System\.out\.println\s*\(\s*"Java ist cool"\s*\)\s*;/.test(code);

  const lines = code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.endsWith("{") && line !== "}");

  const noMissingSemicolon = lines.every((line) => line.endsWith(";") || line.startsWith("//"));

  if (hasClass && hasMain && hasOutput && noMissingSemicolon && normalized.length > 20) {
    markDone("code");
    setFeedback("code", "Prima! Dein Code enthält alle geforderten Bestandteile.");
    return;
  }

  setFeedback(
    "code",
    "Fast geschafft. Tipp: Prüfe den Klassennamen, die main-Signatur, das Semikolon nach println und den genauen Ausgabetext.",
  );
}
