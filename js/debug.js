/* --- js/debug.js --- */

// =========================================
//  Debug Functions (デバッグ機能)
// =========================================

// ★追加: デバッグ機能使用フラグ (trueなら統計で除外対象とする)
window.isCheatUsed = false;

/**
 * チート使用を記録するヘルパー関数
 */
function markAsCheat(reason) {
    if (!window.isCheatUsed) {
        window.isCheatUsed = true;
        console.warn(`[Analytics] Cheat Flag ON by: ${reason}`);
    }
}

/**
 * 厳密なガード関数
 * main.jsで定義したステータスが「playing」の時だけデバッグ実行を許可する
 */
function canExecuteDebug() {
    // GameStatus.PLAYING ( 'playing' ) 以外はすべて弾く
    if (typeof currentStatus === 'undefined' || currentStatus !== 'playing') {
        console.log(`[Debug] Blocked: Current status is "${currentStatus}". Execution is only allowed during "playing".`);
        return false;
    }
    return true;
}

/**
 * デバッグパネルの表示切り替えと初期化
 */
function toggleDebugPanel() { 
    const p = document.getElementById("debug-panel"); 
    if (!p) return;
    p.style.display = p.style.display === "block" ? "none" : "block"; 
    
    if(p.style.display === "block") { 
        // 音量スライダーの同期
        if (document.getElementById("bgm-slider")) document.getElementById("bgm-slider").value = currentBgmVol;
        if (document.getElementById("se-slider")) document.getElementById("se-slider").value = currentSeVol;
        renderHeroineSliders(); 
        initDebugEventTester(); 
    } 
}

/**
 * ターン数を強制変更
 */
function debugModTurn(amount) { 
    if (!canExecuteDebug()) return; 
    markAsCheat('ModTurn'); 
    turn = Math.max(1, Math.min(maxTurn, turn + amount)); 
    updateMapState(); 
}

/**
 * イベントテスターのマップセレクト初期化
 */
function initDebugEventTester() { 
    const m = document.getElementById("debug-map-select"); 
    if (!m || m.options.length > 0) return; 
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
    const mSelect = document.getElementById("debug-map-select");
    const eSelect = document.getElementById("debug-event-select");
    if (!mSelect || !eSelect) return;

    const mIdx = mSelect.value; 
    const progress = turn / maxTurn; 
    const tNum = progress <= 1/6 ? 1 : (progress <= 5/6 ? 2 : 3); 
    const tKey = progress <= 1/6 ? 'newcomer' : (progress <= 5/6 ? 'mid' : 'veteran');
    
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
    
    eSelect.innerHTML = ""; 
    pool.forEach((ev, i) => { 
        const o = document.createElement("option"); 
        o.value = i; 
        o.innerText = `[${tKey}] ${ev.text.substring(0, 30)}...`; 
        eSelect.appendChild(o); 
    }); 
}

/**
 * 選択したイベントを強制発生させる
 */
function launchDebugTestEvent() { 
    if (!canExecuteDebug()) return;
    
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
    applyEventView(ev.text, ev.changes||{}, false, null, s, ev.outcome, mIdx, ev.image); 
}

/**
 * ヒロイン好感度操作スライダーの描画
 */
function renderHeroineSliders() { 
    const c = document.getElementById("debug-heroine-sliders"); 
    if (!c) return;
    c.innerHTML = ""; 
    heroines.forEach((h, i) => { 
        const d = document.createElement("div"); 
        d.innerHTML = `<div style="font-size:12px; margin-bottom:5px;">${h.title} ${h.name} Lv.<span id="h-lv-${i}">${h.progress}</span></div><input type="range" min="0" max="5" value="${h.progress}" style="width:100%" oninput="if(!canExecuteDebug()) return; markAsCheat('HeroineSlider'); heroines[${i}].progress=parseInt(this.value); heroines[${i}].affection=parseInt(this.value); document.getElementById('h-lv-${i}').innerText=this.value">`; 
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
    if (!canExecuteDebug()) return;
    markAsCheat('MaxStats'); 
    statKeys.forEach(k => { stats[k] = 50; updateUI(k); }); 
    checkRankUpdate(); 
}

function debugFinishGame() { 
    // ガードとログ出力をセットで行う
    if (!canExecuteDebug()) return; 

    markAsCheat('ForceFinish'); 
    document.getElementById('fade-overlay').classList.add('active'); 
    bgmMap.pause(); 
    setTimeout(showEnding, 1500);
}

function debugToggleBoosts() { 
    // Boost解放はチート扱いせず、タイトルでも許可
    const isL = statKeys.some(k => !unlockedBoosts[k]); 
    statKeys.forEach(k => { unlockedBoosts[k] = isL; }); 
    if (isL) { clearedHeroines = heroines.map(h => h.name); } else { clearedHeroines = []; }
    localStorage.setItem('maghribal_boosts', JSON.stringify(unlockedBoosts)); 
    localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines)); 
    renderBoostButtons(); 
}

function toggleForceHeroine() { 
    if (!canExecuteDebug()) return;
    markAsCheat('ForceHeroine'); 
    isForcedHeroine = !isForcedHeroine; 
    document.getElementById("force-heroine-btn").innerText = isForcedHeroine ? "♥ Force Heroine: ON" : "♥ Force Heroine: OFF"; 
    document.getElementById("force-heroine-btn").classList.toggle("active", isForcedHeroine); 
}

/**
 * イベント結果をコンソールに出力する
 */
function logEventResult(turn, out, isH, changes, statsBefore, statKeys, isBuff, overflowChanges, originalChanges, h, isRecommended, isBoost) {
    const keys = statKeys || ['health', 'body', 'mind', 'magic', 'fame', 'money'];
    const sBefore = statsBefore || {};
    const oChanges = overflowChanges || {};
    const origChanges = originalChanges || {};
    const sChanges = changes || {};

    let eventLabel = " TRAINING ";
    let labelColor = "#444";

    if (isH && h) {
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

    const starMark = isRecommended ? "★sts" : "";
    const boostMark = isBoost ? "＊hir" : "";

    console.group(`%c TURN ${turn} %c${eventLabel}${starMark}${boostMark}`, 
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