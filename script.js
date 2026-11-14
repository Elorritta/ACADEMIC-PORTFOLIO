// Navigate between the portfolio pages.
function switchPage(pageId) {
    const pages = {
        home: 'index.html',
        about: 'about.html',
        planner: 'planner.html',
        projects: 'project.html',
        contact: 'contact.html'
    };
    if (pages[pageId]) window.location.href = pages[pageId];
}

// Mobile Menu Toggle (Horizontal alignment drawer)
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    menu.classList.toggle('show');
    document.getElementById('mobile-menu-btn').setAttribute('aria-expanded', String(menu.classList.contains('show')));
    if (menu.classList.contains('show')) {
        icon.className = 'fa-solid fa-xmark';
    } else {
        icon.className = 'fa-solid fa-bars';
    }
}

// Theme Toggle (Light & Dark mode persisted via localStorage)
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

function loadSaved(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveValue(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable. */ }
}
let savedTheme;
try { savedTheme = localStorage.getItem('portfolio_theme'); } catch { /* Use the system theme. */ }
if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    htmlElement.setAttribute('data-theme', 'dark');
    updateThemeIcon('dark');
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    try { localStorage.setItem('portfolio_theme', newTheme); } catch { /* Keep the theme for this visit. */ }
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        themeIcon.className = 'fa-solid fa-moon';
    }
}

// Toast Notification System
function showToast(message) {
    const box = document.getElementById('toast-box');
    const msgSpan = document.getElementById('toast-msg');
    msgSpan.textContent = message;
    box.classList.add('show');
    setTimeout(() => {
        box.classList.remove('show');
    }, 3500);
}

// Academic Planner Task Management with LocalStorage
const savedTasks = loadSaved('student_portfolio_tasks', []);
let tasks = Array.isArray(savedTasks)
    // IDs 1–4 belonged to the original sample tasks; user-created tasks use timestamps.
    ? savedTasks.filter(task => task && ![1, 2, 3, 4].includes(task.id) && typeof task.text === 'string' && typeof task.completed === 'boolean')
    : [];

function renderTasks() {
    const listContainer = document.getElementById('task-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    let completedCount = 0;
    tasks.forEach((task, index) => {
        if (task.completed) completedCount++;

        const div = document.createElement('li');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <label class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text"></span>
            </label>
            <button class="task-delete" title="Delete task" aria-label="Delete task ${index + 1}"><i class="fa-solid fa-trash"></i></button>
        `;
        div.querySelector('.task-text').textContent = task.text;
        div.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(index));
        div.querySelector('.task-delete').addEventListener('click', () => deleteTask(index));
        listContainer.appendChild(div);
    });

    document.getElementById('task-counter').textContent = `${completedCount}/${tasks.length} Completed`;
    document.getElementById('task-empty-state').hidden = tasks.length > 0;
    saveValue('student_portfolio_tasks', tasks);
}

function addNewTask() {
    const input = document.getElementById('new-task-input');
    const val = input.value.trim();
    if (!val) { showToast('Enter a task before adding it.'); input.focus(); return; }

    tasks.push({ id: Date.now(), text: val, completed: false });
    input.value = '';
    renderTasks();
    showToast('New task added to planner!');
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
    showToast('Task removed from planner.');
}

// Initialize planner only on its own page.
if (document.getElementById('task-list')) {
    renderTasks();
    document.getElementById('new-task-input').addEventListener('keydown', event => {
        if (event.key === 'Enter') addNewTask();
    });
}

// Weekly timetable: start empty and retain only the visitor's own sessions.
const studyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const validStudyTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const savedSessions = loadSaved('student_portfolio_sessions', []);
let studySessions = Array.isArray(savedSessions) ? savedSessions.filter(session =>
    session && studyDays.includes(session.day) && validStudyTime(session.start) &&
    validStudyTime(session.end) && session.end > session.start &&
    typeof session.activity === 'string' && session.activity.trim()
) : [];

function renderStudySessions() {
    const list = document.getElementById('study-session-list');
    if (!list) return;
    list.replaceChildren();
    studySessions.sort((a, b) => studyDays.indexOf(a.day) - studyDays.indexOf(b.day) || a.start.localeCompare(b.start));
    if (!studySessions.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No study sessions yet. Add one above.';
        row.appendChild(cell);
        list.appendChild(row);
    }
    studySessions.forEach((session, index) => {
        const row = document.createElement('tr');
        [session.day, `${session.start} – ${session.end}`, session.activity].forEach((value, column) => {
            const cell = document.createElement(column === 0 ? 'th' : 'td');
            if (column === 0) cell.scope = 'row';
            if (column === 1) cell.className = 'session-time';
            cell.textContent = value;
            row.appendChild(cell);
        });
        const actions = document.createElement('td');
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'task-delete';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove ${session.activity} on ${session.day} at ${session.start}`);
        remove.addEventListener('click', () => {
            studySessions.splice(index, 1);
            renderStudySessions();
            document.getElementById('session-status').textContent = 'Study session removed.';
            document.getElementById('session-day').focus();
        });
        actions.appendChild(remove);
        row.appendChild(actions);
        list.appendChild(row);
    });
    saveValue('student_portfolio_sessions', studySessions);
}

