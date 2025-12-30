// =========================================
//  Event Logic (イベント進行・判定)
// =========================================

// ★定数・変数定義 (連打ガード・遷移時間管理用)
const SCENE_TRANSITION_MS = GameConfig.tempo.fade; 
const TRANSITION_BUFFER = GameConfig.tempo.transitionBuffer;   
let isClosingEvent = false;

// マップスポットクリック時の処理
function handleSpotClick(el, idx) {
    // ★ガード最優先: コンソール出力よりも先に判定（無駄な処理を一切させない）
    if (currentStatus !== GameStatus.MAP || !isGameStarted || isEventActive || turn > maxTurn || isProcessingTurn || isClosingEvent) {
        return;
    }
    
    console.log("--- handleSpotClick Start --- idx:", idx); 

    // ★有効クリック確定後に消去
    document.getElementById('monologue-container').classList.remove('visible');

    isEventActive = true; 
    isResultDisplayed = false; 
    isResultHidden = false;
    
    // isClosingEvent = false; // ←【削除】ここでリセットする必要はありません（ガード通過時点でfalse確定のため）
    
    playSE(seFootstep); 
    
    let stopBgm = false;

    el.querySelector('.hint-text').classList.add('selected-yellow'); 
    document.querySelectorAll('.map-spot').forEach(s => s.classList.remove('spot-visible'));
    
    const s = scenarios[idx];
    const h = heroines[idx]; 
    h.events = gameAssets.heroines[h.file].events; 

    // ... (以下、元のコードのまま変更なし) ...
    const avgStat = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
    const assign = spotAssignments[idx];
    const anyM = heroines.some(hero => hero.progress >= 5);
    
    // UI判定条件
    const statsValues = Object.values(stats);
    const minVal = Math.min(...statsValues);
    const maxVal = Math.max(...statsValues);
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
        isH = true; lastEventWasHeroine = true; stopBgm = true;
        dMsg = h.events[5] || h.afterMsg || "穏やかな時間が流れた。"; 
        bCh[assign.main] = 5; bCh[assign.sub] = 2; 
        out = 'heroine'; 
        imgId = "05";
        lastEventContext = { name: h.name, progress: 6 }; 
        if (!clearedHeroines.includes(h.name)) {
            clearedHeroines.push(h.name);
            localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
        }
    } else if (anyM && h.progress >= 1) { 
        isH = true; lastEventWasHeroine = true; stopBgm = true;
        dMsg = h.events[6] || h.chatMsg || "互いの近況を語り合い、穏やかな時間を過ごした。"; 
        bCh[assign.main] = 2; bCh[assign.sub] = 1; 
        out = 'heroine'; 
        imgId = "06";
        lastEventContext = { name: h.name, progress: 7 };
    } else if (Math.random() < chance) { 
        const reqA = h.minAvg[Math.min(h.progress, 4)] || 0;
        const reqM = (h.progress + 1) * 8; 
        const reqS = (h.progress + 1) * 4;
        
        const isAvgOk = avgStat >= reqA;
        const isMainOk = stats[assign.main] >= reqM;
        const isSubOk = stats[assign.sub] >= reqS;
        
        if (!isAvgOk || !isMainOk || !isSubOk) {
            isH = false; out = 'hint';
            
            let mIdx = (h.progress >= 4) ? 2 : (h.progress >= 1 ? 1 : 0);
            let dynamicHint = "";

            if (!isAvgOk) {
                dMsg = h.lockAvgMsgs[mIdx];
                dynamicHint = `||[Hint] <br>各地を巡り、全ステータスの【<span style="color:${statColors.average}">平均値</span>】を上げると物語が進展します。`;
            } else {
                dMsg = h.lockStatMsgs[mIdx];
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
            dMsg = dMsg + dynamicHint;
            
            const buffBonus = isMotivationBuff ? 3 : 0;
            bCh[assign.main] = (tierNum * 2) + buffBonus;
            bCh[assign.sub] = (tierNum * 1) + buffBonus;
            if(isMotivationBuff) isMotivationBuff = false;
        } else {
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
    
    if (isRecommended) { 
        for (let k in bCh) { if (bCh[k] > 0) bCh[k] += 1; } 
    }
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

    if (stopBgm) {
        if (isH && h) {
            playHeroineBgmByFile(h.file);
        }
    } else {
        if (typeof switchToMapBgm === 'function') switchToMapBgm();
        else stopHeroineBgm();
    }
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
            const actualGain = 50 - oldVal; 
            const overflow = newVal - 50;  
            
            stats[key] = 50;
            updateUI(key);

            changes[key] = actualGain; 
            
            const bonus = Math.ceil(overflow / 2);
            if (bonus > 0) {
                let minKey = Object.keys(stats)[0];
                for (const s in stats) {
                    if (stats[s] < stats[minKey]) minKey = s;
                }
                stats[minKey] = Math.min(50, stats[minKey] + bonus);
                updateUI(minKey);

                overflowChanges[minKey] = (overflowChanges[minKey] || 0) + bonus;
            }
        } else {
            stats[key] = newVal;
            updateUI(key);
        }
    }
    checkRankUpdate(); 
    return overflowChanges;
}

