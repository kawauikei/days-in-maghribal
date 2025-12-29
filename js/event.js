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
        imgId = "05";
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
        imgId = "06";
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

    // BGM制御
    // - ヒロインイベント: マップBGM → ヒロインBGMへクロスフェード
    // - 通常イベント: ヒロインBGMが鳴っていれば止めてマップへ戻す
    if (stopBgm) {
        if (isH && h) {
            // bgmMap.pause() はしない（クロスフェード側が止める）
            playHeroineBgmByFile(h.file);
        }
    } else {
        // 何かの理由でヒロインBGMが鳴っている場合は、マップへ戻す
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
        html += `<i class="fa-solid fa-fire" style="color:#ffaa00; margin-left:8px; font-size:4px;"></i>`;
    }
    
    return html;
}

// =========================================
//  Still (スチル) 演出
// =========================================
//
// ▼ stl_db.json（新フォーマット）例
// {
//   "h01": {
//     "heroineName": "hortensia",
//     "events": {
//       "00": { "normal": { "settings": { ... } } }
//     }
//   }
// }
//
// ▼ 画像パス規則（デバッグツールに合わせる）
// images/chara/image/00_normal/h01_hortensia_00.webp
// images/chara/image/01_special/h01_hortensia_00.webp
//
// --- スチル演出用定数 ---
const STILL_BASE_PATH = 'images/chara';
const STILL_FOLDER = { normal: '00_normal', special: '01_special' };

// ★この行を追加してください
const STILL_OFFSET_Y_PX = -35; 

// 演出開始時（夢の中のようにぼやけさせる設定）
const STILL_INTRO_PARAMS = {
    blur: 20,
    sepia: 50,
    saturate: 80,
    zoom: 1.0,
    cx: 50, cy: 50,
    x: 50, y: 50, 
    vignette: 10,
    texture: 0
};

// --- スチルFX DOM（CSSは style.css に集約） ---
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

function applyStillFx(dom, params) {
    const p = normalizeStillParams(params || {});
    const c = dom.container;

    const num = (v, d=0) => (Number.isFinite(v) ? v : d);

    c.style.setProperty('--x', num(p.x,50).toFixed(1) + '%');
    c.style.setProperty('--y', num(p.y,50).toFixed(1) + '%');
    c.style.setProperty('--blur', num(p.blur,0) + 'px');
    c.style.setProperty('--sepia', num(p.sepia,0) + '%');
    c.style.setProperty('--saturate', num(p.saturate,100) + '%');
    c.style.setProperty('--texture', (num(p.texture,0) / 100).toFixed(3));
    c.style.setProperty('--vignette', (num(p.vignette,0) / 100).toFixed(3));
    c.style.setProperty('--size', num(p.size,15) + '%');

    c.style.setProperty('--zoom', num(p.zoom,1).toFixed(3));
    c.style.setProperty('--cx', num(p.cx,50).toFixed(1) + '%');
    c.style.setProperty('--cy', num(p.cy,50).toFixed(1) + '%');

    if (dom.svgScale) dom.svgScale.setAttribute('scale', String(num(p.distort,0)));
}

// intro → target を“すぅっと”変化させるための補間（SVGのdistort(scale)も含めてアニメ）
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }

/* --- js/event.js : animateStillFx (修正版・イージング分離) --- */

function animateStillFx(dom, startParams, endParams, duration) {
    const start = performance.now();
    const s = normalizeStillParams(startParams);
    const e = normalizeStillParams(endParams);

    function step(now) {
        const elapsed = now - start;
        let progress = Math.min(elapsed / duration, 1.0);

        // 時間 t (0.0 -> 1.0)
        const t = progress;

        // ★重要: 2種類のカーブを使い分ける

        // 1. 移動用 (Ease Out Cubic): 最初が速く、ターゲット付近でゆっくり停止
        // 「カメラワーク」として自然な動き
        const easeMove = 1 - Math.pow(1 - t, 3);

        // 2. エフェクト解除用 (Ease In Cubic): 最初は変化が遅く、後半に加速
        // 「最初はぼやけたまま」→「最後にスッとピントが合う」動き
        // ※ t*t (Quad) だと少し早すぎるので、t*t*t (Cubic) でしっかり粘ります
        const easeEffect = Math.pow(t, 3); 

        // 現在値の計算
        const current = {
            // --- エフェクト系 (easeEffect: 後半に晴らす) ---
            // これにより、移動中はまだぼやけていて、到着してからクリアになります
            blur: s.blur + (e.blur - s.blur) * easeEffect,
            sepia: s.sepia + (e.sepia - s.sepia) * easeEffect,
            saturate: s.saturate + (e.saturate - s.saturate) * easeEffect,
            vignette: s.vignette + (e.vignette - s.vignette) * easeEffect,
            texture: s.texture + (e.texture - s.texture) * easeEffect,
            distort: s.distort + (e.distort - s.distort) * easeEffect,

            // --- 移動・ズーム系 (easeMove: 先に動かす) ---
            zoom: s.zoom + (e.zoom - s.zoom) * easeMove,
            cx: s.cx + (e.cx - s.cx) * easeMove,
            cy: s.cy + (e.cy - s.cy) * easeMove,
            x: s.x + (e.x - s.x) * easeMove,
            y: s.y + (e.y - s.y) * easeMove,
        };

        // 画面に適用
        applyStillStyle(dom.container || dom.imgBg.parentElement, current);

        if (progress < 1.0) {
            requestAnimationFrame(step);
        } else {
            // 最後に確実にゴール値をセット
            applyStillStyle(dom.container || dom.imgBg.parentElement, endParams);
        }
    }

    requestAnimationFrame(step);
}



