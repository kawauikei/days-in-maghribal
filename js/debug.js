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
 * 「マップ画面（MAP）」の状態のみ、バランスに影響するデバッグ操作を許可する
 */
function canExecuteDebug() {
    // 現在のステータスを確認
    const status = typeof currentStatus !== 'undefined' ? currentStatus : 'unknown';

    // ★ MAP以外なら、まずコンソールに理由を出す
    if (status !== GameStatus.MAP) {
        console.warn(`[Debug] Blocked: Current status is "${status}". Debugging is only allowed during "map" state.`);
        return false;
    }

    // MAP中なら実行許可
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
 * ターン数を強制変更し、コンソールに履歴を残す
 */
function debugModTurn(amount) { 
    // 1. ガードチェック
    if (!canExecuteDebug()) return; 

    // 2. 変更前の値を保持
    const oldTurn = turn;

    // 3. チート刻印
    markAsCheat('ModTurn'); 

    // 4. 計算（1〜20の範囲に収める）
    turn = Math.max(1, Math.min(maxTurn, turn + amount)); 

    // 5. コンソールログ出力
    console.log(
        `%c[Debug Turn] %c${oldTurn} %c-> %c${turn} %c(Amount: ${amount > 0 ? '+' : ''}${amount})`,
        "color: #00ffff; font-weight: bold;", // [Debug Turn]
        "color: #ff4d4d;",                   // 旧ターン
        "color: #ccc;",                      // ->
        "color: #76ff03; font-weight: bold;", // 新ターン
        "color: #aaa; font-style: italic;"    // 増分
    );

    // 6. UIとマップ状態の更新
    const turnEl = document.getElementById("turn-count");
    if (turnEl) turnEl.innerText = turn;
    
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
    // event.js の修正済み applyEventView を呼び出し
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
        d.innerHTML = `<div style="font-size:12px; margin-bottom:5px;">${h.title} ${h.name} Lv.<span id="h-lv-${i}">${h.progress}</span></div>` +
                      `<input type="range" min="0" max="5" value="${h.progress}" style="width:100%" ` +
                      `oninput="if(!canExecuteDebug()) return; ` +
                      `const oldVal=heroines[${i}].progress; const newVal=parseInt(this.value); ` +
                      `markAsCheat('HeroineSlider'); ` +
                      `heroines[${i}].progress=newVal; heroines[${i}].affection=newVal; ` +
                      `document.getElementById('h-lv-${i}').innerText=newVal; ` +
                      `console.log('%c[Debug Affection] %c${h.name}: %c' + oldVal + ' -> ' + newVal, 'color: #ff0066; font-weight: bold;', 'color: #ccc;', 'color: #76ff03; font-weight: bold;');">`; 
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

/**
 * デバッグ用強制終了
 * ガードをチェックし、問題なければ main.js の showEnding を実行する
 */
function debugFinishGame() {
    // 1. ガードチェック（MAP中以外ならここで弾く）
    if (!canExecuteDebug()) return;

    console.log("%c[Debug] Force Finish sequence started.", "color: orange; font-weight: bold;");

    // 2. 不正フラグを立てる
    markAsCheat('ForceFinish');

    // 3. 演出（画面を暗転させる）
    const fade = document.getElementById('fade-overlay');
    if (fade) fade.classList.add('active');

    // 4. BGMをフェードアウト
    try {
        if (typeof fadeOutBgm === 'function') {
            fadeOutBgm(bgmMap, 1000, true);
        }
    } catch (e) { console.warn(e); }

    // 5. 1.5秒後に正規のエンディング関数を呼び出す
    setTimeout(() => {
        if (typeof showEnding === 'function') {
            showEnding();
        } else {
            console.error("Critical: showEnding() not found in main.js");
        }
    }, 1500);
}

function debugToggleBoosts() { 
    // Boost解放は周回要素のため TITLE でも許可
    const isL = statKeys.some(k => !unlockedBoosts[k]); 
    statKeys.forEach(k => { unlockedBoosts[k] = isL; }); 
    if (isL) { clearedHeroines = heroines.map(h => h.name); } else { clearedHeroines = []; }
    localStorage.setItem('maghribal_boosts', JSON.stringify(unlockedBoosts)); 
    localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines)); 
    renderBoostButtons(); 
}

/**
 * ヒロインイベントの強制発生フラグを切り替える
 */
function toggleForceHeroine() { 
    if (!canExecuteDebug()) return;

    markAsCheat('ForceHeroine'); 
    isForcedHeroine = !isForcedHeroine; 

    // コンソールログ出力
    console.log(
        `%c[Debug Mode] %cForce Heroine Event: %c${isForcedHeroine ? 'ON (100%)' : 'OFF (Normal)'}`,
        "color: #ff0066; font-weight: bold;", // [Debug Mode]
        "color: #ccc;",                      // 説明文
        isForcedHeroine ? "color: #76ff03; font-weight: bold;" : "color: #ff4d4d; font-weight: bold;" // ON/OFF
    );

    const btn = document.getElementById("force-heroine-btn");
    if (btn) {
        btn.innerHTML = isForcedHeroine ? 
            `<i class="fa-solid fa-heart"></i> Force: ON` : 
            `<i class="fa-solid fa-heart"></i> Force: OFF`; 
        btn.classList.toggle("active", isForcedHeroine);
    }
}

/**
 * イベント結果をコンソールにグラフィカルに出力する（Analytics用）
 * 消滅していたロジックを完全復旧
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
        console.error("デバッグログ出力エラー:", e);
    } finally {
        console.groupEnd();
    }
}

/**
 * 現在の状態に合わせて、各デバッグ項目の有効/無効を個別に判定する
 */
function updateDebugUIState() {
    const panel = document.getElementById("debug-panel");
    if (!panel) return;

    const status = (typeof currentStatus !== 'undefined') ? currentStatus : 'title';

    // 全ての操作要素を取得
    const items = panel.querySelectorAll('button, input[type="range"], select, #debug-heroine-sliders');

    items.forEach(el => {
        // A. 常に使えるもの（音量）
        if (el.id === 'bgm-slider' || el.id === 'se-slider') return;

        // B. タイトル/エンド画面でも使えるもの（データ操作系）
        // HTML側で class="debug-always" を持たせるか、特定のIDで判定
        if (el.classList.contains('debug-always')) return;

        // C. それ以外は MAP 中のみ許可
        const isForbidden = (status !== 'map');

        if (isForbidden) {
            el.classList.add('debug-disabled');
            if (['BUTTON', 'INPUT', 'SELECT'].includes(el.tagName)) el.disabled = true;
        } else {
            el.classList.remove('debug-disabled');
            if (['BUTTON', 'INPUT', 'SELECT'].includes(el.tagName)) el.disabled = false;
        }
    });
}