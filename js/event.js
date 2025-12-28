// =========================================
//  Event Logic (イベント進行・判定)
// =========================================

// マップスポットクリック時の処理
function handleSpotClick(el, idx) {
    console.log("--- handleSpotClick Start --- idx:", idx); 
    document.getElementById('monologue-container').classList.remove('visible');

    // ▼ ゲーム終了判定などの基本チェック
    if (!isGameStarted || isEventActive || turn > maxTurn) return; 
    
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
    
    // UI判定条件 (おすすめ判定)
    const statsValues = Object.values(stats);
    const minVal = Math.min(...statsValues);
    const maxVal = Math.max(...statsValues);
    // ▼ ここで算出している isRecommended を最後まで渡す必要があります
    const isRecommended = (stats[assign.main] === minVal) && (stats[assign.main] < maxVal);
    
    let tierNum, tierKey; 
    if (turn <= 6) { tierNum = 1; tierKey = 'newcomer'; }
    else if (turn <= 13) { tierNum = 2; tierKey = 'mid'; }
    else { tierNum = 3; tierKey = 'veteran'; }
    
    const eventFile = gameAssets.events[`${s.file}_${tierNum}`];

    let isH = false, dMsg = "", bCh = {}, out = 'success';
    let imgId = null; 

    // --- イベント抽選ロジック ---
    
    let chance = isForcedHeroine ? 1.0 : (stats[assign.main] / 50) + (consecutiveNormalEvents * 0.1); 
    if (chance < 0.05) chance = 0.05; 
    if (lastEventWasHeroine && !isForcedHeroine) chance = 0;
    
    if (h.progress >= 5) { 
        // 後日談
        isH = true; lastEventWasHeroine = true; stopBgm = true;
        dMsg = h.events[5] || h.afterMsg || "穏やかな時間が流れた。"; 
        bCh[assign.main] = 5; bCh[assign.sub] = 2; 
        out = 'heroine'; 
        lastEventContext = { name: h.name, progress: 6 }; 
        if (!clearedHeroines.includes(h.name)) {
            clearedHeroines.push(h.name);
            localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
        }
    } else if (anyM && h.progress >= 1) { 
        // 世間話
        isH = true; lastEventWasHeroine = true; stopBgm = true;
        dMsg = h.events[6] || h.chatMsg || "互いの近況を語り合い、穏やかな時間を過ごした。"; 
        bCh[assign.main] = 2; bCh[assign.sub] = 1; 
        out = 'heroine'; 
        lastEventContext = { name: h.name, progress: 7 };
    } else if (Math.random() < chance) { 
        // ヒロイン本編イベント
        const reqA = h.minAvg[Math.min(h.progress, 4)] || 0;
        const reqM = (h.progress + 1) * 8; 
        const reqS = (h.progress + 1) * 4;
        
        const isAvgOk = avgStat >= reqA;
        const isMainOk = stats[assign.main] >= reqM;
        const isSubOk = stats[assign.sub] >= reqS;
        
        if (!isAvgOk || !isMainOk || !isSubOk) {
            isH = false; out = 'hint';
            
            let mIdx = (h.progress >= 4) ? 2 : (h.progress >= 1 ? 1 : 0);
            
            // ヒント生成ロジック (event.jsに集約)
            let dynamicHint = "";

            if (!isAvgOk) {
                // ■平均値不足の場合
                // heroines_data.js は純粋なテキストのみになったので、そのまま取得
                dMsg = h.lockAvgMsgs[mIdx];
                
                // ここでヒント文を生成
                dynamicHint = `||[Hint] <br>各地を巡り、全ステータスの【<span style="color:${statColors.average}">平均値</span>】を上げると物語が進展します。`;
            } else {
                // ■個別ステータス不足の場合
                dMsg = h.lockStatMsgs[mIdx];
                
                // 不足しているステータスに応じてヒントを分岐生成
                if (!isMainOk && !isSubOk) {
                    const mainIcon = `<i class="fa-solid ${statConfig[assign.main].icon}" style="color:${statColors[assign.main]}; margin-right:4px;"></i>`;
                    const subIcon = `<i class="fa-solid ${statConfig[assign.sub].icon}" style="color:${statColors[assign.sub]}; margin-right:4px;"></i>`;
                    dynamicHint = `||[Hint] <br>この場所に関連する${mainIcon}【<span style="color:${statColors[assign.main]}">${statConfig[assign.main].name}</span>】や、${subIcon}【<span style="color:${statColors[assign.sub]}">${statConfig[assign.sub].name}</span>】をより高めると物語が進展します。`;
                } else if (!isMainOk) {
                    const config = statConfig[assign.main];
                    const icon = `<i class="fa-solid ${config.icon}" style="color:${statColors[assign.main]}; margin-right:4px;"></i>`;
                    dynamicHint = `||[Hint] <br>${icon}【<span style="color:${statColors[assign.main]}">${config.name}</span>】がもう少しあれば、彼女の期待に応えられるかもしれない……。`;
                } else {
                    const config = statConfig[assign.sub];
                    const icon = `<i class="fa-solid ${config.icon}" style="color:${statColors[assign.sub]}; margin-right:4px;"></i>`;
                    dynamicHint = `||[Hint] <br>${icon}【<span style="color:${statColors[assign.sub]}">${config.name}</span>】を磨けば、彼女との距離が縮まるはずだ。`;
                }
            }
            
            // 最後に物語とヒントを結合（改ページ付き）
            dMsg = dMsg + dynamicHint;
            
            const buffBonus = isMotivationBuff ? 3 : 0;
            bCh[assign.main] = (tierNum * 2) + buffBonus;
            bCh[assign.sub] = (tierNum * 1) + buffBonus;
            if(isMotivationBuff) isMotivationBuff = false;
        } else {
            // ヒロインイベント成功
            isH = true; lastEventWasHeroine = true; consecutiveNormalEvents = 0; stopBgm = true;
            dMsg = h.events[Math.min(h.progress, 4)]; 
            h.progress++; h.affection++; 
            bCh[assign.main] = 4+(tierNum * 2);
            bCh[assign.sub] = 2+(tierNum * 2); 
            isMotivationBuff = true;
            out = 'heroine'; 
            lastEventContext = { name: h.name, progress: h.progress };
            if (h.progress >= 5) {
                if (!clearedHeroines.includes(h.name)) {
                    clearedHeroines.push(h.name);
                    localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
                }
            }
        } 
    } else { 
        // 訓練（スポットイベント）
        isH = false; lastEventWasHeroine = false; consecutiveNormalEvents++; 
        
        let weights = { failure: 35, success: 55, great: 10 };
        if (tierKey === 'mid') weights = { failure: 15, success: 70, great: 15 };
        else if (tierKey === 'veteran') weights = { failure: 10, success: 50, great: 40 };

        let outcomeType = "";
        const rand = Math.random() * 100;
        if (isRecommended) {
            if (rand < weights.failure + weights.success) outcomeType = "success";
            else outcomeType = "great";
        } else {
            if (rand < weights.failure) outcomeType = "failure";
            else if (rand < weights.failure + weights.success) outcomeType = "success";
            else outcomeType = "great";
        }

        // おすすめ時の失敗回避
        if (isRecommended && outcomeType === "failure") outcomeType = "success";

        let pool = [];
        if (eventFile && eventFile[tierKey]) pool = eventFile[tierKey][outcomeType] || [];
        if (pool.length === 0 && eventFile[tierKey]) pool = eventFile[tierKey]["success"] || [];
        
        const ev = pool[Math.floor(Math.random() * pool.length)];
        
        if (ev) {
            out = outcomeType; 
            lastEventResult = out;
            imgId = ev.image; 

            const bonus = isRecommended ? 1 : 0; 
            const buffBonus = isMotivationBuff ? 2 : 0;
            
            bCh = {}; 

            if (out === 'success' || out === 'great') {
                bCh[assign.main] = (ev.changes[assign.main] || 0) + bonus + buffBonus;
                bCh[assign.sub] = (ev.changes[assign.sub] || 0) + bonus + buffBonus;
            } else if (out === 'failure') {
                const lossM = ev.changes[assign.main] || 0;
                const lossS = ev.changes[assign.sub] || 0;
                if (isMotivationBuff) {
                    bCh[assign.main] = (lossM < 0) ? -1 : lossM;
                    bCh[assign.sub] = (lossS < 0) ? -1 : lossS;
                } else {
                    bCh[assign.main] = lossM;
                    bCh[assign.sub] = lossS;
                }
            }
            dMsg = ev.text;
            if(isMotivationBuff) isMotivationBuff = false;
        } else {
            console.error(`[EventError] No event found for ${s.file}_${tierNum}`);
        }
    }
    
    // おすすめスポットでの成長ボーナス(+1)
    if (isRecommended) { 
        for (let k in bCh) { if (bCh[k] > 0) bCh[k] += 1; } 
    }

    // --- ここから追加仕様（地域ブースト） ---
    // activeImpacts配列を走査し、「有効(true)」かつ「ターゲットが今の場所(idx)」であるものを探す
    const isBoostActive = activeImpacts.some((isActive, i) => isActive && heroineImpacts[i].target === idx);

    if (isBoostActive) {
        bCh[assign.main] = (bCh[assign.main] || 0) + 1;
        bCh[assign.sub] = (bCh[assign.sub] || 0) + 1;
    }

    const statsBefore = { ...stats };
    const originalChanges = { ...bCh }; 
    const overflowChanges = updateStatsWithOverflow(bCh); 

    for (const [key, bonus] of Object.entries(overflowChanges)) {
        bCh[key] = (bCh[key] || 0) + bonus;
    }

    applyEventView(dMsg, bCh, isH, h, s, out, idx, imgId, statsBefore, overflowChanges, originalChanges, isRecommended, isBoostActive);
    if (stopBgm) bgmMap.pause();
}

