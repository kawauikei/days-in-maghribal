/* --- js/main.js --- */

// グローバル変数
let stats = { health: 0, body: 0, mind: 0, magic: 0, fame: 0, money: 0 };
let turn = 1, maxTurn = 20, isEventActive = false, isGameStarted = false, isTyping = false, targetText = "";
let messageQueue = [], currentMsgIndex = 0, pendingResultHtml = "", typeInterval;
let consecutiveNormalEvents = 0, lastEventWasHeroine = false, isForcedHeroine = false, isResultDisplayed = false;
let currentGameLog = [], isViewingPastLog = false;
let unlockedBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeImpacts = Array(12).fill(false);
const gameAssets = { events: {}, heroines: {} };

let heroineImpacts = []; 
let isResultHidden = false;
let lastEventContext = null; 
let lastEventResult = null;
let monologueInterval;
let specialData = []; 
let monologueData = {}; 
let heroineReactions = {}; 
let clearedHeroines = [];

// 音声ファイル
const sePi = new Audio('se/pi.mp3'); 
const seOp = new Audio('se/op.mp3'); 
const seFootstep = new Audio('se/za.mp3'); 
const sePage = new Audio('se/pera.mp3');
const bgmOp = new Audio('bgm/op.mp3'); bgmOp.loop = true; bgmOp.volume = 0.3;
const bgmMap = new Audio('bgm/map.mp3'); bgmMap.loop = true; bgmMap.volume = 0.3;
const bgmEd = new Audio('bgm/ed.mp3'); bgmEd.loop = true; bgmEd.volume = 0.3;

function playSE(audio) {
    const clone = audio.cloneNode();
    clone.volume = audio.volume;
    clone.play();
}

// 初期化処理
window.onload = async () => {
    const statusEl = document.getElementById("load-status"); const barFill = document.getElementById("load-bar-fill");
    const assetsToLoad = []; scenarios.forEach(s => assetsToLoad.push({ type: 'event', file: s.file })); heroines.forEach(h => assetsToLoad.push({ type: 'heroine', file: h.file }));
    let loadedCount = 0;
    
    // データ読み込み
    const loadPromises = assetsToLoad.map(async (asset) => {
        try {
            if (asset.type === 'event') { gameAssets.events[asset.file] = await fetch(`data/events/${asset.file}.json`).then(r => r.json()); }
            else if (asset.type === 'heroine') { gameAssets.heroines[asset.file] = await fetch(`data/heroines/${asset.file}.json`).then(r => r.json()); }
            loadedCount++; const percent = (loadedCount / assetsToLoad.length) * 100; barFill.style.width = percent + "%"; statusEl.innerText = `Loading: ${asset.file} (${Math.round(percent)}%)`;
        } catch (e) { console.error(e); }
    });
    await Promise.all(loadPromises);
    
    try {
        const monoRes = await fetch('data/events/monologues.json');
        const monoJson = await monoRes.json();
        monologueData = monoJson.common;
        heroineReactions = monoJson.heroines;

        const specRes = await fetch('data/events/special.json');
        specialData = await specRes.json();
    } catch (e) { console.error("Data load failed", e); }

    // 特典データのマッピング
    heroineImpacts = heroines.map(h => {
        const conf = impactConfig[h.name];
        if (!conf) return { target: 0, sec: 0, eco: 0, name: "Unknown", btnLabel: "???" };
        const targetIdx = scenarios.findIndex(s => s.name === conf.targetName);
        return { 
            target: targetIdx !== -1 ? targetIdx : 0, 
            sec: conf.sec, eco: conf.eco, name: conf.name,
            btnLabel: `${conf.targetName} +`
        };
    });

    // セーブデータのロード
    const savedB = localStorage.getItem('maghribal_boosts'); if(savedB) unlockedBoosts = JSON.parse(savedB);
    const savedA = localStorage.getItem('maghribal_active_boosts'); if(savedA) activeBoosts = JSON.parse(savedA);
    const savedI = localStorage.getItem('maghribal_active_impacts'); if(savedI) activeImpacts = JSON.parse(savedI);
    const savedC = localStorage.getItem('maghribal_cleared_heroines'); if(savedC) clearedHeroines = JSON.parse(savedC);

    loadHeroineProgress();

    initUI(); displayPastRecords(); renderBoostButtons();
    resizeGameContainer(); window.addEventListener('resize', resizeGameContainer);
    setTimeout(() => { document.getElementById("loading-screen").style.display = "none"; }, 800);
};

