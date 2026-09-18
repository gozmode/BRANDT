document.addEventListener('DOMContentLoaded', function () {
  // Extra-Footer-Sektion, die als Quelle für die Ankündigungsleiste dient
  const footerSectionId = "6aa6beb44e73d919d67e5cbc";
  const originalFooter = document.querySelector(`section[data-section-id="${footerSectionId}"]`);

  if (!originalFooter) return;

  // Original-Sektion markieren, damit unser CSS sie ausblenden kann
  originalFooter.classList.add('original-footer-section');

  // Struktur der Ankündigungsleiste aufbauen
  const wrapper = document.createElement('div');
  wrapper.className = 'announcement-bar-wrapper';

  const trigger = document.createElement('div');
  trigger.className = 'announcement-trigger';
  trigger.innerHTML = `
    <span class="announcement-trigger-text">Aktuelle Informationen + Hinweise</span>
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 9l-7 7-7-7"></path>
    </svg>
    <div class="close-button">✕</div>
  `;

  // Trigger-Text kommt aus der nativen Squarespace-Announcement-Bar
  // (Marketing → Announcement Bar), damit er dort ganz normal ohne
  // Code-Änderung editierbar ist. Die native Bar selbst bleibt per CSS
  // (.sqs-announcement-bar-dropzone) unsichtbar, wir lesen nur ihren Text.
  // Squarespace füllt .sqs-announcement-bar-text-inner erst NACH
  // DOMContentLoaded per eigenem Skript - deshalb hier mit ein paar
  // Wiederholungsversuchen statt nur einmal sofort zu prüfen.
  const triggerTextEl = trigger.querySelector('.announcement-trigger-text');
  (function applyNativeBarText(attempt) {
    const nativeBarText = document.querySelector('.sqs-announcement-bar-text-inner');
    const text = nativeBarText && nativeBarText.innerText.trim();
    if (text) {
      triggerTextEl.textContent = text;
      updateOffset();
    } else if (attempt < 10) {
      setTimeout(function () { applyNativeBarText(attempt + 1); }, 300);
    }
  })(0);

  const content = document.createElement('div');
  content.className = 'announcement-content';

  const innerContent = document.createElement('div');
  innerContent.className = 'announcement-inner';

  // Inhalt der Extra-Footer-Sektion klonen
  const clonedFooter = originalFooter.cloneNode(true);
  clonedFooter.classList.remove('original-footer-section');
  innerContent.appendChild(clonedFooter);
  content.appendChild(innerContent);

  // Zusammensetzen
  wrapper.appendChild(trigger);
  wrapper.appendChild(content);
  document.body.insertBefore(wrapper, document.body.firstChild);

  // Fixierten Header um die tatsächliche Höhe der Leiste nach unten schieben
  const header = document.querySelector('header');

  // Squarespace nutzt intern die CSS-Variable --header-height, um zu
  // berechnen, wie weit bei einem Anker-Link (z.B. "Details hier")
  // gescrollt werden muss, damit das Ziel nicht unter dem fixierten
  // Header verschwindet. scroll-padding-top wird dafür NICHT
  // ausgewertet (getestet) – deshalb aktualisieren wir stattdessen
  // diese Variable um die Höhe unserer Leiste.
  const originalHeaderHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;

  function updateOffset() {
    const barHeight = wrapper.getBoundingClientRect().height;
    if (header) header.style.top = barHeight + 'px';
    document.body.style.paddingTop = barHeight + 'px';
    document.documentElement.style.setProperty('--header-height', (originalHeaderHeight + barHeight) + 'px');
  }

  // Auf-/Zuklapp-Logik
  let isOpen = false;

  function toggleAnnouncement(shouldOpen = !isOpen) {
    isOpen = shouldOpen;

    if (shouldOpen) {
      content.classList.add('active');
      trigger.classList.add('active');
      document.body.classList.add('announcement-open');
    } else {
      content.classList.remove('active');
      trigger.classList.remove('active');
      document.body.classList.remove('announcement-open');
    }

    // Höhe ändert sich durch die CSS-Transition (max-height) erst nach und nach
    updateOffset();
    setTimeout(updateOffset, 550);
  }

  updateOffset();
  window.addEventListener('resize', updateOffset);

  trigger.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-button')) {
      toggleAnnouncement(false);
    } else {
      toggleAnnouncement();
    }
  });

  // Schließen bei Klick außerhalb
  document.addEventListener('click', (e) => {
    if (isOpen && !wrapper.contains(e.target)) {
      toggleAnnouncement(false);
    }
  });

  // Zustand (offen/geschlossen) im localStorage merken
  const STORAGE_KEY = 'announcement-state';

  const savedState = localStorage.getItem(STORAGE_KEY);
  if (savedState === 'closed') {
    toggleAnnouncement(false);
  }

  const closeButton = wrapper.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'closed');
  });
});