// ステータス変化をHTML化する関数（バフ対応版）
function getResultHtml(changes) {
    const parts = Object.entries(changes).map(([k, v]) => {
        if (v === 0) return ""; 
        
        const config = statConfig[k] || {};
        const statColor = statColors[k] || '#fff'; 
        const icon = config.icon || '';
        const name = config.name || k; 
        
        const mark = v > 0 ? '▲' : '▼';
        const markColor = v > 0 ? '#ff4d4d' : '#4d94ff';
        
        return `<span style="margin-right:12px; white-space:nowrap;">` +
               `<i class="fa-solid ${icon}" style="color:${statColor}"></i> ` +
               `<span style="color:${statColor}">${name}</span>` +
               `<span style="color:${markColor}">${mark}</span>` +
               `</span>`;
    });
    
    let html = parts.filter(p => p !== "").join('');
    
    if (isMotivationBuff) {
        html += `<i class="fa-solid fa-fire" style="color:#ffaa00; margin-left:8px; font-size: 1.2em; flex-shrink: 0;"></i>`;
    }
    
    return html;
}

// =========================================
//  Still (スチル) 演出
// =========================================

const STILL_BASE_PATH = 'images/chara';
const STILL_FOLDER = { normal: '00_normal', special: '01_special' };
const STILL_OFFSET_Y_PX = -35; 

// 演出開始時（夢の中のようにぼやけさせる設定）
const STILL_INTRO_PARAMS = {
    blur: 20, sepia: 50, saturate: 80, zoom: 1.0,
    cx: 50, cy: 50, x: 50, y: 50, 
    vignette: 10, texture: 0
};

// --- スチルFX DOM ---
function ensureStillFxDom(layer) {
    const existing = layer.querySelector('.stillfx');
    if (existing) {
        return {
            container: existing,
            imgBg: layer.querySelector('.layer-bg'),
            imgFocus: layer.querySelector('.layer-focus'),
            svgScale: layer.querySelector('#svg-distort-scale'),
        };
    }

    layer.innerHTML = `
      <div class="stillfx">
        <svg class="svg-filters">
          <defs>
            <filter id="oil-paint-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" id="svg-distort-scale" />
            </filter>
          </defs>
        </svg>
        <img class="layer layer-bg" />
        <img class="layer layer-focus" />
        <div class="layer-vignette"></div>
        <div class="layer-texture"></div>
      </div>
    `;

    return {
        container: layer.querySelector('.stillfx'),
        imgBg: layer.querySelector('.layer-bg'),
        imgFocus: layer.querySelector('.layer-focus'),
        svgScale: layer.querySelector('#svg-distort-scale'),
    };
}

// 1. パラメータの正規化
function normalizeStillParams(p) {
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    const src = p || {};
    return {
        blur: clamp(Number(src.blur ?? 0), 0, 40),
        sepia: clamp(Number(src.sepia ?? 0), 0, 100),
        saturate: clamp(Number(src.saturate ?? 100), 0, 300),
        zoom: clamp(Number(src.zoom ?? 1.0), 1.0, 3.0),
        cx: clamp(Number(src.cx ?? 50), 0, 100),
        cy: clamp(Number(src.cy ?? 50), 0, 100),
        x: src.x ?? 50, y: src.y ?? 50,
        distort: src.distort ?? 0,
        size: src.size ?? 15,
        vignette: src.vignette ?? 0,
        texture: src.texture ?? 0
    };
}