function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

function normalizeStillParams(p) {
    const src = p || {};
    return {
        blur: clamp(Number(src.blur ?? 0), 0, 40),
        sepia: clamp(Number(src.sepia ?? 0), 0, 100),
        saturate: clamp(Number(src.saturate ?? 100), 0, 300),
        zoom: clamp(Number(src.zoom ?? 1.0), 1.0, 3.0),
        cx: clamp(Number(src.cx ?? 50), 0, 100),
        cy: clamp(Number(src.cy ?? 50), 0, 100)
    };
}

function applyStillStyle(layer, params) {
    if (!layer) return;
    const p = normalizeStillParams(params);
    const dom = layer.__stillFxDom; 
    
    // CSS変数のセット
    layer.style.setProperty('--x', p.x + '%');
    layer.style.setProperty('--y', p.y + '%');
    layer.style.setProperty('--cx', p.cx + '%');
    layer.style.setProperty('--cy', p.cy + '%');
    layer.style.setProperty('--zoom', p.zoom);
    
    // ★ここが修正ポイント
    // デバッグツール(stl.html)と同じ順序にします:
    // 1. 歪み(url) → 2. ぼかし(blur) → 3. 色調(sepia/saturate)
    
    let filterStr = "";

    // 1. まず歪み (Distort) を先に記述
    if (p.distort > 0) {
        filterStr += `url(#oil-paint-filter) `;
        // SVG側の scale 値も更新
        if (dom.svgScale) {
            dom.svgScale.setAttribute('scale', String(p.distort));
        }
    }

    // 2. その後に色彩・ぼかし効果を追加
    filterStr += `blur(${p.blur}px) sepia(${p.sepia}%) saturate(${p.saturate}%)`;

    // 背景画像レイヤーに適用
    if (dom && dom.imgBg) {
        dom.imgBg.style.filter = filterStr;
        
        // 拡大・移動
        dom.imgBg.style.transformOrigin = `${p.cx}% ${p.cy}%`;
        dom.imgBg.style.transform = `scale(${p.zoom})`;
    }
    
    // フォーカスレイヤー
    if (dom && dom.imgFocus) {
         dom.imgFocus.style.transformOrigin = `${p.cx}% ${p.cy}%`;
         dom.imgFocus.style.transform = `scale(${p.zoom})`;
    }
}

function getHeroineIdFromHeroine(h) {
    // h.file: "h01_hortensia"
    if (!h || !h.file) return null;
    return String(h.file).split('_')[0]; // "h01"
}

function getStillEventIdFromHeroine(h) {
    // 仕様:
    // - ヒロイン本編成功時、h.progress は applyEventView 呼び出し前にインクリメントされるため、
    //   “いま再生したイベント”は (progress-1) を使う
    // - それ以外の分岐でも破綻しにくいようにクランプ
    const p = Number(h?.progress ?? 1);
    const idx = clamp(p - 1, 0, 99);
    return String(Math.floor(idx)).padStart(2, '0'); // "00"
}

function getStillSettingsFromDb(heroineId, eventId, type) {
    const db = (typeof gameAssets !== 'undefined' && gameAssets.stl_db) ? gameAssets.stl_db : {};
    const hNode = db?.[heroineId];
    const eNode = hNode?.events?.[eventId];
    const tNode = eNode?.[type];
    const s = tNode?.settings;
    return s || null;
}

function getStillImagePath(h, type, eventId) {
    const folder = STILL_FOLDER[type] || STILL_FOLDER.normal;
    return `${STILL_BASE_PATH}/${folder}/${h.file}_${eventId}.webp`;
}

/* --- js/event.js : showEventStillWithDb (定義ごと上書き) --- */