// 余剰分を最小ステータスに振り分ける共通関数
function updateStatsWithOverflow(changes) {
    const overflowChanges = {};

    for (const [key, val] of Object.entries(changes)) {
        if (val <= 0) {
            stats[key] = Math.max(0, stats[key] + val);
            updateUI(key);
            continue;
        }

        const oldVal = stats[key];
        let newVal = oldVal + val;
        
        if (newVal > 50) {
            const actualGain = 50 - oldVal; // 実際に増えた量（例: 48->50なら2）
            const overflow = newVal - 50;  // 溢れた量（例: 8-2=6）
            
            stats[key] = 50;
            updateUI(key);

            // ★ changes[key] を「実際に増えた量」に書き換える！
            // これでログが [+8 -> +2] という表示の材料になります
            changes[key] = actualGain; 
            
            const bonus = Math.ceil(overflow / 2);
            if (bonus > 0) {
                let minKey = Object.keys(stats)[0];
                for (const s in stats) {
                    if (stats[s] < stats[minKey]) minKey = s;
                }
                stats[minKey] = Math.min(50, stats[minKey] + bonus);
                updateUI(minKey);

                // overflowChanges には「おこぼれ」を入れる
                overflowChanges[minKey] = (overflowChanges[minKey] || 0) + bonus;
                //console.log(`[Overflow] ${key}から${minKey}に+${bonus}加算`);
            }
        } else {
            stats[key] = newVal;
            updateUI(key);
            // changes[key] はそのまま（valと同じ）
        }
    }
    checkRankUpdate(); 
    // デバッグ用に溢れ情報を返す（または広域変数にセットする）
    return overflowChanges;
}

