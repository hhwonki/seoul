// --- Meta Ray-Ban Display Transit Web App ---
const DPAD = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  SELECT: 'Enter',
  BACK: 'Escape',
  BACKSPACE: 'Backspace'
};

const STATE = {
  currentView: 'NEARBY', // 'NEARBY' | 'ARRIVALS'
  selectedIndex: 0,
  page: 0,
  pageSize: 3, // Exactly 3 items fit in 600x600 without scrolling
  selectedStop: null,
  nearbyStops: []
};

// Mock Fallback Data (reflecting Seoul transit coords if API key/proxy is missing)
const MOCK_STOPS = [
  { id: '1001', name: '강남역 2번출구', type: 'subway', distance: '120m', badge: '지하철' },
  { id: '1002', name: '강남역.역삼세무서 (02-283)', type: 'bus', distance: '180m', badge: '간선버스' },
  { id: '1003', name: '신논현역.구교보타워 (22-012)', type: 'bus', distance: '340m', badge: '광역버스' },
  { id: '1004', name: '역삼역 포스코타워 (02-120)', type: 'bus', distance: '510m', badge: '지선버스' }
];

const MOCK_ARRIVALS = {
  '1001': [
    { route: '2호선', arrival: '잠실행 약 2분 후 (곧 도착)', detail: '혼잡도: 보통' },
    { route: '신분당선', arrival: '신사행 약 4분 후', detail: '혼잡도: 여유' },
    { route: '2호선', arrival: '신도림행 약 5분 후', detail: '혼잡도: 혼잡' }
  ],
  '1002': [
    { route: '140번', arrival: '3분 전 [2번째 전]', detail: '잔여 14석' },
    { route: '470번', arrival: '6분 전 [4번째 전]', detail: '잔여 6석' },
    { route: '441번', arrival: '11분 전 [7번째 전]', detail: '잔여 21석' }
  ],
  'default': [
    { route: '도착 대기중', arrival: '운행 정보 수신 중', detail: '잠시 후 새로고침' }
  ]
};

// Focus Management
function getFocusables() {
  return Array.from(document.querySelectorAll('.focusable:not([disabled])'));
}

function updateFocus(index) {
  const items = getFocusables();
  if (!items.length) return;
  items.forEach(el => el.classList.remove('focused'));
  
  STATE.selectedIndex = Math.max(0, Math.min(index, items.length - 1));
  const active = items[STATE.selectedIndex];
  if (active) {
    active.classList.add('focused');
    active.focus();
  }
}

// Render Nearby Stops Screen
function renderNearbyView() {
  STATE.currentView = 'NEARBY';
  document.getElementById('screen-title').textContent = '내 주변 정류장/역';
  document.getElementById('status-bar').textContent = '좌우(◀▶) 페이지 이동 | 상하(▲▼) 탐색';
  document.getElementById('nav-hint').textContent = '▲▼ 이동 | Pinch/Enter 도착정보';

  const start = STATE.page * STATE.pageSize;
  const pageItems = STATE.nearbyStops.slice(start, start + STATE.pageSize);
  const totalPages = Math.ceil(STATE.nearbyStops.length / STATE.pageSize) || 1;
  document.getElementById('page-num').textContent = `${STATE.page + 1}/${totalPages}`;

  const container = document.getElementById('content-area');
  container.innerHTML = '';

  pageItems.forEach((item, idx) => {
    const btn = document.createElement('div');
    btn.className = 'focusable';
    btn.tabIndex = 0;
    btn.setAttribute('data-id', item.id);
    btn.innerHTML = `
      <div class="card-title">
        <span>${item.name}</span>
        <span class="card-badge ${item.type === 'subway' ? 'badge-subway' : 'badge-bus'}">${item.badge}</span>
      </div>
      <div class="card-desc">거리: ${item.distance}</div>
    `;
    btn.addEventListener('click', () => showArrivals(item));
    container.appendChild(btn);
  });

  updateFocus(0);
}

// Render Real-time Arrival View
function showArrivals(stop) {
  STATE.selectedStop = stop;
  STATE.currentView = 'ARRIVALS';
  document.getElementById('screen-title').textContent = stop.name;
  document.getElementById('status-bar').textContent = '실시간 도착 예정 정보';
  document.getElementById('nav-hint').textContent = 'Escape/Backspace 뒤로가기';
  document.getElementById('page-num').textContent = '실시간';

  const arrivals = MOCK_ARRIVALS[stop.id] || MOCK_ARRIVALS['default'];
  const container = document.getElementById('content-area');
  container.innerHTML = '';

  arrivals.forEach((arr) => {
    const card = document.createElement('div');
    card.className = 'focusable';
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="card-title">
        <span style="color:#00E5FF;">${arr.route}</span>
        <span class="card-arrival">${arr.arrival}</span>
      </div>
      <div class="card-desc">${arr.detail}</div>
    `;
    container.appendChild(card);
  });

  updateFocus(0);
}

// Global D-pad and Keydown Controller
document.addEventListener('keydown', (e) => {
  const items = getFocusables();

  switch (e.key) {
    case DPAD.UP:
      e.preventDefault();
      if (STATE.selectedIndex > 0) {
        updateFocus(STATE.selectedIndex - 1);
      }
      break;

    case DPAD.DOWN:
      e.preventDefault();
      if (STATE.selectedIndex < items.length - 1) {
        updateFocus(STATE.selectedIndex + 1);
      }
      break;

    case DPAD.LEFT:
      e.preventDefault();
      if (STATE.currentView === 'NEARBY' && STATE.page > 0) {
        STATE.page--;
        renderNearbyView();
      }
      break;

    case DPAD.RIGHT:
      e.preventDefault();
      const maxPages = Math.ceil(STATE.nearbyStops.length / STATE.pageSize) - 1;
      if (STATE.currentView === 'NEARBY' && STATE.page < maxPages) {
        STATE.page++;
        renderNearbyView();
      }
      break;

    case DPAD.SELECT:
      e.preventDefault();
      if (document.activeElement && document.activeElement.classList.contains('focusable')) {
        document.activeElement.click();
      }
      break;

    case DPAD.BACK:
    case DPAD.BACKSPACE:
      e.preventDefault();
      if (STATE.currentView === 'ARRIVALS') {
        renderNearbyView();
      }
      break;

    default:
      break;
  }
});

// App Initialization & Geolocation Fetch
function initApp() {
  STATE.nearbyStops = MOCK_STOPS;
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById('status-bar').textContent = `GPS 감지 완료 (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`;
        renderNearbyView();
      },
      () => {
        document.getElementById('status-bar').textContent = '기본 위치 기준 정류장';
        renderNearbyView();
      },
      { timeout: 5000 }
    );
  } else {
    renderNearbyView();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