/* --- js/event.js : showEventStillWithDb (修正版) --- */

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

    // 2) コンテナ自体のフェードイン設定 (中身のアニメーションは干渉させない)
    // ここはシンプルに「不透明度」だけでOKです
    layer.style.transition = 'opacity 600ms ease';

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

/* --- js/event.js : transitionStillToTarget (修正版) --- */

function transitionStillToTarget(layer, targetParams) {
    const dom = layer.__stillFxDom;
    if (!dom) return;

    // 現在の状態（イントロ設定）から、ターゲット（DB設定）へ
    // JSのループで数値を動かすことで、視点移動とエフェクト解除を「完全に」同期させます
    // durationMs: 1500 (1.5秒かけてゆっくり合わせる)
    animateStillFx(dom, STILL_INTRO_PARAMS, targetParams, 1500);
}

/* --- js/event.js : fadeOutEventStill 関数 (修正版) --- */

function fadeOutEventStill(layer) {
    if (!layer) return;
    
    // 既存タイマーのキャンセル
    if (layer._fadeTimer) {
        clearTimeout(layer._fadeTimer);
        layer._fadeTimer = null;
    }

    if (!layer.classList.contains('active')) return;
    
    // ★追加: フェードアウトの時間をここで「0.6s」に統一・強制する
    // これにより、ヒロイン演出(350ms)や通常演出(600ms)のバラつきをなくし、
    // 常に「ゆっくり消える」挙動にします。
    layer.style.transition = 'opacity 0.6s ease-out';
    
    // フェードアウト開始
    requestAnimationFrame(() => {
        layer.style.opacity = '0';
    });
    
    // ★修正: タイマー時間を 380ms -> 600ms に変更
    // アニメーション(0.6s)が完全に終わってから片付けを行います。
    layer._fadeTimer = setTimeout(() => {
        layer.classList.remove('active');
        
        const bg = layer.querySelector('.layer-bg');
        const fg = layer.querySelector('.layer-focus');
        if (bg) bg.src = '';
        if (fg) fg.src = '';
        
        layer.style.backgroundImage = '';
        layer.style.filter = '';
        layer.style.transition = '';
        
        // 中身も空にする
        layer.innerHTML = "";
        layer.__stillFxDom = null; // キャッシュもクリア
        
        layer._fadeTimer = null;
    }, 600); // <- ここをアニメーション時間と合わせる
}

