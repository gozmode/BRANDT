document.addEventListener('DOMContentLoaded', function () {
  // Inhalt kommt von einer eigenständigen, nicht ins Menü eingebundenen
  // Seite (wie /vanslide-menu, /sale-menu beim Mega Menu) statt aus einer
  // versteckten Seiten-Section - bleibt dadurch immer normal editierbar.
  const contentSourceUrl = '/announce';

  // Trigger-Text kommt aus der nativen Squarespace-Announcement-Bar
  // (Marketing → Announcement Bar). Squarespace füllt
  // .sqs-announcement-bar-text-inner erst NACH DOMContentLoaded per
  // eigenem Skript - deshalb hier mit Wiederholungsversuchen prüfen.
  //
  // WICHTIG: Die Leiste wird ERST in die Seite eingefügt, wenn ein
  // echter Text gefunden wurde. Ist die native Bar im Backend
  // deaktiviert, gibt es also NIE ein sichtbares Aufblitzen - die
  // Leiste entsteht schlicht nie.
  (function waitForNativeBarText(attempt) {
    const nativeBarText = document.querySelector('.sqs-announcement-bar-text-inner');
    const text = nativeBarText && nativeBarText.innerText.trim();

    if (text) {
      buildAnnouncementBar(text);
    } else if (attempt < 10) {
      setTimeout(function () { waitForNativeBarText(attempt + 1); }, 300);
    }
    // Nach 10 Versuchen (3s) ohne Text: native Bar ist deaktiviert ->
    // nichts tun, buildAnnouncementBar wird nie aufgerufen.
  })(0);

  function buildAnnouncementBar(triggerText) {
    const wrapper = document.createElement('div');
    wrapper.className = 'announcement-bar-wrapper';

    const trigger = document.createElement('div');
    trigger.className = 'announcement-trigger';
    trigger.innerHTML = `
      <span class="announcement-trigger-text"></span>
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 9l-7 7-7-7"></path>
      </svg>
      <div class="close-button">✕</div>
    `;
    trigger.querySelector('.announcement-trigger-text').textContent = triggerText;

    const content = document.createElement('div');
    content.className = 'announcement-content';

    const innerContent = document.createElement('div');
    innerContent.className = 'announcement-inner';
    content.appendChild(innerContent);

    // Inhalt der /announce-Seite per Fetch holen und einfügen
    fetch(contentSourceUrl)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const section = doc.querySelector('#page .page-section, main .page-section');
        if (section) {
          innerContent.appendChild(section);
          updateOffset();
        }
      })
      .catch(function () {});

    // Zusammensetzen und erst jetzt in die Seite einfügen
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
  }
});