// 2. スタイル適用（第3引数でDOMを直接受け取れるようにする）
function applyStillStyle(layer, params, forceDom = null) {
    if (!layer) return;
    const p = normalizeStillParams(params);
    const dom = forceDom || layer.__stillFxDom; 
    
    layer.style.setProperty('--x', p.x + '%');
    layer.style.setProperty('--y', p.y + '%');
    layer.style.setProperty('--cx', p.cx + '%');
    layer.style.setProperty('--cy', p.cy + '%');
    layer.style.setProperty('--zoom', p.zoom);
    
    layer.style.setProperty('--blur', p.blur + 'px');
    layer.style.setProperty('--sepia', p.sepia + '%');
    layer.style.setProperty('--saturate', p.saturate + '%');
    layer.style.setProperty('--vignette', p.vignette / 100);
    layer.style.setProperty('--texture', p.texture / 100);

    const filterStr = `blur(${p.blur}px) sepia(${p.sepia}%) saturate(${p.saturate}%)`;
    
    if (dom && dom.imgBg) {
        dom.imgBg.style.filter = filterStr;
        if (p.distort > 0) {
             dom.imgBg.style.filter += ` url(#oil-paint-filter)`;
             if (dom.svgScale) dom.svgScale.setAttribute('scale', String(p.distort));
        } else {
             if (dom.svgScale) dom.svgScale.setAttribute('scale', "0");
        }
        dom.imgBg.style.transformOrigin = `${p.cx}% ${p.cy}%`;
        dom.imgBg.style.transform = `scale(${p.zoom})`;
    }
    
    if (dom && dom.imgFocus) {
         dom.imgFocus.style.transformOrigin = `${p.cx}% ${p.cy}%`;
         dom.imgFocus.style.transform = `scale(${p.zoom})`;
    }
}

// 3. アニメーション実行関数
function animateStillFx(dom, startParams, endParams, duration) {
    const start = performance.now();
    const s = normalizeStillParams(startParams);
    const e = normalizeStillParams(endParams);

    function step(now) {
        const elapsed = now - start;
        let progress = Math.min(elapsed / duration, 1.0);

        const t = progress;
        const easeMove = 1 - Math.pow(1 - t, 3); // 移動用
        const easeEffect = Math.pow(t, 3);       // エフェクト用

        // 現在値の計算
        const current = {
            blur: s.blur + (e.blur - s.blur) * easeEffect,
            sepia: s.sepia + (e.sepia - s.sepia) * easeEffect,
            saturate: s.saturate + (e.saturate - s.saturate) * easeEffect,
            zoom: s.zoom + (e.zoom - s.zoom) * easeMove,
            cx: s.cx + (e.cx - s.cx) * easeMove,
            cy: s.cy + (e.cy - s.cy) * easeMove,
            x: s.x + (e.x - s.x) * easeMove,
            y: s.y + (e.y - s.y) * easeMove,
            distort: s.distort + (e.distort - s.distort) * easeEffect,
            vignette: s.vignette + (e.vignette - s.vignette) * easeEffect,
            texture: s.texture + (e.texture - s.texture) * easeEffect,
        };

        // 第3引数に 'dom' を明示的に渡す
        applyStillStyle(dom.container, current, dom);

        if (progress < 1.0) {
            requestAnimationFrame(step);
        } else {
            // 最後も確実に dom を渡してゴール値をセット
            applyStillStyle(dom.container, endParams, dom);
        }
    }
    requestAnimationFrame(step);
}

function getHeroineIdFromHeroine(h) {
    if (!h || !h.file) return null;
    return String(h.file).split('_')[0]; 
}

function getStillEventIdFromHeroine(h) {
    currentStatus = GameStatus.EVENT;
    const p = Number(h?.progress ?? 1);
    const idx = Math.min(Math.max(p - 1, 0), 99);
    return String(Math.floor(idx)).padStart(2, '0'); 
}

function getStillSettingsFromDb(heroineId, eventId, type) {
    const db = (typeof gameAssets !== 'undefined' && gameAssets.stl_db) ? gameAssets.stl_db : {};
    const hNode = db?.[heroineId];
    const eNode = hNode?.events?.[eventId];
    const tNode = eNode?.[type];
    return tNode?.settings || null;
}