function addStudySession(event) {
    event.preventDefault();
    const form = document.getElementById('study-session-form');
    if (!form.reportValidity()) return;
    const day = document.getElementById('session-day').value;
    const start = document.getElementById('session-start').value;
    const end = document.getElementById('session-end').value;
    const activity = document.getElementById('session-activity').value.trim();
    const status = document.getElementById('session-status');
    if (!studyDays.includes(day) || !validStudyTime(start) || !validStudyTime(end)) return;
    if (end <= start) {
        status.textContent = 'Choose an end time later than the start time.';
        document.getElementById('session-end').focus();
        return;
    }
    if (!activity) {
        status.textContent = 'Enter an activity for your study session.';
        document.getElementById('session-activity').focus();
        return;
    }
    studySessions.push({ day, start, end, activity });
    renderStudySessions();
    form.reset();
    status.textContent = 'Study session added.';
    document.getElementById('session-day').focus();
}

if (document.getElementById('study-session-form')) {
    renderStudySessions();
    document.getElementById('study-session-form').addEventListener('submit', addStudySession);
}

// Projects Filtering
function filterProjects(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.project-card').forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Project Details Modal
let modalTrigger;
function openProjectModal(title, bodyText) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = bodyText;
    modalTrigger = document.activeElement;
    document.getElementById('project-modal').classList.add('show');
    document.querySelector('.modal-close-btn').focus();
}

function closeProjectModal(event) {
    if (!event || event.target === document.getElementById('project-modal') || event.currentTarget.classList.contains('modal-close-btn') || event.currentTarget.classList.contains('btn-primary')) {
        document.getElementById('project-modal').classList.remove('show');
        modalTrigger?.focus();
    }
}

// Validate contact details and submit them to Formspree.
function validateContact(values) {
    const errors = {};
    if (!values.name.trim()) errors.name = 'Please enter your name.';
    if (!values.email.trim()) errors.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
    if (!values.phone.trim()) errors.phone = 'Please enter your phone number.';
    else if (!/^[0-9]+$/.test(values.phone.trim())) errors.phone = 'Use digits only (0?9).';
    if (!values.msg.trim()) errors.msg = 'Please enter a message.';
    return errors;
}

async function handleContactSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('contact-form');
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;
    const fields = ['name', 'email', 'phone', 'msg'];
    const values = Object.fromEntries(fields.map(key => [key, document.getElementById('c-' + key).value]));
    const errors = validateContact(values);
    for (const key of fields) {
        const field = document.getElementById('c-' + key);
        document.getElementById('error-' + key).textContent = errors[key] || '';
        field.setAttribute('aria-invalid', String(Boolean(errors[key])));
    }
    const firstError = fields.find(key => errors[key]);
    const status = document.getElementById('form-status');
    if (firstError) {
        status.textContent = 'Please correct the highlighted fields.';
        document.getElementById('c-' + firstError).focus();
        return;
    }
    const buttonLabel = submitButton.querySelector('span');
    submitButton.disabled = true;
    buttonLabel.textContent = 'Sending...';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your message...';
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            status.textContent = 'Thank you! Your message has been submitted.';
            form.reset();
        } else {
            const data = await response.json().catch(() => null);
            const messages = Array.isArray(data?.errors)
                ? data.errors.map(error => error.message).filter(message => typeof message === 'string')
                : [];
            status.textContent = messages.length
                ? messages.join(' ')
                : 'Your message could not be submitted. Please try again or use the email link.';
        }
    } catch {
        status.textContent = 'Unable to connect. Check your internet connection and try again, or use the email link.';
    } finally {
        submitButton.disabled = false;
        buttonLabel.textContent = 'Submit';
        form.setAttribute('aria-busy', 'false');
    }
}