/* --- js/event.js : applyEventView 関数 (修正版) --- */

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
    const fullTextForLog = Array.isArray(msg) ? msg.join('') : msg;
    const logHtml = (TextEngine && typeof TextEngine.buildLogHtml === 'function')
        ? TextEngine.buildLogHtml(fullTextForLog)
        : fullTextForLog;

    currentGameLog.push(
        `<div class="log-entry"><div class="log-header">Turn ${turn} : ${locLabel} ${logL} ${outcomeHtml} ${getResultHtml(changes)}</div><div class="log-body">${formatGameText(logHtml)}</div></div>`
    );
    document.getElementById("log-content").innerHTML = currentGameLog.join(''); 
    
    // 背景演出
    const bgLayer = document.getElementById("background-layer");
    bgLayer.style.transformOrigin = `${spotAssignments[idx].l}% ${spotAssignments[idx].t}%`; 
    bgLayer.style.transform = `scale(${s.zoom || 2.5})`; 
    bgLayer.classList.add("blur-bg"); 
    
    // ▼▼▼ イベントスチル表示 (修正箇所) ▼▼▼
    const stillLayer = document.getElementById("event-still-layer");
    
    // 前のイベントのフェードアウト処理が待機中なら強制キャンセル
    if (stillLayer._fadeTimer) {
        clearTimeout(stillLayer._fadeTimer);
        stillLayer._fadeTimer = null;
    }

    // 1. 初期化: クラスとスタイルをリセット
    stillLayer.classList.remove('active', 'type-heroine', 'type-normal', 'type-hint');
    stillLayer.style.backgroundImage = '';
    stillLayer.style.setProperty('--still-offset-y', STILL_OFFSET_Y_PX + 'px');
    stillLayer.style.opacity = '';
    stillLayer.style.filter = '';
    stillLayer.style.transition = '';

    // 中身を空にする
    stillLayer.innerHTML = "";
    
    // ★追加: DOM参照キャッシュも忘れずにクリアする！
    // これをしないと、2回目以降に「削除済みのDOM」を操作してしまい、画面が真っ暗になります。
    stillLayer.__stillFxDom = null;

    let stillInfo = { enabled: false };

    // --- 以降のロジックは変更なし ---
    if (isH && h) {
        // ヒロインイベント (後日談/世間話対応)
        stillLayer.classList.add('type-heroine');
        stillInfo = showEventStillWithDb(stillLayer, isH, h, 'normal', imgId);
    } 
    else if (imgId) {
        // 通常イベント (絵画風演出)
        stillLayer.classList.add('type-normal');
        stillLayer.innerHTML = "";
        
        // 直接スタイルにセット
        stillLayer.style.backgroundImage = `url('images/bg/${s.file}_${imgId}.webp')`;
        stillLayer.style.removeProperty('--bg-img');
        
        stillLayer.style.transition = 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.6s';

        requestAnimationFrame(() => {
            stillLayer.classList.add("active");
        });
    } 
    else if (out === 'hint') {
        // ヒント演出 (枠線色変化あり)
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
        stillLayer.style.transition = 'opacity 0.6s ease-out, visibility 0.6s';
        requestAnimationFrame(() => {
            stillLayer.classList.add("active");
        });
    }
    else {
        // 画像なし
        stillLayer.innerHTML = "";
    }
    
    // TextEngine 初期化
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
    
    setTimeout(() => {
        if (stillInfo && stillInfo.enabled) {
            transitionStillToTarget(stillLayer, stillInfo.targetParams);
        }
        proceedText();
    }, 300);
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
    // スチルはフェードアウトしてから非表示にする
    fadeOutEventStill(document.getElementById("event-still-layer"));
    
    document.getElementById("message-window").classList.remove("active"); 
    document.getElementById("click-overlay").classList.remove("active"); 
    document.getElementById("page-cursor").classList.remove("active"); 
    
    // マップに戻ったら必ず「ヒロインBGM → マップBGM」へ戻す
    // （通常イベントでも、何らかの理由でヒロインBGMが鳴りっぱなしになるのを防ぐ）
    if (typeof switchToMapBgm === 'function') {
        switchToMapBgm();
    } else {
        // フォールバック
        try { if (!bgmMap.paused) bgmMap.volume = currentBgmVol; } catch (_) {}
        try { if (bgmMap.paused) bgmMap.play(); } catch (_) {}
        try { if (typeof stopHeroineBgm === 'function') stopHeroineBgm(); } catch (_) {}
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

/* --- js/event.js : スチル同期アニメーション用関数群 --- */

// 1. パラメータの正規化（undefined対策）
function normalizeStillParams(p) {
    return {
        x: p.x ?? 50, y: p.y ?? 50,
        distort: p.distort ?? 0,
        blur: p.blur ?? 0,
        size: p.size ?? 15,
        vignette: p.vignette ?? 0,
        sepia: p.sepia ?? 0,
        saturate: p.saturate ?? 100,
        texture: p.texture ?? 0,
        zoom: p.zoom ?? 1.0,
        cx: p.cx ?? 50, cy: p.cy ?? 50
    };
}

/* --- js/event.js 修正箇所 --- */

// 2. スタイル適用（修正：第3引数でDOMを直接受け取れるようにする）
function applyStillStyle(layer, params, forceDom = null) {
    if (!layer) return;
    const p = normalizeStillParams(params);
    
    // 引数で渡されたらそれを使い、なければlayerから探す
    const dom = forceDom || layer.__stillFxDom; 
    
    // CSS変数をセット（これはこれで保険として残す）
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

    // ★重要: インラインスタイルを確実に更新して、初期状態のstyle固定を上書きする
    const filterStr = `blur(${p.blur}px) sepia(${p.sepia}%) saturate(${p.saturate}%)`;
    
    if (dom && dom.imgBg) {
        dom.imgBg.style.filter = filterStr;
        // 歪みエフェクト
        if (p.distort > 0) {
             dom.imgBg.style.filter += ` url(#oil-paint-filter)`;
             if (dom.svgScale) {
                 dom.svgScale.setAttribute('scale', String(p.distort));
             }
        } else {
             if (dom.svgScale) {
                 dom.svgScale.setAttribute('scale', "0");
             }
        }
        
        // ★ここが動かなかった原因の修正点
        // domが正しく渡っていれば、このインラインスタイル更新が走り、アニメーションする
        dom.imgBg.style.transformOrigin = `${p.cx}% ${p.cy}%`;
        dom.imgBg.style.transform = `scale(${p.zoom})`;
    }
    
    if (dom && dom.imgFocus) {
         dom.imgFocus.style.transformOrigin = `${p.cx}% ${p.cy}%`;
         dom.imgFocus.style.transform = `scale(${p.zoom})`;
    }
}

// 3. アニメーション実行関数（修正：applyStillStyleにdomを渡す）
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

        // ★修正: 第3引数に 'dom' を明示的に渡す
        // これにより applyStillStyle 内で dom.imgBg が参照可能になり、styleが更新される
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