function getStillImagePath(h, type, eventId) {
    const folder = STILL_FOLDER[type] || STILL_FOLDER.normal;
    return `${STILL_BASE_PATH}/${folder}/${h.file}_${eventId}.webp`;
}

function showEventStillWithDb(layer, isH, h, type = 'normal', forceEventId = null) {
    // リセット
    layer.classList.remove('active');
    layer.style.opacity = '0';
    layer.style.transition = '';
    layer.style.filter = '';
    const bg = layer.querySelector('.layer-bg');
    const fg = layer.querySelector('.layer-focus');
    if (bg) bg.src = '';
    if (fg) fg.src = '';
    layer.style.backgroundImage = '';

    if (!isH || !h) return { enabled: false };

    const heroineId = getHeroineIdFromHeroine(h);
    const eventId = forceEventId 
        ? String(forceEventId).padStart(2, '0') 
        : getStillEventIdFromHeroine(h);

    if (!heroineId || !eventId) return { enabled: false };

    const targetSettings = getStillSettingsFromDb(heroineId, eventId, type);
    const targetParams = targetSettings
        ? targetSettings
        : { blur: 0, sepia: 0, saturate: 100, zoom: 1.0, cx: 50, cy: 50 };

    const imgPath = getStillImagePath(h, type, eventId);
    const dom = layer.__stillFxDom || ensureStillFxDom(layer);
    layer.__stillFxDom = dom;
    
    dom.imgBg.src = imgPath;
    dom.imgFocus.src = imgPath;

    // 1) イントロ設定（ぼやぼや）を適用
    const startParams = targetSettings ? STILL_INTRO_PARAMS : targetParams;
    applyStillStyle(layer, startParams);
    
    layer.classList.add('active');

    // ★変更: GameConfigの秒数を使用
    layer.style.transition = `opacity ${GameConfig.tempo.fade}ms ease`;

    // 3) フェードイン開始
    requestAnimationFrame(() => {
        layer.style.opacity = '1';
    });

    return { 
        enabled: true,
        introParams: { ...STILL_INTRO_PARAMS }, 
        targetParams, 
        hasTarget: !!targetSettings 
    };
}

function transitionStillToTarget(layer, targetParams) {
    const dom = layer.__stillFxDom;
    if (!dom) return;
    // ★変更: 演出時間もGameConfigから取得
    animateStillFx(dom, STILL_INTRO_PARAMS, targetParams, GameConfig.tempo.stillAnimDuration);
}

function fadeOutEventStill(layer) {
    if (!layer) return;
    
    if (layer._fadeTimer) {
        clearTimeout(layer._fadeTimer);
        layer._fadeTimer = null;
    }

    if (!layer.classList.contains('active')) return;
    
    // ★変更: フェードアウト時間の設定
    layer.style.transition = `opacity ${GameConfig.tempo.fade}ms ease-out`;
    
    requestAnimationFrame(() => {
        layer.style.opacity = '0';
    });
    
    // ★変更: 完了待ち時間の設定
    layer._fadeTimer = setTimeout(() => {
        layer.classList.remove('active');
        
        const bg = layer.querySelector('.layer-bg');
        const fg = layer.querySelector('.layer-focus');
        if (bg) bg.src = '';
        if (fg) fg.src = '';
        
        layer.style.backgroundImage = '';
        layer.style.filter = '';
        layer.style.transition = '';
        
        layer.innerHTML = "";
        layer.__stillFxDom = null; 
        
        layer._fadeTimer = null;
    }, GameConfig.tempo.fade);
}

