// =========================================
//  Event Logic (イベント進行・判定)
// =========================================

// マップスポットクリック時の処理
function handleSpotClick(el, idx) {
    console.log("--- handleSpotClick Start --- idx:", idx); // これを追加
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
    
    const statsValues = Object.values(stats);
    const minVal = Math.min(...statsValues);
    const maxVal = Math.max(...statsValues);

    // UI(updateRecommend)の判定条件と完全に一致させる
    const isRecommended = (stats[assign.main] === minVal) && (stats[assign.main] < maxVal);
    
    // 習熟度（ランク）判定：合意したターン数ベース
    let tierNum, tierKey; 
    if (turn <= 6) { tierNum = 1; tierKey = 'newcomer'; }
    else if (turn <= 13) { tierNum = 2; tierKey = 'mid'; }
    else { tierNum = 3; tierKey = 'veteran'; }
    
    const eventFile = gameAssets.events[`${s.file}_${tierNum}`];

    let isH = false, dMsg = "", bCh = {}, out = 'success';
    let imgId = null; 

    if (activeIdx !== -1) {
        // 特別イベント処理
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
        // 通常のイベント抽選ロジック
        let chance = isForcedHeroine ? 1.0 : (stats[assign.main] / 50) + (consecutiveNormalEvents * 0.1); 
        if (chance < 0.05) chance = 0.05; 
        if (lastEventWasHeroine && !isForcedHeroine) chance = 0;
        
        if (h.progress >= 5) { 
            // 後日談処理
            isH = true; lastEventWasHeroine = true; stopBgm = true;
            
            // プレフィックスを削除し、JSON内のテキストをそのまま表示
            const storyBody = h.events[5] || h.afterMsg || "穏やかな時間が流れた。";
            dMsg = storyBody; 

            bCh[assign.main] = 5; bCh[assign.sub] = 2; 
            out = 'heroine'; 
            lastEventContext = { name: h.name, progress: 6 }; 
            if (!clearedHeroines.includes(h.name)) {
                clearedHeroines.push(h.name);
                localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
            }
        } else if (anyM && h.progress >= 1) { 
            // 世間話処理
            isH = true; lastEventWasHeroine = true; stopBgm = true;

            // 7番目（インデックス6）に専用の世間話があればそれを、なければ汎用を表示
            const chatBody = h.events[6] || h.chatMsg || "互いの近況を語り合い、穏やかな時間を過ごした。";
            dMsg = chatBody; 

            bCh[assign.main] = 2; bCh[assign.sub] = 1; 
            out = 'heroine'; 
            lastEventContext = { name: h.name, progress: 7 };
        }else if (Math.random() < chance) { 
            // ヒロイン本編イベント判定
            const reqA = h.minAvg[Math.min(h.progress, 4)] || 0;
            const reqM = (h.progress + 1) * 8; 
            const reqS = (h.progress + 1) * 4;
            const mIdx = h.progress < 2 ? 0 : 1; 
            
            const isAvgOk = avgStat >= reqA;
            const isMainOk = stats[assign.main] >= reqM;
            const isSubOk = stats[assign.sub] >= reqS;

            if (!isAvgOk || !isMainOk || !isSubOk) {
                isH = false; out = 'hint';
                
                // --- 親密度に応じたメッセージ段階の決定 (追加箇所) ---
                let mIdx = 0;
                if (h.progress >= 4) {
                    mIdx = 2; // 最終盤（親密度4）
                } else if (h.progress >= 1) {
                    mIdx = 1; // 交流中（親密度1-3）
                } else {
                    mIdx = 0; // 初対目前（親密度0）
                }
                // ------------------------------------------------
                
                if (!isAvgOk) {
                    dMsg = h.lockAvgMsgs[mIdx];
                } else {
                    // lockStatMsgsから地の文を取得（ヒントラベルを除去して動的生成に備える）
                    const baseStory = h.lockStatMsgs[mIdx].split('\n[Hint]')[0];
                    let dynamicHint = "";
                    
                    if (!isMainOk && !isSubOk) {
                        // メイン・サブ両方不足時
                        const mainIcon = `<i class="fa-solid ${statConfig[assign.main].icon}" style="color:${statColors[assign.main]}; margin-right:4px;"></i>`;
                        const subIcon = `<i class="fa-solid ${statConfig[assign.sub].icon}" style="color:${statColors[assign.sub]}; margin-right:4px;"></i>`;
                        dynamicHint = `\n[Hint] この場所に関連する${mainIcon}<span style="color:${statColors[assign.main]}">${statConfig[assign.main].name}</span>や、${subIcon}<span style="color:${statColors[assign.sub]}">${statConfig[assign.sub].name}</span>をより高めると物語が進展します。`;
                    } else if (!isMainOk) {
                        // メイン不足時
                        const config = statConfig[assign.main];
                        const icon = `<i class="fa-solid ${config.icon}" style="color:${statColors[assign.main]}; margin-right:4px;"></i>`;
                        dynamicHint = `\n[Hint] ${icon}<span style="color:${statColors[assign.main]}">${config.name}</span>がもう少しあれば、彼女の期待に応えられるかもしれない……。`;
                    } else {
                        // サブ不足時
                        const config = statConfig[assign.sub];
                        const icon = `<i class="fa-solid ${config.icon}" style="color:${statColors[assign.sub]}; margin-right:4px;"></i>`;
                        dynamicHint = `\n[Hint] ${icon}<span style="color:${statColors[assign.sub]}">${config.name}</span>を磨けば、彼女との距離が縮まるはずだ。`;
                    }
                    dMsg = baseStory + dynamicHint;
                }
                
                // --- 育成ボーナス計算 (既存) ---
                const buffBonus = isMotivationBuff ? 3 : 0;
                bCh[assign.main] = (tierNum * 2) + buffBonus;
                bCh[assign.sub] = (tierNum * 1) + buffBonus;

                const activeBuff = isMotivationBuff;
                if (activeBuff) {
                    isMotivationBuff = false;
                }
            } else {
                // すべての条件を達成：イベント発生
                // ...以下、既存の成功処理...
                // イベント成功
                isH = true; lastEventWasHeroine = true; consecutiveNormalEvents = 0; stopBgm = true;
                dMsg = h.events[Math.min(h.progress, 4)]; 
                h.progress++; h.affection++; 
                bCh[assign.main] = 4+(tierNum * 2);
                bCh[assign.sub] = 2+(tierNum * 2); 
                // バフをONにする
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
        }else { 
            // 訓練（スポットイベント）抽選
            isH = false; lastEventWasHeroine = false; consecutiveNormalEvents++; 
            
            // ランク別重み設定（%）
            let weights = { failure: 35, success: 55, great: 10 };
            if (tierKey === 'mid') weights = { failure: 15, success: 70, great: 15 };
            else if (tierKey === 'veteran') weights = { failure: 10, success: 50, great: 40 };

            // おすすめ時の失敗回避ロジック
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

            // JSON構造から該当プールのイベントを抽出
            let pool = [];
            if (eventFile && eventFile[tierKey]) {
                pool = eventFile[tierKey][outcomeType] || [];
            }
            
            // 安全装置：プールが空ならsuccessを試行
            if (pool.length === 0 && eventFile[tierKey]) pool = eventFile[tierKey]["success"] || [];
            const ev = pool[Math.floor(Math.random() * pool.length)];
            
            if (ev) {
                out = outcomeType; 
                lastEventResult = out;
                imgId = ev.image; 

                // --- ここからバフ適用ロジック ---
                const bonus = isRecommended ? 1 : 0; 
                const buffBonus = isMotivationBuff ? 2 : 0; // バフONなら+2、OFFなら0
                
                bCh = {}; // 空で初期化

                if (out === 'success' || out === 'great') {
                    // 成功・大成功：基本増加量 + おすすめボーナス + モチベバフ
                    bCh[assign.main] = (ev.changes[assign.main] || 0) + bonus + buffBonus;
                    bCh[assign.sub] = (ev.changes[assign.sub] || 0) + bonus + buffBonus;
                } else if (out === 'failure') {
                    // 失敗：減少が発生する場合、バフ中なら -1 に抑える
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
                // メッセージの組み立てとバフの消費
                if (isMotivationBuff) {                    
                    isMotivationBuff = false; // 1回のみ有効なのでここでOFFにする
                }
                // --- ここまで ---

            } else {
                console.error(`[EventError] No event found for ${s.file}_${tierNum} (${tierKey}:${outcomeType})`);
            }
        }
        
    }

    // おすすめスポットでの成長ボーナス(+1)
    if (isRecommended) { 
        for (let k in bCh) { if (bCh[k] > 0) bCh[k] += 1; } 
    }
    // handleSpotClick の末尾
    const statsBefore = { ...stats };
    const originalChanges = { ...bCh }; // ここでコピーを取る
    const overflowChanges = updateStatsWithOverflow(bCh); 

    for (const [key, bonus] of Object.entries(overflowChanges)) {
        // bCh[key] は updateStatsWithOverflow 内ですでに「実際の増分」に書き換わっているので、
        // そこにおこぼれ分を加算すれば「そのターンにその項目が動いた総量」になります
        bCh[key] = (bCh[key] || 0) + bonus;
    }

    applyEventView(dMsg, bCh, isH, h, s, out, idx, imgId, statsBefore, overflowChanges, originalChanges);    if (stopBgm) bgmMap.pause();
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
function applyEventView(msg, changes, isH, h, s, out, idx, imgId, statsBefore, overflowChanges, originalChanges) {
    if (typeof logEventResult === 'function') {
        // 10番目の引数として、この関数の引数にある h をそのまま渡す
        logEventResult(turn, out, isH, changes, statsBefore, statKeys, isMotivationBuff, overflowChanges, originalChanges, h);
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
    
    currentGameLog.push(`<div class="log-entry"><div class="log-header">Turn ${turn} : ${locLabel} ${logL} ${outcomeHtml} ${getResultHtml(changes)}</div><div class="log-body">${formatGameText(msg).replace(/\n/g, '<br>')}</div></div>`); 
    document.getElementById("log-content").innerHTML = currentGameLog.join(''); 
    
    // 背景演出（ズーム＆ブラー）
    const bgLayer = document.getElementById("background-layer");
    bgLayer.style.transformOrigin = `${spotAssignments[idx].l}% ${spotAssignments[idx].t}%`; 
    bgLayer.style.transform = `scale(${s.zoom || 2.5})`; 
    bgLayer.classList.add("blur-bg"); 
    
    // イベントスチル表示処理
    const stillLayer = document.getElementById("event-still-layer");
    // 以前の動的生成要素（アイコン）をクリアし、クラスをリセット
    stillLayer.innerHTML = ""; 
    stillLayer.classList.remove("zodiac-card");
    stillLayer.style.backgroundImage = ""; // グラデーション用リセット

    if (imgId) {
        console.log("画像ルート");
        // ▼ 既存の処理をそのまま維持 ▼
        stillLayer.style.backgroundImage = `url('images/bg/${s.file}_${imgId}.png')`;
        stillLayer.classList.add("active");
    } 
    else if (isH && h.zodiac) {
        console.log("ヒロインイベントルート");
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