document.addEventListener('keydown', event => {
    const modal = document.getElementById('project-modal');
    if (!modal.classList.contains('show')) return;
    if (event.key === 'Escape') closeProjectModal();
    if (event.key === 'Tab') {
        const buttons = modal.querySelectorAll('button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
});

// Bind page actions in one place instead of inline HTML event handlers.
const pageActions = {
    'toggle-menu': () => toggleMobileMenu(),
    'close-project-overlay': event => closeProjectModal(event),
    'stop-propagation': event => event.stopPropagation(),
    'close-project': () => closeProjectModal(),
    'navigate': event => switchPage(event.currentTarget.dataset.destination),
    'add-task': () => addNewTask()
};
document.querySelectorAll('[data-action]').forEach(element => {
    const action = pageActions[element.dataset.action];
    if (action) element.addEventListener('click', action);
});
document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);

;
// Waterline liquid navigation, adapted from the supplied Nimbus UI React component.
// Original design by guglielmogiannattasio.it. Native links preserve this static site's routes.
(() => {
'use strict';
const PAD = 14;
const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec4 uPill;
uniform vec4 uBlob[6];uniform float uSy[6];uniform vec4 uRip[6];uniform vec3 uMouse;uniform float uDark;uniform float uAmb;
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdCap(vec2 p,vec4 B,float sy){p-=B.xy;p.y/=sy;p.x=max(abs(p.x)-B.z,0.);return(length(p)-B.w)*min(1.,sy);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float dropD(vec2 p){float d=1e4;for(int i=0;i<6;i++){if(uBlob[i].w>.5){d=smin(d,sdCap(p,uBlob[i],uSy[i]),13.);}}return d;}
float pillD(vec2 p){vec2 h=uPill.zw*.5;return sdRB(p-uPill.xy-h,h,h.y);}
float lens(float d,float w){float t=clamp(-d/w,0.,1.);return sqrt(1.-(1.-t)*(1.-t));}
float waves(vec2 p){float w=0.;
 for(int i=0;i<6;i++){vec4 R=uRip[i];if(R.w>0.){float x=length(p-R.xy)-R.z*240.;w+=R.w*exp(-R.z*1.7)*sin(x*.3)*exp(-x*x/700.);}}
 vec2 m=p-uMouse.xy;w+=uMouse.z*3.6*exp(-dot(m,m)/1000.);
 w+=uAmb*(sin(p.x*.05+uTime*1.2)*.45+sin(p.x*.13-uTime*.85+p.y*.2)*.25);return w;}
float H(vec2 p){float dp=pillD(p);return lens(dp,uPill.w*.36)*2.4+lens(dropD(p),11.)*7.5+waves(p)*smoothstep(0.,7.,-dp);}
float caus(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.1+t),cos(q.x*1.3-t*.7))*.6;c+=1./(1.+16.*abs(sin(q.x)*sin(q.y)));}return c/3.;}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;
 float dp=pillD(p);float dd=dropD(p);
 float h0=H(p);vec3 n=normalize(vec3(h0-H(p+vec2(1.,0.)),h0-H(p+vec2(0.,1.)),1.));
 vec3 V=vec3(0.,0.,1.);
 float spec=pow(max(dot(reflect(-normalize(vec3(-.45,-.8,.85)),n),V),0.),70.);
 float spec2=pow(max(dot(reflect(-normalize(vec3(.6,.75,.7)),n),V),0.),22.)*.3;
 float fres=clamp((1.-n.z)*4.,0.,1.);
 vec3 irid=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fres*.85+p.x*.0028+uTime*.035));
 float pm=smoothstep(1.,-1.,dp);float dm=smoothstep(1.,-1.,dd)*smoothstep(1.,-2.,dp);
 float sh=smoothstep(9.,-9.,dropD(p-vec2(0.,5.)))*(1.-dm)*pm*(.11+.07*uDark);
 vec3 c=vec3(0.,.14,.36)*sh;float a=sh;
 float pa=clamp(pm*(fres*.5+spec*.9+spec2),0.,1.);
 c=mix(vec3(1.),irid,.5*fres)*pa+c*(1.-pa);a=pa+a*(1.-pa);
 float th=lens(dd,11.);
 float cs=caus((p+n.xy*th*18.)*.085,uTime*.9);
 vec3 tint=mix(vec3(.80,.95,1.),vec3(.55,.82,1.),uDark);
 float rim=dm*(1.-smoothstep(0.,8.,-dd));
 float cres=dm*smoothstep(.12,.55,dot(n.xy,normalize(vec2(.55,.85))))*smoothstep(0.,3.,-dd);
 float body=.5+.5*clamp(-n.y*3.,-1.,1.);
 float da=dm*(.26+.14*body)*(1.-.35*uDark);vec3 dc=mix(tint,vec3(1.),body*.6);
 float la=rim*.22;vec3 lc=mix(vec3(0.,.42,.78),vec3(.1,.55,.95),uDark);dc=lc*la+dc*da*(1.-la);da=la+da*(1.-la);
 la=clamp(cres*.7+smoothstep(.6,1.,cs)*.28*th*dm,0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=clamp(dm*(spec*1.2+spec2*.5),0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=dm*smoothstep(-2.,0.,dd)*.4;dc=mix(vec3(1.),irid,.35)*la+dc*(1.-la);da=la+da*(1.-la);
 c=dc+c*(1.-da);a=da+a*(1.-da);
 gl_FragColor=vec4(c,a);
}`;
function initGL(canvas) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false })
  if (!gl) return null
  const sh = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
  }
  const vs = sh(gl.VERTEX_SHADER, VERT)
  const fs = sh(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  const p = gl.createProgram()
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  gl.useProgram(p)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(p, "a")
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const u = {}
  for (const n of ["uRes", "uDpr", "uTime", "uPill", "uBlob", "uSy", "uRip", "uMouse", "uDark", "uAmb"]) u[n] = gl.getUniformLocation(p, n)
  return { gl, u }
}


function enhanceNavigation(nav) {
  const items = Array.from(nav.querySelectorAll('.nimbus-item'));
  const canvas = nav.querySelector('.nimbus-water');
  const drop = nav.querySelector('.nimbus-drop');
  const current = items.findIndex(item => item.getAttribute('aria-current') === 'page');
  if (current < 0 || !canvas || !drop) return;
  let selected = current;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    a: {x:0,v:0}, b: {x:0,v:0}, sy: {s:1,v:0}, lead:0, lagFrom:0,
    sats:[], rips:[], t:{x:0,cy:0,q:0,r:21}, q:0,
    mouse:{x:0,y:0,s:0,on:false}, moving:false, split:false, ready:false,
    w:0,h:0,visible:false,reduce:motion.matches,raf:0,last:0,time:0,glc:null
  };
  const darkTone = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 1 : 0;
  const setTone = () => { nav.dataset.tone = darkTone() ? 'dark' : 'light'; draw(); };
  try { state.glc = initGL(canvas); } catch { state.glc = null; }
  nav.dataset.gl = state.glc ? 'on' : 'off';
  function draw() {
    const s = state
    const T = s.t
    const sep = Math.abs(s.a.x - s.b.x)
    const thin = Math.min(sep / (2 * (s.q + T.r) || 1), 1)
    const r = T.r * (1 - 0.3 * thin)
    if (s.glc) {
      const { gl: g, u } = s.glc
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight)
      g.uniform2f(u.uRes, s.w + PAD * 2, s.h + PAD * 2)
      g.uniform1f(u.uDpr, dpr)
      g.uniform1f(u.uTime, s.time)
      g.uniform4f(u.uPill, PAD, PAD, s.w, s.h)
      const blobs = new Float32Array(24)
      const sy = new Float32Array(6).fill(1)
      const head = s.lead === 0 ? s.a : s.b, tail = s.lead === 0 ? s.b : s.a
      blobs.set([head.x, T.cy, s.q * (1 - 0.25 * thin), T.r * (1 - 0.12 * thin), tail.x, T.cy, s.q * (1 - 0.8 * thin), T.r * (1 - 0.5 * thin)], 0)
      sy[0] = sy[1] = s.sy.s
      s.sats.slice(0, 4).forEach((d, i) => blobs.set([d.x, d.y, 0, d.r], 8 + i * 4))
      g.uniform4fv(u.uBlob, blobs)
      g.uniform1fv(u.uSy, sy)
      const rips = new Float32Array(24)
      s.rips.slice(-6).forEach((p, i) => rips.set([p.x, p.y, p.age, p.amp], i * 4))
      g.uniform4fv(u.uRip, rips)
      g.uniform3f(u.uMouse, s.mouse.x, s.mouse.y, s.mouse.s)
      g.uniform1f(u.uDark, darkTone())
      g.uniform1f(u.uAmb, s.reduce ? 0 : 1)
      g.clearColor(0, 0, 0, 0)
      g.clear(g.COLOR_BUFFER_BIT)
      g.drawArrays(g.TRIANGLES, 0, 3)
    } else if (drop) {
      const left = Math.min(s.a.x, s.b.x) - s.q - r - PAD
      const width = sep + 2 * (s.q + r)
      drop.style.width = `${width}px`
      drop.style.transform = `translateX(${left}px) scaleY(${s.sy.s})`
    }
  }

  function step(dt, now) {
    const s = state
    const T = s.t
    s.time += dt
    s.q += (T.q - s.q) * Math.min(1, dt * 12)
    const bodies = [s.a, s.b]
    let still = true
    if (s.reduce) {
      s.a.x = s.b.x = T.x; s.a.v = s.b.v = 0; s.sy.s = 1; s.sats = []
    } else {
      bodies.forEach((B, i) => {
        const lead = i === s.lead
        const k = lead ? 210 : 72
        const c = lead ? 25 : 13
        const f = !lead && now < s.lagFrom ? 0.08 : 1
        B.v += (k * (T.x - B.x) - c * B.v) * dt * f
        B.x += B.v * dt
        const lo = PAD + 6 + s.q + T.r - 3, hi = PAD + s.w - 6 - s.q - T.r + 3
        if (B.x < lo || B.x > hi) {
          s.sy.v -= Math.min(Math.abs(B.v), 900) * 0.0016
          B.x = Math.max(lo, Math.min(hi, B.x))
          B.v *= -0.25
        }
        if (Math.abs(T.x - B.x) > 0.3 || Math.abs(B.v) > 3) still = false
      })
      const L = bodies[s.lead]
      const syT = 1 - 0.2 * Math.min(Math.abs(L.v) / 1500, 1)
      s.sy.v += (280 * (syT - s.sy.s) - 9 * s.sy.v) * dt
      s.sy.s += s.sy.v * dt
      if (Math.abs(s.sy.s - 1) > 0.002 || Math.abs(s.sy.v) > 0.02) still = false
      // break the neck: spawn droplets between head and tail
      const sep = Math.abs(s.a.x - s.b.x)
      const r = T.r * (1 - 0.3 * Math.min(sep / (2 * (T.q + T.r) || 1), 1))
      if (!s.split && s.moving && sep - 2 * T.q - 2 * r > -6) {
        s.split = true
        const lo = bodies[1 - s.lead], hi = bodies[s.lead]
        ;[0.3, 0.5, 0.72].forEach((t, j) => {
          s.sats.push({
            x: lo.x + (hi.x - lo.x) * t + (Math.random() - 0.5) * 6,
            y: T.cy + (Math.random() - 0.5) * 10,
            vx: (lo.v + hi.v) * 0.45,
            vy: (Math.random() - 0.5) * 60,
            r: 5 + Math.random() * 3 - j * 0.5,
            k: 70 + Math.random() * 90,
          })
        })
      }
      s.sats = s.sats.filter((d) => {
        d.vx += (d.k * (T.x - d.x) - 9 * d.vx) * dt
        d.vy += (90 * (T.cy - d.y) - 7 * d.vy) * dt
        d.x += d.vx * dt
        d.y += d.vy * dt
        d.x = Math.max(PAD + 8 + d.r, Math.min(PAD + s.w - 8 - d.r, d.x))
        d.y = Math.max(T.cy - T.r + d.r, Math.min(T.cy + T.r - d.r, d.y))
        if (Math.abs(T.x - d.x) < T.q + T.r * 0.5) d.r -= dt * 26
        return d.r > 0.6
      })
      if (s.sats.length) still = false
    }
    if (s.moving && still) {
      s.moving = false
      if (s.split || !s.reduce) s.rips.push({ x: T.x, y: T.cy, age: 0, amp: s.split ? 1.2 : 0.7 })
    }
    s.rips.forEach((p) => (p.age += dt))
    s.rips = s.rips.filter((p) => p.age < 2.4)
    const target = s.mouse.on ? 1 : 0
    s.mouse.s += (target - s.mouse.s) * Math.min(1, dt * 7)
  }


  function drawFrame(now) {
    state.raf = 0;
    if (!state.visible || document.hidden) return;
    const dt = Math.min((now - state.last) / 1000, 1 / 30);
    state.last = now;
    step(dt, now);
    draw();
    if (!state.reduce) state.raf = requestAnimationFrame(drawFrame);
  }
  function loop() {
    if (state.raf || !state.visible || document.hidden || state.reduce) return;
    state.last = performance.now();
    state.raf = requestAnimationFrame(drawFrame);
  }
  function measure() {
    if (!nav.offsetWidth || !nav.offsetHeight) { state.ready = false; return; }
    const item = items[selected];
    const s = state, T = s.t;
    s.w = nav.offsetWidth; s.h = nav.offsetHeight;
    T.r = item.offsetHeight / 2;
    T.q = Math.max(0, item.offsetWidth / 2 - T.r);
    T.cy = PAD + item.offsetTop + item.offsetHeight / 2;
    const nx = PAD + item.offsetLeft + item.offsetWidth / 2;
    if (!s.ready || s.reduce) {
      s.a.x = s.b.x = nx; s.q = T.q; s.a.v = s.b.v = 0; s.ready = true;
    } else if (Math.abs(nx - T.x) > .5) {
      s.lead = Math.abs(nx - s.a.x) <= Math.abs(nx - s.b.x) ? 0 : 1;
      s.lagFrom = performance.now() + 70; s.moving = true; s.split = false;
    }
    T.x = nx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = s.w + PAD * 2, h = s.h + PAD * 2;
    if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {
      canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    }
    nav.dataset.ready = 'true';
    draw(); loop();
  }
  function preview(index) {
    selected = index;
    const icon = items[index].querySelector('.nv-ico');
    if (!state.reduce && icon) {
      icon.removeAttribute('data-fx');
      // Replacing the animation attribute after layout restarts the icon scene.
      void icon.offsetWidth;
      icon.dataset.fx = items[index].dataset.effect || 'pop';
    }
    measure();
  }
  function restore() {
    const focused = items.indexOf(document.activeElement);
    selected = focused >= 0 ? focused : current;
    state.mouse.on = false;
    measure();
  }
  items.forEach((item, index) => {
    item.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') preview(index); });
    item.addEventListener('focus', () => preview(index));
    item.addEventListener('click', () => preview(index));
  });
  nav.addEventListener('pointerleave', restore);
  nav.addEventListener('focusout', event => { if (!nav.contains(event.relatedTarget)) { selected = current; measure(); } });
  nav.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const focused = items.indexOf(document.activeElement);
    const from = focused < 0 ? current : focused;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1
      : (from + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    items[index].focus();
  });
  nav.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || state.reduce) return;
    const bounds = nav.getBoundingClientRect();
    state.mouse = {x:event.clientX-bounds.left+PAD,y:event.clientY-bounds.top+PAD,s:state.mouse.s,on:true};
    loop();
  });
  nav.addEventListener('pointerdown', event => {
    if (state.reduce) return;
    const bounds = nav.getBoundingClientRect();
    state.rips.push({x:event.clientX-bounds.left+PAD,y:event.clientY-bounds.top+PAD,age:0,amp:.8});
    state.rips = state.rips.slice(-6);
    loop();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); state.glc = null; nav.dataset.gl = 'off'; draw();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try { state.glc = initGL(canvas); } catch { state.glc = null; }
    nav.dataset.gl = state.glc ? 'on' : 'off'; measure();
  });
  const resize = new ResizeObserver(() => { state.ready = false; measure(); });
  resize.observe(nav);
  items.forEach(item => resize.observe(item));
  const intersection = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible) { measure(); loop(); }
    else { cancelAnimationFrame(state.raf); state.raf = 0; }
  });
  intersection.observe(nav);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(state.raf); state.raf = 0; }
    else loop();
  });
  const theme = new MutationObserver(setTone);
  theme.observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
  motion.addEventListener('change', () => {
    state.reduce = motion.matches;
    cancelAnimationFrame(state.raf); state.raf = 0;
    state.rips = []; state.sats = []; state.mouse.s = 0;
    measure(); loop();
  });
  document.fonts?.ready.then(measure);
  // Handle bfcache restores without retaining an abandoned hover preview.
  window.addEventListener('pageshow', () => { selected = current; state.ready = false; measure(); });
  setTone(); measure();
}
document.querySelectorAll('.nimbus-nav').forEach(enhanceNavigation);
})();