// ステータス変化をHTML化する関数（バフ対応版）
function getResultHtml(changes) {
    const parts = Object.entries(changes).map(([k, v]) => {
        if (v === 0) return ""; 
        
        const config = statConfig[k] || {};
        const statColor = statColors[k] || '#fff'; // パラメータ固有の色
        const icon = config.icon || '';
        const name = config.name || k; // パラメータ名
        
        // 記号と色の判別：上昇は赤系（#ff4d4d）、下降は青系（#4d94ff）
        const mark = v > 0 ? '▲' : '▼';
        const markColor = v > 0 ? '#ff4d4d' : '#4d94ff';
        
        // [アイコン] パラメータ名 [▲or▼] の形式で組み立て
        return `<span style="margin-right:12px; white-space:nowrap;">` +
               `<i class="fa-solid ${icon}" style="color:${statColor}"></i> ` +
               `<span style="color:${statColor}">${name}</span>` +
               `<span style="color:${markColor}">${mark}</span>` +
               `</span>`;
    });
    
    let html = parts.filter(p => p !== "").join('');
    
    // グローバル変数をそのまま参照して、trueなら炎を足す
    if (isMotivationBuff) {
        html += `<i class="fa-solid fa-fire" style="color:#ffaa00; margin-left:8px; font-size:14px;"></i>`;
    }
    
    return html;
}

