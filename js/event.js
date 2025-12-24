// =========================================
//  Event Logic (イベント進行・判定)
// =========================================

// マップスポットクリック時の処理
function handleSpotClick(el, idx) {
    document.getElementById('monologue-container').classList.remove('visible');

    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1 && idx !== heroineImpacts[activeIdx].target) return;

    if (!isGameStarted || isEventActive || (activeIdx === -1 && turn > maxTurn)) return; 
    isEventActive = true; isResultDisplayed = false; isResultHidden = false;
    playSE(seFootstep); 
    
    let stopBgm = false;

    el.querySelector('.hint-text').classList.add('selected-yellow'); 
    document.querySelectorAll('.map-spot').forEach(s => s.classList.remove('spot-visible'));
    
    const s = scenarios[idx];
    const h = heroines[idx]; 
    h.events = gameAssets.heroines[h.file].events; 
    
    const avgStat = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
    const assign = spotAssignments[idx];
    const anyM = heroines.some(hero => hero.progress >= 5);
    
    const minVal = Math.min(...Object.values(stats)); 
    const weakStats = statKeys.filter(k => stats[k] === minVal); 
    const isRecommended = weakStats.includes(assign.main) || weakStats.includes(assign.sub);
    
    let tierNum, tierKey; 
    const progressRatio = turn / maxTurn;
    if (progressRatio <= 1/6) { tierNum = 1; tierKey = 'newcomer'; }
    else if (progressRatio <= 5/6) { tierNum = 2; tierKey = 'mid'; }
    else { tierNum = 3; tierKey = 'veteran'; }
    
    const eventFile = gameAssets.events[`${s.file}_${tierNum}`];

    let isH = false, dMsg = "", bCh = {}, out = 'success';
    let imgId = null; 

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
        let chance = isForcedHeroine ? 1.0 : (stats[assign.main] / 50) + (consecutiveNormalEvents * 0.1); 
        if (chance < 0.05) chance = 0.05; 
        if (lastEventWasHeroine && !isForcedHeroine) chance = 0;
        
        if (h.progress >= 5) { 
            isH = true; lastEventWasHeroine = true; isResultHidden = true; stopBgm = true;
            dMsg = "【後日談】\n" + (h.afterMsg || "穏やかな時間が流れた。"); 
            bCh[assign.main] = 5; bCh[assign.sub] = 2; 
            out = 'heroine'; 
            lastEventContext = { name: h.name, progress: 6 }; 
            if (!clearedHeroines.includes(h.name)) {
                clearedHeroines.push(h.name);
                localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
            }
        } 
        else if (anyM && h.progress >= 1) { 
            isH = true; lastEventWasHeroine = true; stopBgm = true;
            dMsg = "【世間話】\n" + (h.chatMsg || "何気ない世間話をして別れた。"); 
            bCh[assign.main] = 2; bCh[assign.sub] = 1; 
            out = 'heroine'; 
        } 
        else if (Math.random() < chance) { 
            const reqA = h.minAvg[Math.min(h.progress, 4)] || 0;
            const reqS = (h.progress + 1) * 8;
            const mIdx = h.progress < 2 ? 0 : 1; 
            
            if (avgStat < reqA) { 
                isH = false; lastEventWasHeroine = false; 
                dMsg = h.lockAvgMsgs[mIdx]; 
                bCh[assign.main] = 1; bCh[assign.sub] = 1; 
                out = 'hint'; 
            } 
            else if (stats[assign.main] < reqS) { 
                isH = false; lastEventWasHeroine = false; 
                dMsg = h.lockStatMsgs[mIdx]; 
                bCh[assign.main] = 1; bCh[assign.sub] = 1; 
                out = 'hint'; 
            } 
            else { 
                isH = true; lastEventWasHeroine = true; consecutiveNormalEvents = 0; stopBgm = true;
                dMsg = h.events[Math.min(h.progress, 4)]; 
                h.progress++; h.affection++; 
                if (h.progress >= 3) isResultHidden = true; 
                bCh[assign.main] = 5; bCh[assign.sub] = 2; 
                out = 'heroine'; 
                lastEventContext = { name: h.name, progress: h.progress };
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
            
            let pool = [];
            if (Array.isArray(eventFile)) {
                pool = eventFile;
            } else if (eventFile && typeof eventFile === 'object') {
                const tierData = eventFile[tierKey] || Object.values(eventFile)[0];
                if (Array.isArray(tierData)) {
                    pool = tierData; 
                } else if (tierData) {
                    pool = [].concat(tierData.success || [], tierData.failure || [], tierData.great || []);
                }
            }
            
            let targetPool = pool;
            if (isRecommended) { 
                const successPool = pool.filter(e => e.outcome !== 'failure'); 
                if (successPool.length > 0) targetPool = successPool; 
            } 
            
            const ev = targetPool[Math.floor(Math.random() * targetPool.length)];
            
            if (ev) {
                dMsg = ev.text; 
                bCh = {...(ev.changes || {})}; 
                out = ev.outcome; 
                lastEventResult = out;
                imgId = ev.image; 

                // ▼▼▼ 確認用ログ（不要なら削除可） ▼▼▼
                if (imgId) console.log(`[Event] ImageID: ${imgId}`);
                // ▲▲▲ 確認用ログ ▲▲▲

            } else {
                console.error(`[EventError] No event found for ${s.file}_${tierNum} (${tierKey})`);
            }
        }
        
        if (isRecommended) { 
            for (let k in bCh) { if (bCh[k] > 0) bCh[k] += 1; } 
        }
    }
    
    if (stopBgm) bgmMap.pause();
    applyEventView(dMsg, bCh, isH, h, s, out, idx, imgId);
}