function saveHeroineProgress() { const progressData = heroines.map(h => h.progress); localStorage.setItem('maghribal_heroine_progress', JSON.stringify(progressData)); }
function loadHeroineProgress() { const saved = localStorage.getItem('maghribal_heroine_progress'); if (saved) { const progressData = JSON.parse(saved); heroines.forEach((h, i) => { if (progressData[i] !== undefined) h.progress = progressData[i]; }); } }
function resizeGameContainer() { const container = document.getElementById('game-container'); const targetW = 1280; const targetH = 720; const windowW = window.innerWidth; const windowH = window.innerHeight; const scaleW = windowW / targetW; const scaleH = windowH / targetH; const scale = Math.min(scaleW, scaleH); container.style.transform = `scale(${scale})`; }
function toggleFullScreen() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => { console.log(err); }); } else { if (document.exitFullscreen) { document.exitFullscreen(); } } }

// UI初期化
function initUI() {
    const list = document.getElementById("stat-list"); list.innerHTML = ""; statKeys.forEach(k => { list.innerHTML += `<div style="margin-bottom:10px;"><div style="display:flex; justify-content:space-between; font-size:14px;"><span class="stat-label" style="color:${statColors[k]};"><i class="fa-solid ${statConfig[k].icon}"></i> ${statConfig[k].name}</span><span id="stat-${k}" style="color:${statColors[k]}; font-weight:bold;">Low</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" id="bar-${k}" style="background:${statColors[k]};"></div></div></div>`; });
    const container = document.getElementById("map-spots-container"); container.innerHTML = ""; 
    spotAssignments.forEach((assign, i) => { 
        const spot = document.createElement("div"); spot.className = "map-spot"; spot.style.left = assign.l + "%"; spot.style.top = assign.t + "%"; spot.onclick = (e) => { e.stopPropagation(); handleSpotClick(spot, i); }; 
        spot.innerHTML = `<div class="spot-core"></div><div class="orb orb-main" style="background:${statColors[assign.main]}; color:${statColors[assign.main]};"></div><div class="orb orb-sub" style="background:${statColors[assign.sub]}; color:${statColors[assign.sub]};"></div><div class="hint-container"><div class="hint-text"><i class="fa-solid ${scenarios[i].icon}" style="margin-right:5px; font-size:0.9em;"></i>${scenarios[i].name}<div class="recommend-icon"><i class="fa-solid fa-angles-up"></i></div></div></div>`; 
        container.appendChild(spot); 
    }); 
    updateRecommend();
}

function updateMonologue(type = 'random') {
    const container = document.getElementById('monologue-container');
    const textEl = container.querySelector('.monologue-text');
    
    if (activeImpacts.findIndex(Boolean) !== -1) { container.style.display = 'none'; return; }

    let text = "";
    let pool = [];

    if (type === 'start') {
        pool = monologueData.start;
    } else if (lastEventContext) { 
        const { name, progress } = lastEventContext;
        const stage = Math.min(progress - 1, 5); 
        if (heroineReactions[name] && heroineReactions[name][stage]) {
            text = heroineReactions[name][stage];
        } else {
            pool = monologueData.success; 
        }
        lastEventContext = null;
    } else {
        const maxStats = statKeys.filter(k => stats[k] >= 50);
        if (maxStats.length > 0 && Math.random() < 0.3) { pool = monologueData.stat_max; } 
        else if (lastEventResult && Math.random() < 0.7) {
            pool = (lastEventResult === 'success' || lastEventResult === 'great_success') ? monologueData.success : monologueData.failure;
            lastEventResult = null;
        }
        else if (Math.random() < 0.4) { 
            const unmetHeroines = heroines.filter(h => h.progress === 0);
            if (unmetHeroines.length > 0 && Math.random() < 0.5) {
                const target = unmetHeroines[Math.floor(Math.random() * unmetHeroines.length)];
                const originalIdx = heroines.indexOf(target);
                if (originalIdx !== -1) {
                    text = `噂によると、${scenarios[originalIdx].name}の方に${target.title}がいるらしい。`;
                }
            } else {
                pool = monologueData.hint_weak;
            }
        }
        else {
            if (turn < 5) pool = monologueData.progress_low;
            else if (turn < 15) pool = monologueData.progress_mid;
            else pool = monologueData.progress_high;
        }
    }
    if (!text) {
        if (!pool || pool.length === 0) pool = monologueData.progress_mid;
        text = pool[Math.floor(Math.random() * pool.length)];
    }

    currentGameLog.push(`<div class="log-entry monologue-log">（独り言）${text}</div>`);
    const logContent = document.getElementById("log-content");
    if (logContent) logContent.innerHTML = currentGameLog.join('');

    textEl.innerHTML = "";
    container.style.display = 'flex';
    container.classList.remove('visible');
    void container.offsetWidth; 
    container.classList.add('visible');
    
    clearInterval(monologueInterval);
    let i = 0;
    monologueInterval = setInterval(() => {
        textEl.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(monologueInterval);
    }, 50);
}

