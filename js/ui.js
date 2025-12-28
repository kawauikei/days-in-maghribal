// =========================================
//  UI & Visual Effects (画面表示・演出)
// =========================================

// UI用定数定義
// ui.js の statColors に average を追加
const statColors = { 
    health: '#ff4d4d', body: '#ffa500', mind: '#4da6ff', 
    magic: '#b366ff', fame: '#ffff4d', money: '#33cc33',
    average: '#00ffff' // スカイシアンを追加
};
const rankColors = { LEGEND: '#ffcc00', GOLD: '#e6b422', SILVER: '#c0c0c0', BRONZE: '#cd7f32' };
const soloTitles = { health: "不滅の冒険者", body: "孤高の拳王", mind: "深淵の求道者", magic: "無窮の魔術師", fame: "名もなき伝説", money: "豪腕の大富豪" };

// 画面リサイズ処理
function resizeGameContainer() { 
    const container = document.getElementById('game-container'); 
    const targetW = 1280; const targetH = 720; 
    const windowW = window.innerWidth; const windowH = window.innerHeight; 
    const scaleW = windowW / targetW; const scaleH = windowH / targetH; 
    const scale = Math.min(scaleW, scaleH); 
    container.style.transform = `scale(${scale})`; 
}

// フルスクリーン切り替え
function toggleFullScreen() { 
    if (!document.fullscreenElement) { 
        document.documentElement.requestFullscreen().catch(err => { console.log(err); }); 
    } else { 
        if (document.exitFullscreen) { document.exitFullscreen(); } 
    } 
}

// UI初期化（マップスポット生成など）
function initUI() {
    const list = document.getElementById("stat-list"); 
    list.innerHTML = ""; 
    statKeys.forEach(k => { 
        list.innerHTML += `<div style="margin-bottom:10px;"><div style="display:flex; justify-content:space-between; font-size:14px;"><span class="stat-label" style="color:${statColors[k]};"><i class="fa-solid ${statConfig[k].icon}"></i> ${statConfig[k].name}</span><span id="stat-${k}" style="color:${statColors[k]}; font-weight:bold;">Low</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" id="bar-${k}" style="background:${statColors[k]};"></div></div></div>`; 
    });
    
    const container = document.getElementById("map-spots-container"); 
    container.innerHTML = ""; 
    spotAssignments.forEach((assign, i) => { 
        const spot = document.createElement("div"); 
        spot.className = "map-spot"; 
        spot.style.left = assign.l + "%"; 
        spot.style.top = assign.t + "%"; 
        spot.onclick = (e) => { e.stopPropagation(); handleSpotClick(spot, i); }; 
        spot.innerHTML = `<div class="spot-core"></div><div class="orb orb-main" style="background:${statColors[assign.main]}; color:${statColors[assign.main]};"></div><div class="orb orb-sub" style="background:${statColors[assign.sub]}; color:${statColors[assign.sub]};"></div><div class="hint-container"><div class="hint-text"><i class="fa-solid ${scenarios[i].icon}" style="margin-right:5px; font-size:0.9em;"></i>${scenarios[i].name}<div class="recommend-icon"><i class="fa-solid fa-angles-up"></i></div></div></div>`; 
        container.appendChild(spot); 
    }); 
    updateRecommend();
}

// マップの状態更新（スポットの有効・無効化）

function updateMapState() {
    const spots = document.querySelectorAll('.map-spot');
    
    // 1. 各スポットの状態を更新
    spots.forEach((spot, i) => {
        // 基本リセット
        spot.classList.remove('spot-disabled');
        spot.classList.remove('boost-mode'); // 一旦ブーストクラスを外す

        // ブースト判定
        // activeImpactsの中で「有効(true)」かつ「ターゲットがこの場所(i)」なものを探す
        const isBoosted = activeImpacts.some((isActive, idx) => isActive && heroineImpacts[idx].target === i);

        // ブースト対象ならクラスを付与（見た目はCSSにおまかせ）
        if (isBoosted) {
            spot.classList.add('boost-mode');
        }
    });

    // 2. ターン表示の更新（変更なし）
    const displayEl = document.getElementById("turn-display");
    if (displayEl) {
        displayEl.innerHTML = `<span style="margin-right:15px; font-weight:bold;"><i class="fa-solid fa-hourglass-start"></i> TURN</span><span id="turn-count">${turn}</span>/20`;
    }
}

