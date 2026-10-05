const screens = [...document.querySelectorAll('.screen')];
const state = { event: '' };
const noButton = document.querySelector('#no-button');
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSeIo2RgX6OmmlnRe9DcoaQhhFbzd87XeQYv-KYAI8McGiTDcw/formResponse';
const GOOGLE_FORM_FIELDS = {
  event: 'entry.1647409354',
  date: 'entry.302324213',
  time: 'entry.211935560'
};

function showScreen(name) {
  screens.forEach((screen) => {
    const active = screen.dataset.screen === name;
    screen.classList.toggle('screen--active', active);
    screen.setAttribute('aria-hidden', String(!active));
  });
  noButton.hidden = name !== 'question';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let lastFleeAt = 0;

function moveNoButton() {
  const rect = noButton.getBoundingClientRect();
  const gap = 24;
  const side = Math.random() < 0.5 ? 'left' : 'right';
  const maxTop = Math.max(gap, window.innerHeight - rect.height - gap);
  const top = gap + Math.random() * Math.max(0, maxTop - gap);

  if (!noButton.classList.contains('is-fleeing')) document.body.append(noButton);
  noButton.classList.add('is-fleeing');
  noButton.style.left = side === 'left' ? `${gap}px` : 'auto';
  noButton.style.right = side === 'right' ? `${gap}px` : 'auto';
  noButton.style.top = `${top}px`;
}

function checkNoButtonZone(event) {
  if (event.pointerType === 'touch' || performance.now() - lastFleeAt < 280) return;
  const rect = noButton.getBoundingClientRect();
  const closestX = Math.max(rect.left, Math.min(event.clientX, rect.right));
  const closestY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));
  const distance = Math.hypot(event.clientX - closestX, event.clientY - closestY);
  if (distance < 130) {
    lastFleeAt = performance.now();
    moveNoButton();
  }
}

function celebrate() {
  const layer = document.querySelector('#confetti-layer');
  const colors = ['#e76f51', '#2f6b50', '#eecb68', '#85b8b2'];
  for (let i = 0; i < 60; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--drift', `${(Math.random() - .5) * 260}px`);
    piece.style.setProperty('--spin', `${Math.random() * 800 - 400}deg`);
    piece.style.animationDelay = `${Math.random() * .25}s`;
    layer.append(piece);
    window.setTimeout(() => piece.remove(), 2100);
  }
}

document.addEventListener('pointermove', checkNoButtonZone);
noButton.addEventListener('click', (event) => { event.preventDefault(); moveNoButton(); });
document.querySelector('#yes-button').addEventListener('click', () => { celebrate(); showScreen('event'); });

function selectEvent(value) {
  state.event = value;
  document.querySelectorAll('.choice').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.event === value));
  document.querySelector('#selected-event').textContent = `Выбрано: ${value}`;
  document.querySelector('#event-next').disabled = false;
}

document.querySelectorAll('.choice[data-event]').forEach((choice) => choice.addEventListener('click', () => selectEvent(choice.dataset.event)));
const dialog = document.querySelector('#custom-dialog');
document.querySelector('#custom-event').addEventListener('click', () => { dialog.showModal(); document.querySelector('#custom-input').focus(); });
document.querySelector('#custom-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.submitter?.value !== 'default') {
    dialog.close();
    return;
  }
  const value = document.querySelector('#custom-input').value.trim();
  if (!value) return;
  selectEvent(value);
  dialog.close();
});
document.querySelector('#event-next').addEventListener('click', () => {
  document.querySelector('#final-event').textContent = state.event;
  showScreen('time');
});

const dateInput = document.querySelector('#date');
dateInput.min = new Date().toISOString().slice(0, 10);

function sendToGoogleForm(values) {
  let frame = document.querySelector('#google-form-response-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'google-form-response-frame';
    frame.name = 'google-form-response-frame';
    frame.title = 'Скрытая отправка ответа';
    frame.hidden = true;
    document.body.append(frame);
  }

  const form = document.createElement('form');
  form.action = GOOGLE_FORM_ACTION;
  form.method = 'POST';
  form.target = frame.name;
  form.hidden = true;
  Object.entries(GOOGLE_FORM_FIELDS).forEach(([key, fieldName]) => {
    const input = document.createElement('input');
    input.name = fieldName;
    input.value = values[key];
    form.append(input);
  });
  document.body.append(form);
  form.submit();
  window.setTimeout(() => form.remove(), 1500);
}

document.querySelector('#time-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.querySelector('#form-message');
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  sendToGoogleForm({ event: state.event, date: dateInput.value, time: document.querySelector('#time').value });
  message.textContent = 'Готово! Ответ отправлен ✳';
  button.textContent = 'Ответ отправлен';
});