// イベント画面の構築・表示
function applyEventView(msg, changes, isH, h, s, out, idx, imgId, statsBefore, overflowChanges, originalChanges, isRecommended, isBoost) {
    if (typeof logEventResult === 'function') {
        logEventResult(turn, out, isH, changes, statsBefore, statKeys, isMotivationBuff, overflowChanges, originalChanges, h, isRecommended, isBoost);
    }

    let cLog = isResultHidden ? "" : getResultHtml(changes); 
    let outcomeHtml = ""; 
    if (!isH && out !== 'hint' && out !== 'heroine' && out !== 'exclusive') { 
        if (out === 'great_success' || out === 'great') outcomeHtml = `<span class="outcome-badge great">【大成功】</span>`; 
        else if (out === 'success') outcomeHtml = `<span class="outcome-badge success">【成功】</span>`; 
        else if (out === 'failure') outcomeHtml = `<span class="outcome-badge failure">【失敗】</span>`; 
    } 
    let logL = isH ? `(<i class="fa-solid ${h ? h.icon : ''}"></i> ${h ? h.name : ''})` : ""; 
    const locLabel = `<i class="fa-solid ${s.icon}"></i> ${s.name}`; 
    
    // ログ保存
    currentGameLog.push(`<div class="log-entry"><div class="log-header">Turn ${turn} : ${locLabel} ${logL} ${outcomeHtml} ${getResultHtml(changes)}</div><div class="log-body">${formatGameText(typeof msg === 'string' ? msg : msg.join('')).replace(/\n/g, '<br>')}</div></div>`); 
    document.getElementById("log-content").innerHTML = currentGameLog.join(''); 
    
    // 背景演出
    const bgLayer = document.getElementById("background-layer");
    bgLayer.style.transformOrigin = `${spotAssignments[idx].l}% ${spotAssignments[idx].t}%`; 
    bgLayer.style.transform = `scale(${s.zoom || 2.5})`; 
    bgLayer.classList.add("blur-bg"); 
    
    // イベントスチル表示
    const stillLayer = document.getElementById("event-still-layer");
    stillLayer.innerHTML = ""; 
    stillLayer.classList.remove("zodiac-card");
    stillLayer.style.backgroundImage = ""; 

    if (imgId) {
        stillLayer.style.backgroundImage = `url('images/bg/${s.file}_${imgId}.png')`;
        stillLayer.classList.add("active");
    } 
    
    // ▼▼▼ TextEngine 初期化 ▼▼▼
    const fullText = Array.isArray(msg) ? msg.join('') : msg;
    TextEngine.init(fullText);

    currentMsgIndex = 0; isResultDisplayed = false; pendingResultHtml = outcomeHtml + cLog; 
    
    document.getElementById("loc-icon").innerHTML = `<i class="fa-solid ${s.icon}"></i>`; 
    document.getElementById("loc-name").innerText = s.name; 
    document.getElementById("loc-stats").innerHTML = getLocStatusHtml(idx); 
    const cb = document.getElementById("char-name-badge"); 
    if (isH && h) { 
        cb.innerHTML = `<i class="fa-solid ${h.icon}"></i> ${h.title} ${h.name}`; 
        cb.style.display = "flex"; 
    } else {
        cb.style.display = "none"; 
    }
    
    // テキストエリアをクリア
    document.getElementById("message-text").innerHTML = ""; 
    document.getElementById("result-display").innerHTML = ""; 
    document.getElementById("result-display").style.opacity = "0"; 
    document.getElementById("page-cursor").classList.remove("active"); 
    
    document.getElementById("message-window").classList.add("active"); 
    document.getElementById("click-overlay").classList.add("active"); 
    
    // 最初の1文を表示
    setTimeout(proceedText, 300);
}

/* --- js/event.js --- */

function proceedText() {
    const textBox = document.getElementById("message-text");
    const cursor = document.getElementById("page-cursor");

    // 1. 演出中ならスキップ完了
    if (isTyping) {
        finishTyping();
        return;
    }
    
    // 2. 結果表示済みなら終了
    if (isResultDisplayed) {
        cursor.classList.remove("active"); 
        closeEvent();
        return;
    }

    // 3. 次のテキスト取得
    const currentHtml = textBox.innerHTML;
    const result = TextEngine.getNext(currentHtml);

    // 終了判定
    if (result.isEnd) {
        if (isResultHidden) { 
            closeEvent(); 
        } else {
            cursor.classList.remove("active"); 
            showFinalResult(); 
            cursor.classList.add("active"); 
        }
        return;
    }

    // リセット（改ページ）判定
    if (result.reset) {
        textBox.innerHTML = "";
    } 
    
    // ★削除: ここにあった「endsWith("」") なら <br> を足す」処理は削除します。
    // (TextEngine側で既に <br> が付いているため)

    // 4. タイプライタ演出開始
    const formattedText = formatGameText(result.text);
    startTypeWriter(formattedText);
}

// イベント終了処理（既存のまま）
function closeEvent() { 
    const bgLayer = document.getElementById("background-layer");
    bgLayer.style.transform = "scale(1)"; 
    bgLayer.classList.remove("blur-bg"); 
    document.getElementById("event-still-layer").classList.remove("active");
    
    document.getElementById("message-window").classList.remove("active"); 
    document.getElementById("click-overlay").classList.remove("active"); 
    document.getElementById("page-cursor").classList.remove("active"); 
    
    if (bgmMap.paused) bgmMap.play();
  
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