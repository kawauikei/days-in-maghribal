// =========================================
//  Debug Functions (デバッグ機能)
// =========================================

/**
 * デバッグパネルの表示切り替えと初期化
 */
function toggleDebugPanel() { 
    const p = document.getElementById("debug-panel"); 
    p.style.display = p.style.display === "block" ? "none" : "block"; 
    if(p.style.display === "block") { 
        renderHeroineSliders(); 
        initDebugEventTester(); 
    } 
}

/**
 * ターン数を強制変更
 */
function debugModTurn(amount) { 
    turn = Math.max(1, Math.min(maxTurn, turn + amount)); 
    updateMapState(); 
}

/**
 * イベントテスターのマップセレクト初期化
 */
function initDebugEventTester() { 
    const m = document.getElementById("debug-map-select"); 
    if (m.options.length > 0) return; 
    scenarios.forEach((s, i) => { 
        const o = document.createElement("option"); 
        o.value = i; 
        o.innerText = s.name; 
        m.appendChild(o); 
    }); 
    updateDebugEventList(); 
}

/**
 * 選択中のマップ・進捗に応じたイベントリスト更新
 */
function updateDebugEventList() { 
    const mIdx = document.getElementById("debug-map-select").value; 
    const eS = document.getElementById("debug-event-select"); 
    
    const progress = turn / maxTurn; 
    const tNum = progress <= 1/6 ? 1 : (progress <= 5/6 ? 2 : 3); 
    const tKey = progress <= 1/6 ? 'newcomer' : (progress <= 5/6 ? 'mid' : 'veteran');
    
    // データ安全策（存在チェック）
    if (!gameAssets.events[`${scenarios[mIdx].file}_${tNum}`]) return;

    const eventFile = gameAssets.events[`${scenarios[mIdx].file}_${tNum}`];
    
    let pool = [];
    if (Array.isArray(eventFile)) {
        pool = eventFile;
    } else if (eventFile && typeof eventFile === 'object') {
        const tierData = eventFile[tKey] || Object.values(eventFile)[0];
        if (Array.isArray(tierData)) {
            pool = tierData; 
        } else if (tierData) {
            pool = [].concat(tierData.success || [], tierData.failure || [], tierData.great || []);
        }
    }
    
    eS.innerHTML = ""; 
    pool.forEach((ev, i) => { 
        const o = document.createElement("option"); 
        o.value = i; 
        o.innerText = `[${tKey}] ${ev.text.substring(0, 30)}...`; 
        eS.appendChild(o); 
    }); 
}

/**
 * 選択したイベントを強制発生させる
 */
function launchDebugTestEvent() { 
    const mIdx = document.getElementById("debug-map-select").value; 
    const eIdx = document.getElementById("debug-event-select").value; 
    const s = scenarios[mIdx]; 
    
    const progress = turn / maxTurn; 
    const tNum = progress <= 1/6 ? 1 : (progress <= 5/6 ? 2 : 3); 
    const tKey = progress <= 1/6 ? 'newcomer' : (progress <= 5/6 ? 'mid' : 'veteran');
    
    if (!gameAssets.events[`${s.file}_${tNum}`]) return;
    const eventFile = gameAssets.events[`${s.file}_${tNum}`];
    
    let pool = [];
    if (Array.isArray(eventFile)) {
        pool = eventFile;
    } else if (eventFile && typeof eventFile === 'object') {
        const tierData = eventFile[tKey] || Object.values(eventFile)[0];
        if (Array.isArray(tierData)) {
            pool = tierData; 
        } else if (tierData) {
            pool = [].concat(tierData.success || [], tierData.failure || [], tierData.great || []);
        }
    }
    
    const ev = pool[eIdx]; 
    if(!ev) return; 
    
    isEventActive = true; 
    isResultDisplayed = false; 
    
    // 画像IDがあれば渡す
    applyEventView(ev.text, ev.changes||{}, false, null, s, ev.outcome, mIdx, ev.image); 
}

/**
 * ヒロイン好感度操作スライダーの描画
 */
function renderHeroineSliders() { 
    const c = document.getElementById("debug-heroine-sliders"); 
    c.innerHTML = ""; 
    heroines.forEach((h, i) => { 
        const d = document.createElement("div"); 
        d.innerHTML = `<div style="font-size:12px; margin-bottom:5px;">${h.title} ${h.name} Lv.<span id="h-lv-${i}">${h.progress}</span></div><input type="range" min="0" max="5" value="${h.progress}" style="width:100%" oninput="heroines[${i}].progress=parseInt(this.value); heroines[${i}].affection=parseInt(this.value); document.getElementById('h-lv-${i}').innerText=this.value">`; 
        c.appendChild(d); 
    }); 
}

function debugResetAllData() { 
    if(confirm("全消去しますか？")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

function debugMaxStats() { 
    statKeys.forEach(k => { stats[k] = 50; updateUI(k); }); 
    checkRankUpdate(); 
}

function debugFinishGame() { 
    document.getElementById('fade-overlay').classList.add('active'); 
    bgmMap.pause(); 
    setTimeout(showEnding, 1500); 
}

function debugToggleBoosts() { 
    const isL = statKeys.some(k => !unlockedBoosts[k]); 
    statKeys.forEach(k => { unlockedBoosts[k] = isL; }); 
    if (isL) { clearedHeroines = heroines.map(h => h.name); } else { clearedHeroines = []; }
    localStorage.setItem('maghribal_boosts', JSON.stringify(unlockedBoosts)); 
    localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines)); 
    renderBoostButtons(); 
}

function toggleForceHeroine() { 
    isForcedHeroine = !isForcedHeroine; 
    document.getElementById("force-heroine-btn").innerText = isForcedHeroine ? "♥ Force Heroine: ON" : "♥ Force Heroine: OFF"; 
    document.getElementById("force-heroine-btn").classList.toggle("active", isForcedHeroine); 
}