function updateMapState() {
    const activeIdx = activeImpacts.findIndex(Boolean);
    const spots = document.querySelectorAll('.map-spot');
    
    spots.forEach((spot, i) => {
        spot.classList.remove('spot-disabled');
        if (activeIdx !== -1) {
            const target = heroineImpacts[activeIdx].target;
            if (i !== target) spot.classList.add('spot-disabled');
        }
    });
    
    const displayEl = document.getElementById("turn-display");
    if (!displayEl) return;

    if (activeIdx !== -1) {
        displayEl.innerHTML = `<span style="margin-right:15px; font-weight:bold;"><i class="fa-solid fa-hourglass-start"></i> TURN</span><span id="turn-count">1</span>/1`;
    } else {
        displayEl.innerHTML = `<span style="margin-right:15px; font-weight:bold;"><i class="fa-solid fa-hourglass-start"></i> TURN</span><span id="turn-count">${turn}</span>/20`;
    }
}

function updateRecommend() {
    const vals = Object.values(stats); const minVal = Math.min(...vals); const weakStats = statKeys.filter(k => stats[k] === minVal);
    spotAssignments.forEach((assign, i) => { const isRec = weakStats.includes(assign.main) || weakStats.includes(assign.sub); const spot = document.querySelectorAll('.map-spot')[i]; if(spot) { const icon = spot.querySelector('.recommend-icon'); if(icon) { if (isRec) icon.classList.add('visible'); else icon.classList.remove('visible'); } } });
}
function updateUI(k) { const v = stats[k]; const bar = document.getElementById(`bar-${k}`); if(bar) bar.style.width = (v * 2) + "%"; const label = document.getElementById(`stat-${k}`); if(label) { const labs = ["Low", "Normal", "High", "Expert", "Master", "Legend"]; label.innerText = labs[Math.min(Math.floor(v/10),5)]; } updateRecommend(); }

// イベント処理
function handleSpotClick(el, idx) {
    document.getElementById('monologue-container').classList.remove('visible');

    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1 && idx !== heroineImpacts[activeIdx].target) return;

    if (!isGameStarted || isEventActive || (activeIdx === -1 && turn > maxTurn)) return; 
    
    isEventActive = true; 
    isResultDisplayed = false; 
    isResultHidden = false;
    playSE(seFootstep); 
    
    let stopBgm = false;

    el.querySelector('.hint-text').classList.add('selected-yellow'); document.querySelectorAll('.map-spot').forEach(s => s.classList.remove('spot-visible'));
    
    const s = scenarios[idx], h = heroines[idx]; h.events = gameAssets.heroines[h.file].events; const avgStat = Object.values(stats).reduce((a, b) => a + b, 0) / 6, assign = spotAssignments[idx], anyM = heroines.some(hero => hero.progress >= 5);
    const minVal = Math.min(...Object.values(stats)); const weakStats = statKeys.filter(k => stats[k] === minVal); const isRecommended = weakStats.includes(assign.main) || weakStats.includes(assign.sub);
    let isH = false, dMsg = "", bCh = {}, out = 'success';

    if (activeIdx !== -1) {
        isH = false; isResultHidden = true; stopBgm = true;
        if (specialData[activeIdx]) {
            dMsg = specialData[activeIdx].text;
            bCh = specialData[activeIdx].changes;
        } else {
            dMsg = "イベントデータが見つかりません。";
            bCh = {};
        }
        out = 'exclusive'; 
    } else {
        let chance = isForcedHeroine ? 1.0 : (stats[assign.main] / 50) + (consecutiveNormalEvents * 0.1); if (chance < 0.05) chance = 0.05; if (lastEventWasHeroine && !isForcedHeroine) chance = 0;
        
        if (h.progress >= 5) { 
            isH = true; lastEventWasHeroine = true; isResultHidden = true; stopBgm = true;
            dMsg = "【後日談】\n" + (h.afterMsg || "穏やかな時間が流れた。"); bCh[assign.main] = 5; bCh[assign.sub] = 2; out = 'heroine'; 
            lastEventContext = { name: h.name, progress: 6 }; 
            
            if (!clearedHeroines.includes(h.name)) {
                clearedHeroines.push(h.name);
                localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
            }
        } 
        else if (anyM && h.progress >= 1) { 
            isH = true; lastEventWasHeroine = true; stopBgm = true;
            dMsg = "【世間話】\n" + (h.chatMsg || "何気ない世間話をして別れた。"); bCh[assign.main] = 2; bCh[assign.sub] = 1; out = 'heroine'; 
        } 
        else if (Math.random() < chance) { 
            const reqA = h.minAvg[Math.min(h.progress, 4)] || 0, reqS = (h.progress + 1) * 8, mIdx = h.progress < 2 ? 0 : 1; 
            if (avgStat < reqA) { isH = false; lastEventWasHeroine = false; dMsg = h.lockAvgMsgs[mIdx]; bCh[assign.main] = 1; bCh[assign.sub] = 1; out = 'hint'; } 
            else if (stats[assign.main] < reqS) { isH = false; lastEventWasHeroine = false; dMsg = h.lockStatMsgs[mIdx]; bCh[assign.main] = 1; bCh[assign.sub] = 1; out = 'hint'; } 
            else { 
                isH = true; lastEventWasHeroine = true; consecutiveNormalEvents = 0; stopBgm = true;
                dMsg = h.events[Math.min(h.progress, 4)]; 
                h.progress++; h.affection++; 
                if (h.progress >= 3) isResultHidden = true; 
                bCh[assign.main] = 5; bCh[assign.sub] = 2; out = 'heroine'; 
                lastEventContext = { name: h.name, progress: h.progress };
                saveHeroineProgress(); 

                if (h.progress >= 5) {
                    if (!clearedHeroines.includes(h.name)) {
                        clearedHeroines.push(h.name);
                        localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
                    }
                }
            } 
        } 
        else { 
            isH = false; lastEventWasHeroine = false; consecutiveNormalEvents++; 
            const tier = (turn / maxTurn <= 1/6) ? 'newcomer' : (turn / maxTurn <= 5/6 ? 'mid' : 'veteran'); 
            let pool = gameAssets.events[s.file].filter(e => e.tier === tier); 
            if (isRecommended) { const successPool = pool.filter(e => e.outcome !== 'failure'); if (successPool.length > 0) pool = successPool; } 
            const ev = pool[Math.floor(Math.random() * pool.length)] || {text:"静かな時が流れた。", changes:{}}; 
            dMsg = ev.text; bCh = {...(ev.changes || {})}; out = ev.outcome; 
            lastEventResult = out;
        }
        if (isRecommended) { for (let k in bCh) { if (bCh[k] > 0) bCh[k] += 1; } }
    }
    
    if (stopBgm) bgmMap.pause();
    applyEventView(dMsg, bCh, isH, h, s, out, idx);
}