// イベント画面の構築・表示
function applyEventView(msg, changes, isH, h, s, out, idx, imgId) {
    for (let k in changes) { stats[k] = Math.max(0, Math.min(stats[k] + (changes[k] || 0), 50)); updateUI(k); } checkRankUpdate(); 
    let cLog = isResultHidden ? "" : getResultHtml(changes); 
    let outcomeHtml = ""; 
    if (!isH && out !== 'hint' && out !== 'heroine' && out !== 'exclusive') { 
        if (out === 'great_success' || out === 'great') outcomeHtml = `<span class="outcome-badge great">【大成功】</span>`; 
        else if (out === 'success') outcomeHtml = `<span class="outcome-badge success">【成功】</span>`; 
        else if (out === 'failure') outcomeHtml = `<span class="outcome-badge failure">【失敗】</span>`; 
    } 
    let logL = isH ? `(<i class="fa-solid ${h ? h.icon : ''}"></i> ${h ? h.name : ''})` : ""; 
    const locLabel = `<i class="fa-solid ${s.icon}"></i> ${s.name}`; 
    
    currentGameLog.push(`<div class="log-entry"><div class="log-header">Turn ${turn} : ${locLabel} ${logL} ${outcomeHtml} ${getResultHtml(changes)}</div><div class="log-body">${formatGameText(msg).replace(/\n/g, '<br>')}</div></div>`); 
    document.getElementById("log-content").innerHTML = currentGameLog.join(''); 
    
    // 背景演出（ズーム＆ブラー）
    const bgLayer = document.getElementById("background-layer");
    bgLayer.style.transformOrigin = `${spotAssignments[idx].l}% ${spotAssignments[idx].t}%`; 
    bgLayer.style.transform = `scale(${s.zoom || 2.5})`; 
    bgLayer.classList.add("blur-bg"); 
    
    // イベントスチル表示処理
    const stillLayer = document.getElementById("event-still-layer");
    if (imgId) {
        stillLayer.style.backgroundImage = `url('images/bg/${s.file}_${imgId}.png')`;
        stillLayer.classList.add("active");
    } else {
        stillLayer.classList.remove("active");
        stillLayer.style.backgroundImage = "none";
    }
    
    if (typeof msg === 'string') {
        messageQueue = msg.split('\n').filter(line => line.trim() !== "");
    } else {
        messageQueue = Array.isArray(msg) ? msg : [msg];
    }
    
    currentMsgIndex = 0; isResultDisplayed = false; pendingResultHtml = outcomeHtml + cLog; 
    document.getElementById("loc-icon").innerHTML = `<i class="fa-solid ${s.icon}"></i>`; 
    document.getElementById("loc-name").innerText = s.name; 
    document.getElementById("loc-stats").innerHTML = getLocStatusHtml(idx); 
    const cb = document.getElementById("char-name-badge"); if (isH && h) { cb.innerHTML = `<i class="fa-solid ${h.icon}"></i> ${h.title} ${h.name}`; cb.style.display = "flex"; } else cb.style.display = "none"; 
    document.getElementById("message-text").innerHTML = ""; 
    document.getElementById("result-display").innerHTML = ""; 
    document.getElementById("result-display").style.opacity = "0"; 
    document.getElementById("page-cursor").classList.remove("active"); 
    document.getElementById("message-window").classList.add("active"); 
    document.getElementById("click-overlay").classList.add("active"); 
    setTimeout(advanceMessage, 300);
}

// メッセージ送り
function advanceMessage() { 
    const cursor = document.getElementById("page-cursor"); 
    if (isTyping) { finishTyping(); return; } 
    if (currentMsgIndex < messageQueue.length) { 
        cursor.classList.remove("active"); 
        targetText = messageQueue[currentMsgIndex++]; 
        typeWriter(document.getElementById("message-text"), targetText, 15); 
    } else {
        if (isResultHidden) { 
            closeEvent(); 
        } else if (!isResultDisplayed) { 
            cursor.classList.remove("active"); 
            showFinalResult(); 
            cursor.classList.add("active"); 
        } else { 
            cursor.classList.remove("active"); 
            closeEvent(); 
        }
    }
}

// イベント終了処理（スチル非表示・ターン経過など）
function closeEvent() { 
    const bgLayer = document.getElementById("background-layer");
    bgLayer.style.transform = "scale(1)"; 
    bgLayer.classList.remove("blur-bg"); 
    
    // スチルを非表示
    document.getElementById("event-still-layer").classList.remove("active");
    
    document.getElementById("message-window").classList.remove("active"); 
    document.getElementById("click-overlay").classList.remove("active"); 
    document.getElementById("page-cursor").classList.remove("active"); 
    
    if (bgmMap.paused && activeImpacts.findIndex(Boolean) === -1) bgmMap.play();

    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1) { 
        document.getElementById('fade-overlay').classList.add('active'); 
        bgmMap.pause(); 
        setTimeout(showEnding, 1500); 
        return; 
    }
    
    if (turn < maxTurn) { 
        turn++; 
        document.getElementById("turn-count").innerText = turn; 
        isEventActive = false; 
        updateMonologue(); 
        saveSessionData(); 
        
        setTimeout(() => { 
             document.querySelectorAll('.map-spot').forEach(s => { s.classList.add('spot-visible'); s.querySelector('.hint-text').classList.remove('selected-yellow'); }); 
        }, 250);
    } 
    else { 
        updateMonologue(); 
        saveSessionData(); 
        setTimeout(() => { 
            document.getElementById('fade-overlay').classList.add('active'); 
            bgmMap.pause(); 
            setTimeout(showEnding, 3000); 
        }, 3000);
    }
}