// 推奨アイコンの更新
function updateRecommend() {
    const vals = Object.values(stats); 
    const minVal = Math.min(...vals); 
    const maxVal = Math.max(...vals); // 最高値を取得
    
    spotAssignments.forEach((assign, i) => { 
        // 判定：メインステータスが最低値であり、かつ最高値（ブースト値）ではない
        const isRec = (stats[assign.main] === minVal) && (stats[assign.main] < maxVal); 
        
        const spot = document.querySelectorAll('.map-spot')[i];
        if(spot) { 
            const icon = spot.querySelector('.recommend-icon'); 
            if(icon) { 
                if (isRec) icon.classList.add('visible'); 
                else icon.classList.remove('visible'); 
            } 
        } 
    });
}

// ステータスバー更新
function updateUI(k) { 
    const v = stats[k]; 
    const bar = document.getElementById(`bar-${k}`); 
    if(bar) bar.style.width = (v * 2) + "%"; 
    const label = document.getElementById(`stat-${k}`); 
    if(label) { 
        const labs = ["Low", "Normal", "High", "Expert", "Master", "Legend"]; 
        label.innerText = labs[Math.min(Math.floor(v/10),5)]; 
    } 
    updateRecommend(); 
}

// エリアステータス表示用HTML生成
function getLocStatusHtml(idx) {
    let sec = defaultRegionStats[idx].sec; 
    let eco = defaultRegionStats[idx].eco; 
    activeImpacts.forEach((isActive, hId) => { 
        if (isActive && heroineImpacts[hId].target === idx) { 
            sec += heroineImpacts[hId].sec; 
            eco += heroineImpacts[hId].eco; 
        } 
    }); 
    sec = Math.max(1, Math.min(5, sec)); 
    eco = Math.max(1, Math.min(5, eco)); 
    const stars = (n) => '★'.repeat(n) + '<span style="opacity:0.3">★</span>'.repeat(5-n); 
    return `<span style="display:flex; align-items:center; color:#fff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px #000;"><i class="fa-solid fa-shield-halved" style="color:#aaa; margin-right:4px;"></i> ${stars(sec)}</span><span style="display:flex; align-items:center; color:#fff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px #000;"><i class="fa-solid fa-scale-balanced" style="color:#d4af37; margin-right:4px;"></i> ${stars(eco)}</span>`;
}

// ▼▼▼ 新規追加: テキスト進行関数 (TextEngine連携版) ▼▼▼
function proceedText() {
    const textBox = document.getElementById("message-text");
    const cursor = document.getElementById("page-cursor");
    
    // 結果が表示済みなら、イベント終了処理へ
    if (isResultDisplayed) {
        cursor.classList.remove("active"); 
        closeEvent();
        return;
    }

    // 現在のHTMLを取得（あふれ判定用）
    const currentHtml = textBox.innerHTML;

    // エンジンから次の塊を取得
    const result = TextEngine.getNext(currentHtml);

    // 1. テキスト切れ（本文終了）の場合
    if (result.isEnd) {
        // 結果（成功/失敗など）を表示する
        if (isResultHidden) { 
            closeEvent(); 
        } else {
            cursor.classList.remove("active"); 
            showFinalResult(); 
            cursor.classList.add("active"); 
        }
        return;
    }

    // 2. リセット（改ページ）指示がある場合
    if (result.reset) {
        textBox.innerHTML = "";
    }

    // 3. テキストを表示（タグ装飾を適用するため formatGameText を通す）
    const formattedText = formatGameText(result.text);
    textBox.innerHTML += formattedText;

    // カーソル点滅開始
    cursor.classList.add("active"); 
}