function getLocStatusHtml(idx) {
    // 【修正】defaultRegionStatsはgame_data.jsで定義されています
    let sec = defaultRegionStats[idx].sec; 
    let eco = defaultRegionStats[idx].eco; 
    activeImpacts.forEach((isActive, hId) => { 
        if (isActive && heroineImpacts[hId].target === idx) { 
            sec += heroineImpacts[hId].sec; eco += heroineImpacts[hId].eco; 
        } 
    }); 
    sec = Math.max(1, Math.min(5, sec)); 
    eco = Math.max(1, Math.min(5, eco)); 
    const stars = (n) => '★'.repeat(n) + '<span style="opacity:0.3">★</span>'.repeat(5-n); 
    return `<span style="display:flex; align-items:center; color:#fff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px #000;"><i class="fa-solid fa-shield-halved" style="color:#aaa; margin-right:4px;"></i> ${stars(sec)}</span><span style="display:flex; align-items:center; color:#fff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px #000;"><i class="fa-solid fa-scale-balanced" style="color:#d4af37; margin-right:4px;"></i> ${stars(eco)}</span>`;
}

function applyEventView(msg, changes, isH, h, s, out, idx) {
    for (let k in changes) { stats[k] = Math.max(0, Math.min(stats[k] + (changes[k] || 0), 50)); updateUI(k); } checkRankUpdate(); 
    let cLog = isResultHidden ? "" : getResultHtml(changes); 
    let outcomeHtml = ""; 
    if (!isH && out !== 'hint' && out !== 'heroine' && out !== 'exclusive') { 
        if (out === 'great_success') outcomeHtml = `<span class="outcome-badge great">【大成功】</span>`; 
        else if (out === 'success') outcomeHtml = `<span class="outcome-badge success">【成功】</span>`; 
        else if (out === 'failure') outcomeHtml = `<span class="outcome-badge failure">【失敗】</span>`; 
    } 
    let logL = isH ? `(<i class="fa-solid ${h ? h.icon : ''}"></i> ${h ? h.name : ''})` : ""; const locLabel = `<i class="fa-solid ${s.icon}"></i> ${s.name}`; currentGameLog.push(`<div class="log-entry"><div class="log-header">Turn ${turn} : ${locLabel} ${logL} ${outcomeHtml} ${getResultHtml(changes)}</div><div class="log-body">${formatGameText(msg).replace(/\n/g, '<br>')}</div></div>`); document.getElementById("log-content").innerHTML = currentGameLog.join(''); document.getElementById("background-layer").style.transformOrigin = `${spotAssignments[idx].l}% ${spotAssignments[idx].t}%`; document.getElementById("background-layer").style.transform = `scale(${s.zoom || 2.5})`; document.getElementById("background-layer").classList.add("blur-bg"); messageQueue = msg.split('\n').filter(line => line.trim() !== ""); currentMsgIndex = 0; isResultDisplayed = false; pendingResultHtml = outcomeHtml + cLog; document.getElementById("loc-icon").innerHTML = `<i class="fa-solid ${s.icon}"></i>`; document.getElementById("loc-name").innerText = s.name; document.getElementById("loc-stats").innerHTML = getLocStatusHtml(idx); const cb = document.getElementById("char-name-badge"); if (isH && h) { cb.innerHTML = `<i class="fa-solid ${h.icon}"></i> ${h.title} ${h.name}`; cb.style.display = "flex"; } else cb.style.display = "none"; document.getElementById("message-text").innerHTML = ""; document.getElementById("result-display").innerHTML = ""; document.getElementById("result-display").style.opacity = "0"; document.getElementById("page-cursor").classList.remove("active"); document.getElementById("message-window").classList.add("active"); document.getElementById("click-overlay").classList.add("active"); setTimeout(advanceMessage, 300);
}

