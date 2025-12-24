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

// タイプライター演出（タグ対応版）
function typeWriter(el, text, speed) { 
    let i = 0; el.innerHTML = ""; isTyping = true; 
    targetText = text; 
    typeInterval = setInterval(() => { 
        if (i < text.length) { 
            if (text[i] === '@') {
                const match = text.substring(i).match(/^@(\w+)@/);
                if (match) {
                    i += match[0].length - 1; 
                }
            }
            el.innerHTML = formatGameText(text.substring(0, i + 1)); 
            i++; 
        } else { 
            finishTyping(); 
        } 
    }, speed); 
}

// タイプライター強制終了
function finishTyping() { 
    clearInterval(typeInterval); 
    isTyping = false; 
    document.getElementById("message-text").innerHTML = formatGameText(targetText);
    document.getElementById("page-cursor").classList.add("active"); 
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
        btn.innerHTML = `<i class="fa-solid ${statConfig[k].icon}"></i> ${statConfig[k].name} +10`; 
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
            const wasActive = activeImpacts[i]; 
            activeImpacts.fill(false); 
            if (!wasActive) activeImpacts[i] = true; 
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