// 最終結果（成功/失敗など）の表示
function showFinalResult() { 
    playSE(sePage); 
    const resDiv = document.getElementById("result-display"); 
    resDiv.innerHTML = pendingResultHtml; 
    resDiv.style.opacity = "1"; 
    isResultDisplayed = true; 
    document.getElementById("page-cursor").classList.add("active"); 
}

// 結果HTMLの生成
function getResultHtml(changes) { 
    let h = ''; 
    for (let k in changes) { 
        if (changes[k] !== 0) { 
            const arrow = changes[k] > 0 ? `<span style="color:#76ff03; font-size:0.8em;">▲</span>` : `<span style="color:#ea80fc; font-size:0.8em;">▼</span>`; 
            h += `<span style="color:${statColors[k]}; margin:0 8px; font-weight:bold; white-space:nowrap;"><i class="fa-solid ${statConfig[k].icon}"></i> ${statConfig[k].name}${arrow}</span>`; 
        } 
    } 
    return h; 
}

// テキスト整形（色付けなど）
// formatGameText の中で average を置換対象にする
function formatGameText(text) { 
    return text.replace(/@(\w+)@/g, (m, k) => {
        if (k === 'average') return `<span style="color:${statColors.average}">平均値</span>`;
        return `<span style="color:${statColors[k]}">${statConfig[k].name}</span>`;
    });
}

// ステータスパネル表示切り替え
function toggleStats() { 
    playSE(sePi); 
    const p = document.getElementById("stats-panel"); 
    p.style.display = p.style.display === "block" ? "none" : "block"; 
}

// ログウィンドウ表示切り替え
function toggleLog() { 
    playSE(sePi); 
    const l = document.getElementById("log-overlay"); 
    l.style.display = l.style.display === "flex" ? "none" : "flex"; 
    if(l.style.display === "flex") { 
        document.getElementById("log-window").scrollTop = document.getElementById("log-window").scrollHeight; 
    } 
}

// ランク変動チェック
function checkRankUpdate() { 
    const total = Object.values(stats).reduce((sum, v) => sum + v, 0);
    const btn = document.getElementById("status-toggle-btn"); 
    let rank = total >= 150 ? "legend" : (total >= 100 ? "gold" : (total >= 50 ? "silver" : "bronze")); 
    [btn, document.getElementById("stats-panel")].forEach(el => { 
        if(el) { 
            el.classList.remove("rank-silver", "rank-gold", "rank-legend"); 
            if (rank !== "bronze") el.classList.add("rank-" + rank); 
        } 
    }); 
}

// ブーストボタン描画
function renderBoostButtons() { 
    const container = document.getElementById("boost-container"); 
    if(!container) return; 
    container.innerHTML = ""; 
    
    const title = document.createElement("div");
    title.className = "boost-section-title";
    title.innerText = "- START BONUS / WORLD INFLUENCE -";
    container.appendChild(title);

    const content = document.createElement("div");
    content.className = "boost-section";
    
    statKeys.forEach(k => { 
        const btn = document.createElement("button"); 
        btn.className = `boost-btn ${unlockedBoosts[k] ? 'unlocked' : ''} ${activeBoosts[k] ? 'active' : ''}`; 
        btn.innerHTML = `<i class="fa-solid ${statConfig[k].icon}"></i> ${statConfig[k].name} +15`; 
        btn.onclick = (e) => { 
            e.stopPropagation(); 
            if(!unlockedBoosts[k]) return; 
            activeBoosts[k] = !activeBoosts[k]; 
            localStorage.setItem('maghribal_active_boosts', JSON.stringify(activeBoosts)); 
            playSE(sePi); 
            renderBoostButtons(); 
        }; 
        content.appendChild(btn); 
    });
    
    const divider = document.createElement("div");
    divider.className = "boost-divider";
    content.appendChild(divider);

    heroines.forEach((h, i) => { 
        const impact = heroineImpacts[i]; 
        const targetScene = scenarios[impact.target]; 
        const isActive = activeImpacts[i]; 
        const isUnlocked = clearedHeroines.includes(h.name); 
        
        const btn = document.createElement("button"); 
        btn.className = `boost-btn ${isUnlocked ? 'unlocked' : ''} ${isActive ? 'active' : ''}`; 
        btn.innerHTML = `<i class="fa-solid ${targetScene.icon}"></i> ${impact.btnLabel}`; 
        
        btn.onclick = (e) => { 
            e.stopPropagation(); 
            if (!isUnlocked) return; 
            
            // ★変更箇所: 以前の排他制御（.fill(false)）を削除し、単純なトグルに変更
            activeImpacts[i] = !activeImpacts[i]; 
            
            localStorage.setItem('maghribal_active_impacts', JSON.stringify(activeImpacts)); 
            playSE(sePi); 
            renderBoostButtons(); 
        }; 
        content.appendChild(btn); 
    });

    container.appendChild(content);
}