function advanceMessage() { 
    const cursor = document.getElementById("page-cursor"); 
    if (isTyping) { finishTyping(); return; } 
    if (currentMsgIndex < messageQueue.length) { 
        cursor.classList.remove("active"); targetText = messageQueue[currentMsgIndex++]; typeWriter(document.getElementById("message-text"), targetText, 15); 
    } else {
        if (isResultHidden) { closeEvent(); } else if (!isResultDisplayed) { cursor.classList.remove("active"); showFinalResult(); cursor.classList.add("active"); } else { cursor.classList.remove("active"); closeEvent(); }
    }
}

function typeWriter(el, text, speed) { let i = 0; el.innerHTML = ""; isTyping = true; typeInterval = setInterval(() => { if (i < text.length) { el.innerHTML = formatGameText(text.substring(0, i + 1)); i++; } else { finishTyping(); } }, speed); }
function finishTyping() { clearInterval(typeInterval); isTyping = false; document.getElementById("message-text").innerHTML = formatGameText(targetText); document.getElementById("page-cursor").classList.add("active"); }
function showFinalResult() { playSE(sePage); const resDiv = document.getElementById("result-display"); resDiv.innerHTML = pendingResultHtml; resDiv.style.opacity = "1"; isResultDisplayed = true; document.getElementById("page-cursor").classList.add("active"); }
function getResultHtml(changes) { let h = ''; for (let k in changes) { if (changes[k] !== 0) { const arrow = changes[k] > 0 ? `<span style="color:#76ff03; font-size:0.8em;">▲</span>` : `<span style="color:#ea80fc; font-size:0.8em;">▼</span>`; h += `<span style="color:${statColors[k]}; margin:0 8px; font-weight:bold; white-space:nowrap;"><i class="fa-solid ${statConfig[k].icon}"></i> ${statConfig[k].name}${arrow}</span>`; } } return h; }

function closeEvent() { 
    document.getElementById("background-layer").style.transform = "scale(1)"; document.getElementById("background-layer").classList.remove("blur-bg"); document.getElementById("message-window").classList.remove("active"); document.getElementById("click-overlay").classList.remove("active"); document.getElementById("page-cursor").classList.remove("active"); 
    if (bgmMap.paused && activeImpacts.findIndex(Boolean) === -1) bgmMap.play();

    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1) { 
        document.getElementById('fade-overlay').classList.add('active'); bgmMap.pause(); setTimeout(showEnding, 1500); 
        return; 
    }

    setTimeout(() => { 
        if (turn >= maxTurn) { 
            updateMonologue(); 
            setTimeout(() => { document.getElementById('fade-overlay').classList.add('active'); bgmMap.pause(); setTimeout(showEnding, 3000); }, 3000);
        } else { 
            turn++; document.getElementById("turn-count").innerText = turn; isEventActive = false; 
            updateMonologue(); 
            document.querySelectorAll('.map-spot').forEach(s => { s.classList.add('spot-visible'); s.querySelector('.hint-text').classList.remove('selected-yellow'); }); 
        } 
    }, 250); 
}

function formatGameText(text) { return text.replace(/@(\w+)@/g, (m, k) => `<span style="color:${statColors[k]}">${statConfig[k].name}</span>`); }

// 【修正】toggle系のロジックをclassList方式に変更（確実性アップ）
function toggleStats() { 
    playSE(sePi); 
    const p = document.getElementById("stats-panel"); 
    // .hidden-panel クラスで制御
    if (p.classList.contains("visible-panel")) {
        p.classList.remove("visible-panel");
    } else {
        p.classList.add("visible-panel");
    }
}

function toggleLog() { 
    playSE(sePi); 
    const l = document.getElementById("log-overlay"); 
    // flexなので visible-flex-panel クラスで制御
    if (l.classList.contains("visible-flex-panel")) {
        l.classList.remove("visible-flex-panel");
    } else {
        l.classList.add("visible-flex-panel");
        document.getElementById("log-window").scrollTop = document.getElementById("log-window").scrollHeight; 
    } 
}