function applyEventView(msg, changes, isH, h, s, out, idx, imgId, statsBefore, overflowChanges, originalChanges, isRecommended, isBoost) {
    currentStatus = GameStatus.EVENT; updateDebugUIState();
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
    
    const fullTextForLog = Array.isArray(msg) ? msg.join('') : msg;
    const logHtml = (TextEngine && typeof TextEngine.buildLogHtml === 'function')
        ? TextEngine.buildLogHtml(fullTextForLog)
        : fullTextForLog;

    currentGameLog.push(
        `<div class="log-entry"><div class="log-header">Turn ${turn} : ${locLabel} ${logL} ${outcomeHtml} ${getResultHtml(changes)}</div><div class="log-body">${formatGameText(logHtml)}</div></div>`
    );
    document.getElementById("log-content").innerHTML = currentGameLog.join(''); 
    
    const bgLayer = document.getElementById("background-layer");
    bgLayer.style.transformOrigin = `${spotAssignments[idx].l}% ${spotAssignments[idx].t}%`; 
    bgLayer.style.transform = `scale(${s.zoom || 2.5})`; 
    bgLayer.classList.add("blur-bg"); 
    
    const stillLayer = document.getElementById("event-still-layer");
    
    if (stillLayer._fadeTimer) {
        clearTimeout(stillLayer._fadeTimer);
        stillLayer._fadeTimer = null;
    }

    stillLayer.classList.remove('active', 'type-heroine', 'type-normal', 'type-hint');
    stillLayer.style.backgroundImage = '';
    stillLayer.style.setProperty('--still-offset-y', STILL_OFFSET_Y_PX + 'px');
    stillLayer.style.opacity = '';
    stillLayer.style.filter = '';
    stillLayer.style.transition = '';

    stillLayer.innerHTML = "";
    stillLayer.__stillFxDom = null;

    let stillInfo = { enabled: false };

    if (isH && h) {
        stillLayer.classList.add('type-heroine');
        stillInfo = showEventStillWithDb(stillLayer, isH, h, 'normal', imgId);
    } 
    else if (imgId) {
        stillLayer.classList.add('type-normal');
        stillLayer.innerHTML = "";
        
        stillLayer.style.backgroundImage = `url('images/bg/${s.file}_${imgId}.webp')`;
        stillLayer.style.removeProperty('--bg-img');
        
        // ★変更: ここの秒数も GameConfig.tempo.fade を使用
        stillLayer.style.transition = `opacity ${GameConfig.tempo.fade}ms ease-out, transform ${GameConfig.tempo.fade}ms cubic-bezier(0.2, 0.8, 0.2, 1), visibility ${GameConfig.tempo.fade}ms`;

        requestAnimationFrame(() => {
            stillLayer.classList.add("active");
        });
    } 
    else if (out === 'hint') {
        stillLayer.classList.add('type-hint');
        stillLayer.innerHTML = "";
        
        const assign = spotAssignments[idx];
        const mainColor = statColors[assign.main];
        const subColor = statColors[assign.sub];
        
        const progress = h.progress || 0;
        let borderColor;
        if (progress <= 1) borderColor = 'rgba(255, 255, 255, 0.8)';
        else if (progress === 2) borderColor = 'rgba(255, 220, 230, 0.8)';
        else if (progress === 3) borderColor = 'rgba(255, 180, 200, 0.8)';
        else if (progress === 4) borderColor = 'rgba(255, 140, 170, 0.8)';
        else borderColor = 'rgba(255, 100, 150, 0.9)';
        
        stillLayer.style.setProperty('--hint-border-color', borderColor);

        const gridHtml = `
            <div class="hint-grid">
                <div class="hint-cell icon-cell"><i class="fa-solid ${s.icon}"></i></div>
                <div class="hint-cell color-cell" style="background-color: ${mainColor}; color: ${mainColor};"></div>
                <div class="hint-cell color-cell" style="background-color: ${subColor}; color: ${subColor};"></div>
                <div class="hint-cell icon-cell"><i class="fa-solid ${h.icon}"></i></div>
            </div>
        `;
        
        stillLayer.innerHTML = gridHtml;
        stillLayer.style.transition = `opacity ${GameConfig.tempo.fade}ms ease-out, visibility ${GameConfig.tempo.fade}ms`;
        requestAnimationFrame(() => {
            stillLayer.classList.add("active");
        });
    }
    else {
        stillLayer.innerHTML = "";
    }
    
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
    
    document.getElementById("message-text").innerHTML = ""; 
    document.getElementById("result-display").innerHTML = ""; 
    document.getElementById("result-display").style.opacity = "0"; 
    document.getElementById("page-cursor").classList.remove("active"); 
    
    document.getElementById("message-window").classList.add("active"); 
    document.getElementById("click-overlay").classList.add("active"); 
    
    // ★変更: 待ち時間を GameConfig.tempo.eventStartDelay に変更
    setTimeout(() => {
        if (stillInfo && stillInfo.enabled) {
            transitionStillToTarget(stillLayer, stillInfo.targetParams);
        }
        proceedText();
    }, GameConfig.tempo.eventStartDelay);
}