// ログ保存・表示系
function saveCurrentGameLog() { 
    const activeIdx = activeImpacts.findIndex(Boolean); 
    if (activeIdx !== -1) return; 
    
    const total = Object.values(stats).reduce((sum, v) => sum + v, 0); 
    const rank = total >= 150 ? "LEGEND" : (total >= 100 ? "GOLD" : (total >= 50 ? "SILVER" : "BRONZE")); 
    
    // bestヒロイン計算 (初期値がない場合のエラー回避のため、stats比較の前にnullチェックを入れるのが安全だが、現状ロジックを踏襲)
    let best = heroines.reduce((a, b) => a.affection > b.affection ? a : b); 
    
    let partnerHTML = ""; 
    if (best && best.affection > 0) { 
        const hIcon = `<i class="fa-solid ${best.icon}" style="font-size:0.9em; opacity:0.8;"></i> `; 
        let affinityHTML = ""; 
        if (best.progress >= 5) affinityHTML = ` <i class="fa-solid fa-mound bouquet-icon" style="font-size:0.8em;"></i>`; 
        else if (best.progress >= 3) affinityHTML = ` <i class="fa-solid fa-seedling affinity-seedling" style="font-size:0.8em;"></i>`; 
        else affinityHTML = ` <i class="fa-solid fa-leaf affinity-leaf" style="font-size:0.8em;"></i>`; 
        partnerHTML = `${hIcon}${best.name}${affinityHTML}`; 
    } else { 
        const maxK = [...statKeys].sort((a, b) => stats[b] - stats[a])[0]; 
        partnerHTML = soloTitles[maxK]; 
    } 
    
    const now = new Date(); 
    const dateStr = (now.getMonth()+1) + "/" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0'); 
    const newRecord = { date: dateStr, rank: rank, partnerHTML: partnerHTML, log: currentGameLog.join('') }; 
    
    let records = JSON.parse(localStorage.getItem('maghribal_logs') || "[]"); 
    records.push(newRecord); 
    if (records.length > 10) records.shift(); 
    localStorage.setItem('maghribal_logs', JSON.stringify(records)); 
    displayPastRecords(); 
}

function displayPastRecords() { 
    const records = JSON.parse(localStorage.getItem('maghribal_logs') || "[]"); 
    const container = document.getElementById("past-records-list"); 
    if (!container) return; 
    if (records.length === 0) { 
        container.innerHTML = "<div style='font-size:10px; color:#666; padding:10px; text-align:center;'>NO RECORDS YET.</div>"; 
        return; 
    } 
    container.innerHTML = records.slice().reverse().map((rec, idx) => `<div class="record-item" onclick="viewSpecificLog(${records.length - 1 - idx})"><span class="record-rank" style="color:${rankColors[rec.rank] || '#fff'}">[${rec.rank}]</span><span class="record-partner">${rec.partnerHTML}</span><span class="record-date">${rec.date}</span></div>`).join(''); 
}

function viewSpecificLog(idx) { 
    const records = JSON.parse(localStorage.getItem('maghribal_logs') || "[]"); 
    const rec = records[idx]; 
    if (rec) { 
        const logWindow = document.getElementById("log-window"); 
        document.getElementById("log-content").innerHTML = rec.log; 
        toggleLog(); 
        logWindow.scrollTop = 0; 
    } 
}