function checkRankUpdate() { const total = Object.values(stats).reduce((sum, v) => sum + v, 0), btn = document.getElementById("status-toggle-btn"); let rank = total >= 150 ? "legend" : (total >= 100 ? "gold" : (total >= 50 ? "silver" : "bronze")); [btn, document.getElementById("stats-panel")].forEach(el => { if(el) { el.classList.remove("rank-silver", "rank-gold", "rank-legend"); if (rank !== "bronze") el.classList.add("rank-" + rank); } }); }

function renderBoostButtons() { 
    const container = document.getElementById("boost-container"); if(!container) return; container.innerHTML = ""; 
    const statSection = document.createElement("div"); statSection.className = "boost-section"; statSection.innerHTML = `<div class="boost-section-title">- START BONUS -</div>`; container.appendChild(statSection);
    statKeys.forEach(k => { const btn = document.createElement("button"); btn.className = `boost-btn ${unlockedBoosts[k] ? 'unlocked' : ''} ${activeBoosts[k] ? 'active' : ''}`; btn.innerHTML = `<i class="fa-solid ${statConfig[k].icon}"></i> ${statConfig[k].name} +10`; btn.onclick = (e) => { e.stopPropagation(); if(!unlockedBoosts[k]) return; activeBoosts[k] = !activeBoosts[k]; localStorage.setItem('maghribal_active_boosts', JSON.stringify(activeBoosts)); playSE(sePi); renderBoostButtons(); }; statSection.appendChild(btn); });
    const impactSection = document.createElement("div"); impactSection.className = "boost-section"; impactSection.innerHTML = `<div class="boost-divider"></div><div class="boost-section-title">- WORLD INFLUENCE -</div>`; container.appendChild(impactSection);
    heroines.forEach((h, i) => { const impact = heroineImpacts[i]; const targetScene = scenarios[impact.target]; const isActive = activeImpacts[i]; 
    const isUnlocked = clearedHeroines.includes(h.name); 
    const btn = document.createElement("button"); btn.className = `boost-btn ${isUnlocked ? 'unlocked' : ''} ${isActive ? 'active' : ''}`; 
    btn.innerHTML = `<i class="fa-solid ${targetScene.icon}"></i> ${impact.btnLabel}`; 
    btn.onclick = (e) => { e.stopPropagation(); if (!isUnlocked) return; const wasActive = activeImpacts[i]; activeImpacts.fill(false); if (!wasActive) activeImpacts[i] = true; localStorage.setItem('maghribal_active_impacts', JSON.stringify(activeImpacts)); playSE(sePi); renderBoostButtons(); }; impactSection.appendChild(btn); });
}

