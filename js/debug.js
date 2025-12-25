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
        // ▼▼▼ 追加: スライダーの位置を現在の音量に合わせる ▼▼▼
        document.getElementById("bgm-slider").value = currentBgmVol;
        document.getElementById("se-slider").value = currentSeVol;
        // ▲▲▲ 追加ここまで ▲▲▲

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

// debug.js

// 引数の順番を厳密に固定
function logEventResult(turn, out, isH, changes, statsBefore, statKeys, isBuff, overflowChanges, originalChanges, h) {
    const keys = statKeys || ['health', 'body', 'mind', 'magic', 'fame', 'money'];
    const sBefore = statsBefore || {};
    const oChanges = overflowChanges || {};
    const origChanges = originalChanges || {};
    const sChanges = changes || {};

    // 1. まずデフォルト値を設定
    let eventLabel = " TRAINING ";
    let labelColor = "#444";

    // 2. 条件に応じてラベルを上書き
    if (isH && h) {
        // ヒロインイベントの場合（親密度レベルを付与）
        const lv = h.progress !== undefined ? ` Lv.${h.progress}` : "";
        eventLabel = ` HEROINE${lv} `;
        labelColor = "#ff0066";
    } else if (out === 'hint') {
        eventLabel = "    HINT   ";
        labelColor = "#ff8800";
    } else if (out === 'failure') {
        eventLabel = " FAILURE  ";
        labelColor = "#cc0000";
    } else if (out === 'great') {
        eventLabel = "   GREAT   ";
        labelColor = "#00bbff";
    }

    // 3. ラベルが決まってから group を開始
    console.group(`%c TURN ${turn} %c${eventLabel}`, 
        "background: #333; color: #00ffff; font-weight: bold;", 
        `background: ${labelColor}; color: #fff; font-weight: bold;`);

    try {
        keys.forEach(k => {
            const before = sBefore[k] || 0;
            const after = stats[k];
            const original = origChanges[k] || 0;
            const actual = sChanges[k] || 0;
            const bonus = oChanges[k] || 0;

            let mark = (original !== 0 || bonus !== 0) ? (original < 0 ? "▼ " : "▲ ") : "  ";

            let changeDetail = "";
            if (original !== 0) {
                changeDetail = `[${original >= 0 ? '+' : ''}${original} -> ${actual >= 0 ? '+' : ''}${actual}]`;
            } else if (bonus !== 0) {
                changeDetail = `[+0 -> +${bonus}]`;
            }

            console.log(`${mark} ${k.padEnd(8)}: ${String(before).padStart(2)} -> ${String(after).padStart(2)} ${changeDetail}`);
        });

        const total = Object.values(stats).reduce((a, b) => a + b, 0);
        console.log(`%c TOTAL: ${total} / AVG: ${(total/6).toFixed(1)} `, "background: #eee; color: #333;");

    } catch (e) {
        console.error("デバッグログ出力中にエラーが発生しました:", e);
    } finally {
        console.groupEnd();
    }
}