function proceedText() {
    if (isEndingTransition) return;

    const textBox = document.getElementById("message-text");
    const cursor = document.getElementById("page-cursor");

    // 1. 演出中ならスキップ完了
    if (isTyping) {
        finishTyping();
        return;
    }
    
    // 2. 結果表示済みなら終了
    // ★修正: isClosingEvent が true なら、既に closeEvent が走っているので何もしない
    if (isResultDisplayed) {
        if (!isClosingEvent) {
            cursor.classList.remove("active"); 
            closeEvent();
        }
        return;
    }

    // 3. 次のテキスト取得
    const currentHtml = textBox.innerHTML;
    const result = TextEngine.getNext(currentHtml);

    // 終了判定
    if (result.isEnd) {
        if (isResultHidden) { 
            // 結果非表示の場合も、連打ガード
            if (!isClosingEvent) closeEvent(); 
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
    
    // 4. タイプライタ演出開始
    const formattedText = formatGameText(result.text);
    startTypeWriter(formattedText);
}

/* --- js/event.js --- */

// 遷移フラグ用変数
let isEndingTransition = false;

function closeEvent() { 
    if (isClosingEvent) return;
    if (turn >= maxTurn && isEndingTransition) return;

    isClosingEvent = true; 

    // --- STEP 1: イベント画像とUIの消去 ---
    const bgLayer = document.getElementById("background-layer");
    if (bgLayer) {
        bgLayer.style.transform = "scale(1)"; 
        bgLayer.classList.remove("blur-bg"); 
    }
    
    const stillLayer = document.getElementById("event-still-layer");
    if (stillLayer) fadeOutEventStill(stillLayer);
    
    document.getElementById("message-window").classList.remove("active"); 
    document.getElementById("click-overlay").classList.remove("active"); 
    document.getElementById("page-cursor").classList.remove("active"); 
    
    if (typeof switchToMapBgm === 'function') {
        switchToMapBgm();
    } else {
        try { if (!bgmMap.paused) bgmMap.volume = currentBgmVol; } catch (_) {}
        try { if (bgmMap.paused) bgmMap.play(); } catch (_) {}
        try { if (typeof stopHeroineBgm === 'function') stopHeroineBgm(); } catch (_) {}
    }
  
    if (turn < maxTurn) { 
        // --- 通常ターンの処理 ---
        turn++; 
        document.getElementById("turn-count").innerText = turn; 
        updateMonologue(); 
        saveSessionData(); 
        setTimeout(() => { 
             document.querySelectorAll('.map-spot').forEach(s => { 
                 s.classList.add('spot-visible'); 
                 s.querySelector('.hint-text').classList.remove('selected-yellow'); 
             }); 
             isEventActive = false; 
             currentStatus = GameStatus.MAP;
             isProcessingTurn = false; 
             isClosingEvent = false; 
             updateDebugUIState();
        }, SCENE_TRANSITION_MS + TRANSITION_BUFFER); 
    } 
    else { 
        // --- エンディング分岐 ---
        isEndingTransition = true;
        isEventActive = false; 
        saveSessionData();

        // ■ 暗転～遷移処理
        let ended = false;
        const force = () => {
            if (ended) return;
            ended = true;

            // 1. 暗転開始
            document.getElementById('fade-overlay')?.classList.add('active');
            
            // ★修正: 待ち時間を「1000ms」に延長！
            // 設定値(300ms)では短すぎて、暗転しきる前に次の画面処理が走り「いきなり表示」に見えてしまうため。
            // デバッグ機能(1500ms)の実績に近づけ、確実に真っ黒にしてから画面を切り替えます。
            setTimeout(() => {
                showEnding(); 
            }, GameConfig.tempo.endingFadeWait); 
        };

        const failSafeTimer = setTimeout(force, GameConfig.tempo.endingFailSafe);

        updateMonologue().then(() => {
            clearTimeout(failSafeTimer);

            // 読み終わるための余韻
            const readingBuffer = GameConfig.tempo.stillAnimDuration + GameConfig.tempo.transitionBuffer;
            
            setTimeout(() => {
                force(); // ここで暗転開始
            }, readingBuffer);
        }).catch((e) => {
            console.error("ending sequence failed:", e);
            force();
        });
    }
}