function saveCurrentGameLog() { 
    const activeIdx = activeImpacts.findIndex(Boolean); if (activeIdx !== -1) return; 
    const total = Object.values(stats).reduce((sum, v) => sum + v, 0); const rank = total >= 150 ? "LEGEND" : (total >= 100 ? "GOLD" : (total >= 50 ? "SILVER" : "BRONZE")); const best = heroines.reduce((a, b) => a.affection > b.affection ? a : b); let partnerStr = "None", partnerHTML = ""; if (best && best.affection > 0) { partnerStr = best.name; const hIcon = `<i class="fa-solid ${best.icon}" style="font-size:0.9em; opacity:0.8;"></i> `; let affinityHTML = ""; if (best.progress >= 5) affinityHTML = ` <i class="fa-solid fa-mound bouquet-icon" style="font-size:0.8em;"></i>`; else if (best.progress >= 3) affinityHTML = ` <i class="fa-solid fa-seedling affinity-seedling" style="font-size:0.8em;"></i>`; else affinityHTML = ` <i class="fa-solid fa-leaf affinity-leaf" style="font-size:0.8em;"></i>`; partnerHTML = `${hIcon}${best.name}${affinityHTML}`; } else { const maxK = [...statKeys].sort((a, b) => stats[b] - stats[a])[0]; partnerStr = soloTitles[maxK]; partnerHTML = partnerStr; } const now = new Date(); const dateStr = (now.getMonth()+1) + "/" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0'); const newRecord = { date: dateStr, rank: rank, partner: partnerStr, partnerHTML: partnerHTML, log: currentGameLog.join('') }; let records = JSON.parse(localStorage.getItem('maghribal_logs') || "[]"); records.push(newRecord); if (records.length > 10) records.shift(); localStorage.setItem('maghribal_logs', JSON.stringify(records)); displayPastRecords(); 
}
function showEnding() { 
    processBoostUnlock(); 
    if (activeImpacts.findIndex(Boolean) === -1) saveCurrentGameLog();
    localStorage.removeItem('maghribal_heroine_progress'); 
    document.getElementById("ed-screen").classList.remove("hidden-screen"); 
    bgmMap.pause(); bgmEd.currentTime = 0; bgmEd.play();
    
    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1) {
        document.getElementById("ed-rank").innerText = "SPECIAL EPISODE CLEAR";
        const h1 = heroines[activeIdx];
        const tIdx = heroineImpacts[activeIdx].target;
        const scene = scenarios[tIdx];
        const h2 = heroines.find(h => h.file === scene.file) || heroines[tIdx];
        const partnerHTML = `<span style="display:flex; align-items:center; gap:8px;"><i class="fa-solid ${h1.icon}"></i> ${h1.name} <span style="font-size:0.8em; opacity:0.7;">+</span> <i class="fa-solid ${scene.icon}"></i> ${scene.name} <span style="font-size:0.8em; opacity:0.7;">+</span> <i class="fa-solid ${h2.icon}"></i> ${h2.name}</span>`;
        document.getElementById("ed-heroine").innerHTML = partnerHTML;
        document.getElementById("ed-stats").innerHTML = ""; 
    } else {
        const total = Object.values(stats).reduce((sum, v) => sum + v, 0); let rank = total >= 150 ? "LEGEND" : (total >= 100 ? "GOLD" : (total >= 50 ? "SILVER" : "BRONZE")); document.getElementById("ed-rank").innerText = `Rank: ${rank}`; let best = heroines.reduce((a, b) => a.affection > b.affection ? a : b); let endingDisplay = ""; if (best && best.affection > 0) { const hIcon = `<i class="fa-solid ${best.icon}" style="margin:0 10px;"></i>`; let affinityIcon = ""; if (best.progress >= 5) affinityIcon = `<span class="affinity-icon bouquet-icon"><i class="fa-solid fa-mound"></i></span>`; else if (best.progress >= 3) affinityIcon = `<span class="affinity-icon affinity-seedling" style="margin-left:8px;"><i class="fa-solid fa-seedling"></i></span>`; else affinityIcon = `<span class="affinity-icon affinity-leaf" style="margin-left:8px;"><i class="fa-solid fa-leaf"></i></span>`; endingDisplay = `Partner: ${hIcon} ${best.name}${affinityIcon}`; } else { const maxK = [...statKeys].sort((a, b) => stats[b] - stats[a])[0]; endingDisplay = `称号: ${soloTitles[maxK]}`; } document.getElementById("ed-heroine").innerHTML = endingDisplay; let h = ""; statKeys.forEach(k => { const val = Math.floor(stats[k]); const isMax = val >= 50; const color = statColors[k]; const borderStyle = isMax ? `border: 2px solid ${color}; box-shadow: 0 0 10px ${color};` : ""; const iconStyle = isMax ? `color: ${color};` : ""; const maxLabel = isMax ? `<span class="max-label" style="color:${color}">MAX</span>` : ""; h += `<div class="ed-stat-box" style="${borderStyle}"><i class="fa-solid ${statConfig[k].icon}" style="${iconStyle}"></i><div style="font-size:9px; color:#ccc;">${statConfig[k].name}</div><span class="ed-stat-val">${val}</span>${maxLabel}</div>`; }); document.getElementById("ed-stats").innerHTML = h; 
    }
    document.getElementById("boost-container").style.display = "none"; renderBoostButtons(); 
    setTimeout(() => { document.getElementById('fade-overlay').classList.remove('active'); }, 500);
}
function displayPastRecords() { const records = JSON.parse(localStorage.getItem('maghribal_logs') || "[]"); const container = document.getElementById("past-records-list"); if (!container) return; if (records.length === 0) { container.innerHTML = "<div style='font-size:10px; color:#666; padding:10px; text-align:center;'>NO RECORDS YET.</div>"; return; } container.innerHTML = records.slice().reverse().map((rec, idx) => `<div class="record-item" onclick="viewSpecificLog(${records.length - 1 - idx})"><span class="record-rank" style="color:${rankColors[rec.rank] || '#fff'}">[${rec.rank}]</span><span class="record-partner">${rec.partnerHTML || rec.partner}</span><span class="record-date">${rec.date}</span></div>`).join(''); }
function viewSpecificLog(idx) { const records = JSON.parse(localStorage.getItem('maghribal_logs') || "[]"); const rec = records[idx]; if (rec) { isViewingPastLog = true; const logWindow = document.getElementById("log-window"); document.getElementById("log-content").innerHTML = rec.log; toggleLog(); logWindow.scrollTop = 0; } }
function toggleDebugPanel() { const p = document.getElementById("debug-panel"); p.style.display = p.style.display === "block" ? "none" : "block"; if(p.style.display === "block") { renderHeroineSliders(); initDebugEventTester(); } }
function debugModTurn(amount) { turn = Math.max(1, Math.min(maxTurn, turn + amount)); updateMapState(); }
function initDebugEventTester() { const m = document.getElementById("debug-map-select"); if (m.options.length > 0) return; scenarios.forEach((s, i) => { const o = document.createElement("option"); o.value = i; o.innerText = s.name; m.appendChild(o); }); updateDebugEventList(); }
function updateDebugEventList() { const mIdx = document.getElementById("debug-map-select").value; const eS = document.getElementById("debug-event-select"); const pool = gameAssets.events[scenarios[mIdx].file]; eS.innerHTML = ""; if (!pool) return; pool.forEach((ev, i) => { const o = document.createElement("option"); o.value = i; o.innerText = `[${ev.tier}] ${ev.text.substring(0, 10)}...`; eS.appendChild(o); }); }
function launchDebugTestEvent() { const mIdx = document.getElementById("debug-map-select").value; const eIdx = document.getElementById("debug-event-select").value; const s = scenarios[mIdx]; const ev = gameAssets.events[s.file][eIdx]; if(!ev) return; isEventActive = true; isResultDisplayed = false; applyEventView(ev.text, ev.changes||{}, false, null, s, ev.outcome, mIdx); }
function renderHeroineSliders() { const c = document.getElementById("debug-heroine-sliders"); c.innerHTML = ""; heroines.forEach((h, i) => { const d = document.createElement("div"); d.innerHTML = `<div style="font-size:9px;">${h.title} ${h.name} Lv.${h.progress}</div><input type="range" min="0" max="5" value="${h.progress}" oninput="heroines[${i}].progress=parseInt(this.value); heroines[${i}].affection=parseInt(this.value); this.previousSibling.innerText='${h.title} ${h.name} Lv.'+this.value">`; c.appendChild(d); }); }
function debugResetAllData() { if(confirm("全消去しますか？")) { localStorage.clear(); location.reload(); } }
function debugMaxStats() { statKeys.forEach(k => { stats[k] = 50; updateUI(k); }); checkRankUpdate(); }
function debugFinishGame() { document.getElementById('fade-overlay').classList.add('active'); bgmMap.pause(); setTimeout(showEnding, 1500); }
function debugToggleBoosts() { 
    const isL = statKeys.some(k => !unlockedBoosts[k]); 
    statKeys.forEach(k => { unlockedBoosts[k] = isL; }); 
    if (isL) { clearedHeroines = heroines.map(h => h.name); } else { clearedHeroines = []; }
    localStorage.setItem('maghribal_boosts', JSON.stringify(unlockedBoosts)); 
    localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines)); 
    renderBoostButtons(); 
}
function toggleForceHeroine() { isForcedHeroine = !isForcedHeroine; document.getElementById("force-heroine-btn").innerText = isForcedHeroine ? "♥ Force: ON" : "♥ Force: OFF"; document.getElementById("force-heroine-btn").classList.toggle("active", isForcedHeroine); }