// --- キャラクター表示システム (透過PNG対応版) ---

/**
 * キャラクター立ち絵を表示する
 * @param {string} imagePath - 画像パス (例: 'images/chara/h01_hortensia_01.png')
 */
function showCharacter(imagePath) {
    const layer = document.getElementById('character-layer');
    
    // 表示更新のため一度クリア
    layer.innerHTML = ''; 

    if (!imagePath) return;

    const img = document.createElement('img');
    img.src = imagePath;
    
    // 画像読み込みエラー時の処理
    img.onerror = function() {
        console.error("キャラクター画像の読み込みに失敗:", imagePath);
        // エラー時は非表示にするなどの処理があればここに
    };

    layer.appendChild(img);
}

/**
 * キャラクターを非表示にする
 */
function hideCharacter() {
    document.getElementById('character-layer').innerHTML = '';
}

/* --- js/ui.js : タイプライター関連（修正版） --- */

// 演出用の変数を定義
let typeSegments = []; // テキストとタグを分解した配列
let typeCurrentIdx = 0;
let typeBaseHtml = "";

// ★修正: main.js で宣言済みの変数はここでは宣言しない（削除）
// let typeInterval = null;  <-- 削除
// let isTyping = false;     <-- 削除

// タイプライタ開始処理
function startTypeWriter(htmlText) {
    const textBox = document.getElementById("message-text");
    const cursor = document.getElementById("page-cursor");
    
    cursor.classList.remove("active");
    isTyping = true; // グローバル変数(main.js)を使用
    
    // 現在の表示内容（追記前の状態）を保存
    typeBaseHtml = textBox.innerHTML;
    
    // HTMLを分解
    typeSegments = splitHtml(htmlText);
    typeCurrentIdx = 0;
    
    if (typeInterval) clearInterval(typeInterval);

    typeInterval = setInterval(() => {
        // 完了判定
        if (typeCurrentIdx >= typeSegments.length) {
            finishTyping();
            return;
        }

        // 描画ロジック（変更なし）
        const segment = typeSegments[typeCurrentIdx];
        
        let currentHtml = typeBaseHtml;
        for (let i = 0; i <= typeCurrentIdx; i++) {
            currentHtml += typeSegments[i];
        }
        textBox.innerHTML = currentHtml;
        
        textBox.scrollTop = textBox.scrollHeight;

        // 次へ
        typeCurrentIdx++;

        // タグなら即時反映して次へ（ウェイト無し）
        while (
            typeCurrentIdx < typeSegments.length && 
            isTag(typeSegments[typeCurrentIdx])
        ) {
            currentHtml += typeSegments[typeCurrentIdx];
            textBox.innerHTML = currentHtml;
            typeCurrentIdx++;
        }

    }, 20); 
}

// ヘルパー: 文字列がHTMLタグかどうか判定
function isTag(str) {
    return str.startsWith('<') && str.endsWith('>');
}

// ヘルパー: HTML文字列をタグと文字に分解する
function splitHtml(html) {
    const segments = [];
    let current = "";
    let inTag = false;

    for (let i = 0; i < html.length; i++) {
        const char = html[i];

        if (char === '<') {
            if (current) {
                segments.push(current);
                current = "";
            }
            inTag = true;
            current += char;
        } else if (char === '>') {
            current += char;
            if (inTag) {
                segments.push(current);
                current = "";
                inTag = false;
            }
        } else {
            if (inTag) {
                current += char;
            } else {
                segments.push(char);
            }
        }
    }
    if (current) segments.push(current);

    return segments;
}

// タイプライタ強制終了
function finishTyping() {
    if (!isTyping) return;

    clearInterval(typeInterval);
    const textBox = document.getElementById("message-text");

    // 全セグメントを結合して表示
    textBox.innerHTML = typeBaseHtml + typeSegments.join("");

    isTyping = false;
    typeSegments = [];
    typeBaseHtml = "";
    
    document.getElementById("page-cursor").classList.add("active");
}