// startOPのフェードロジック修正
function startOP() { 
    resizeGameContainer(); 
    currentGameLog = []; 
    document.getElementById("log-content").innerHTML = ""; 
    document.getElementById("boost-container").style.display = "none"; 
    document.getElementById("top-ui-container").style.display = "none"; 
    
    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1) { statKeys.forEach(k => { stats[k] = 0; updateUI(k); }); } else { statKeys.forEach(k => { stats[k] = activeBoosts[k] ? 10 : 0; updateUI(k); }); }
    bgmOp.pause(); bgmOp.currentTime = 0; bgmOp.play(); 
    document.getElementById("title-screen").classList.add("hidden-screen"); 
    
    setTimeout(() => { 
        document.getElementById("op-screen").classList.remove("hidden-screen"); 
        const opLines = (activeIdx !== -1) ? heroineOPLines[activeIdx] : ["陽が沈む西の地、マグリバル。", "ここには名声、富、知識、そして力が眠っている。", "残された時間は、そう長くはない。", "どの道を歩み、何者となるか。", "全ては汝の選択に委ねられている。"];
        updateMapState(); 
        
        let idx = 0; 
        const opDiv = document.getElementById("op-text"); 
        
        // クラスベースのフェードに変更
        const showLine = () => { 
            opDiv.classList.remove("visible"); // 一旦透明に
            setTimeout(() => { 
                opDiv.innerHTML = opLines[idx]; 
                opDiv.classList.add("visible"); // フェードイン
            }, 400); 
        }; 
        showLine(); 
        
        window.nextOP = () => { 
            idx++; 
            if (idx < opLines.length) showLine(); 
            else { 
                document.getElementById("op-screen").classList.add("hidden-screen"); 
                // UIパネルの初期化（非表示状態を保証）
                document.getElementById("stats-panel").classList.remove("visible-panel");
                document.getElementById("log-overlay").classList.remove("visible-flex-panel");
                
                document.getElementById("top-ui-container").style.display = "flex"; 
                document.getElementById("background-layer").classList.add("visible"); 
                
                bgmOp.pause(); bgmMap.currentTime = 0; bgmMap.play();
                
                setTimeout(() => { 
                    document.querySelectorAll('.map-spot').forEach(s => s.classList.add('spot-visible')); 
                    updateMonologue('start');
                    isGameStarted = true; 
                }, 1000); 
            } 
        }; 
    }, 500); 
}