// =========================================
//  Main Logic (変数定義・初期化・進行管理)
// =========================================

// --- グローバル変数定義 ---
const impactConfig = {
    "オルテンシア": { targetName: "辺境の村", sec: 1, eco: 1, name: "王家の配給" },
    "エルナ": { targetName: "静謐な修道院", sec: 1, eco: 0, name: "収穫の祈り" },
    "シルフィエット": { targetName: "賢者の塔", sec: 0, eco: 0, name: "古書の寄贈" },
    "ルナリス": { targetName: "迷宮の入り口", sec: -1, eco: 1, name: "深淵の解明" },
    "マリーナ": { targetName: "六角の王都", sec: -1, eco: 1, name: "闇市場" },
    "カタリナ": { targetName: "賑わいの港町", sec: 1, eco: -1, name: "海賊狩り" },
    "エリスフェリア": { targetName: "太古の墓地", sec: 1, eco: 1, name: "精霊祭" },
    "レグリナ": { targetName: "喧騒の闘技場", sec: -1, eco: 1, name: "真夜中" },
    "ゼファー": { targetName: "緑の隠れ里", sec: 1, eco: 1, name: "異文化" },
    "メルル": { targetName: "巨岩の要塞", sec: 0, eco: 0, name: "傭兵団" },
    "ネクロア": { targetName: "忘れられた古城", sec: -1, eco: 1, name: "幻影の祝宴" },
    "エルヴィーラ": { targetName: "真鍮の荒野", sec: 1, eco: 0, name: "砂漠の花" }
};

const heroineOPLines = [
    ["王都の威光が辺境を照らす。", "王女の命により、貧しき村に物資が届けられた。", "希望の光が、人々の瞳に宿り始める。"], 
    ["賢者の叡智が、迷宮の深淵を照らす。", "封印が解かれ、冒険者たちが深層へと挑む。", "危険と隣り合わせの、富への扉が開かれた。"],
    ["辺境の実りが、修道院の食卓を満たす。", "村人たちが届けた新鮮な糧が、祈りの場を支える。", "ささやかな幸福が、静かに満ちていく。"],
    ["禁忌の知識が、塔の夜を怪しく照らす。", "古城から持ち込まれた古文書が、賢者たちを熱狂させる。", "知の交流が、新たな発見を生む。"],
    ["港の熱気が、王都の夜を彩る。", "海からの珍品が闇市場に溢れ、貴族たちを魅了する。", "欲望と金貨が、街の影で渦巻いている。"],
    ["巨岩の盾が、港の波濤を鎮める。", "要塞の騎士たちが海賊を追い払い、交易路が開かれた。", "港町はかつてない賑わいを見せている。"],
    ["修道院の祈りが、太古の魂を慰める。", "聖女の浄化により、墓地は安らぎの地へと変わった。", "今宵、死者を偲ぶ静かな祭りが始まる。"],
    ["古城の闇が、闘技場の鮮血を求める。", "吸血鬼の戯れで、夜な夜な過激な殺し合いが行われる。", "観客の熱狂は、恐怖と共に最高潮へ達する。"],
    ["荒野の情熱が、隠れ里の扉を開く。", "踊り子たちの情熱が、閉ざされたエルフの心を溶かす。", "森の奥深くで、種族を超えた宴が始まる。"],
    ["迷宮の探求者が、忘れられた城に挑む。", "亡霊の呼び声に応え、廃墟に幻の灯りがともる。", "かつての栄華が、一夜の夢として蘇る。"],
    ["闘技場の狂騒が、要塞の静寂を破る。", "猛者たちが守備隊に加わり、鉄壁の守りが築かれた。", "しかし、その荒々しさに住民は怯えている。"],
    ["深緑の息吹が、荒野に潤いをもたらす。", "エルフの秘術により、砂漠の只中に泉が湧き出した。", "不毛の大地に、奇跡の花が咲き乱れる。"]
];

const defaultRegionStats = [ { sec: 4, eco: 4 }, { sec: 5, eco: 2 }, { sec: 3, eco: 2 }, { sec: 1, eco: 1 }, { sec: 2, eco: 5 }, { sec: 2, eco: 4 }, { sec: 4, eco: 2 }, { sec: 1, eco: 2 }, { sec: 1, eco: 1 }, { sec: 3, eco: 1 }, { sec: 3, eco: 3 }, { sec: 1, eco: 3 } ];

let heroineImpacts = []; 
let isResultHidden = false;
let lastEventContext = null; 
let lastEventResult = null;
let monologueInterval;
let specialData = []; 
let monologueData = {}; 
let heroineReactions = {}; 
let clearedHeroines = [];

let stats = { health: 0, body: 0, mind: 0, magic: 0, fame: 0, money: 0 };
let turn = 1, maxTurn = 20, isEventActive = false, isGameStarted = false, isTyping = false, targetText = "";
let messageQueue = [], currentMsgIndex = 0, pendingResultHtml = "", typeInterval;
let consecutiveNormalEvents = 0, lastEventWasHeroine = false, isForcedHeroine = false, isResultDisplayed = false;
let currentGameLog = [];
let unlockedBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeImpacts = Array(12).fill(false);
const gameAssets = { events: {}, heroines: {} };

// --- 初期化処理 ---
window.onload = async () => {
    loadAudioSettings(); // ★追加: 音量設定をロード
    const statusEl = document.getElementById("load-status"); const barFill = document.getElementById("load-bar-fill");
    const assetsToLoad = []; 
    
    // イベントデータとヒロインデータのロード準備
    scenarios.forEach(s => {
        for (let i = 1; i <= 3; i++) {
            assetsToLoad.push({ type: 'event', file: `${s.file}_${i}` });
        }
    });
    heroines.forEach(h => assetsToLoad.push({ type: 'heroine', file: h.file }));
    
    let loadedCount = 0;
    const loadPromises = assetsToLoad.map(async (asset) => {
        try {
            const res = await fetch(`data/${asset.type === 'event' ? 'events' : 'heroines'}/${asset.file}.json`);
            const data = await res.json();
            if (asset.type === 'event') { 
                gameAssets.events[asset.file] = data; 
            }
            else if (asset.type === 'heroine') { 
                gameAssets.heroines[asset.file] = await fetch(`data/heroines/${asset.file}.json`).then(r => r.json()); 
            }
            loadedCount++; 
            const percent = (loadedCount / assetsToLoad.length) * 100; 
            barFill.style.width = percent + "%"; 
            statusEl.innerText = `Loading: ${asset.file} (${Math.round(percent)}%)`;
        } catch (e) { console.error(e); }
    });
    await Promise.all(loadPromises);
    
    try {
        const monoRes = await fetch('data/events/monologues.json');
        const monoJson = await monoRes.json();
        monologueData = monoJson.common;
        heroineReactions = monoJson.heroines;
        const specRes = await fetch('data/events/special.json');
        specialData = await specRes.json();
    } catch (e) { console.error("Data load failed", e); }

    heroineImpacts = heroines.map(h => {
        const conf = impactConfig[h.name];
        if (!conf) return { target: 0, sec: 0, eco: 0, name: "Unknown", btnLabel: "???" };
        const targetIdx = scenarios.findIndex(s => s.name === conf.targetName);
        return { 
            target: targetIdx !== -1 ? targetIdx : 0, 
            sec: conf.sec, eco: conf.eco, name: conf.name,
            btnLabel: `${conf.targetName} +`
        };
    });

    const savedB = localStorage.getItem('maghribal_boosts'); if(savedB) unlockedBoosts = JSON.parse(savedB);
    const savedA = localStorage.getItem('maghribal_active_boosts'); if(savedA) activeBoosts = JSON.parse(savedA);
    const savedI = localStorage.getItem('maghribal_active_impacts'); if(savedI) activeImpacts = JSON.parse(savedI);
    const savedC = localStorage.getItem('maghribal_cleared_heroines'); if(savedC) clearedHeroines = JSON.parse(savedC);
    
    initUI(); displayPastRecords(); renderBoostButtons();
    resizeGameContainer(); window.addEventListener('resize', resizeGameContainer);
    
    checkResumeData(); 
    
    // ロード完了時の演出
    setTimeout(() => { 
        const loader = document.getElementById("loading-screen");
        loader.classList.add("loaded"); 
        setTimeout(() => {
            loader.style.display = "none";
        }, 500);
    }, 800);
};

// --- セーブ・ロード・進行 ---

function checkResumeData() {
    try {
        const savedSession = localStorage.getItem('maghribal_resume_data');
        if(savedSession) {
            const btn = document.getElementById('continue-btn');
            if(btn) {
                btn.style.display = 'block'; 
            }
        }
    } catch(e) { console.error("Error checking resume data:", e); }
}

function saveSessionData() {
    if (turn > maxTurn && activeImpacts.findIndex(Boolean) === -1) return; 
    try {
        const sessionData = {
            turn: turn,
            stats: stats,
            activeImpacts: activeImpacts,
            consecutiveNormalEvents: consecutiveNormalEvents,
            lastEventWasHeroine: lastEventWasHeroine,
            heroineProgress: heroines.map(h => ({p: h.progress || 0, a: h.affection || 0})),
            gameLog: currentGameLog
        };
        localStorage.setItem('maghribal_resume_data', JSON.stringify(sessionData));
        
        const contBtn = document.getElementById("continue-btn");
        if(contBtn) contBtn.style.display = "block";
    } catch(e) {
        console.error("Save failed:", e);
    }
}

function continueGame() {
    playSE(seOp); 
    const saved = localStorage.getItem('maghribal_resume_data');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);

        turn = data.turn;
        stats = data.stats;
        activeImpacts = data.activeImpacts || Array(12).fill(false);
        consecutiveNormalEvents = data.consecutiveNormalEvents;
        lastEventWasHeroine = data.lastEventWasHeroine;
        currentGameLog = data.gameLog || [];

        if (data.heroineProgress) {
            heroines.forEach((h, i) => {
                if (data.heroineProgress[i]) {
                    h.progress = data.heroineProgress[i].p;
                    h.affection = data.heroineProgress[i].a;
                }
            });
        }

        document.getElementById("title-screen").classList.add("hidden-screen");
        document.getElementById("top-ui-container").style.display = "flex";
        document.getElementById("background-layer").classList.add("visible");
        document.querySelectorAll('.map-spot').forEach(s => s.classList.add('spot-visible'));

        statKeys.forEach(k => updateUI(k));
        document.getElementById("turn-count").innerText = turn;
        document.getElementById("log-content").innerHTML = currentGameLog.join('');
        updateMapState();

        bgmOp.pause();
        bgmMap.currentTime = 0;
        playBgmFadeIn(bgmMap);
        isGameStarted = true;
        
        updateMonologue('resume', false); 
    } catch(e) {
        console.error("Load failed:", e);
        alert("セーブデータの読み込みに失敗しました。");
    }
}

// モノローグ更新（メインループの一部）
const updateMonologue = (type = 'random', saveToLog = true) => { 
    const container = document.getElementById('monologue-container');
    const textEl = container.querySelector('.monologue-text');
    
    if (activeImpacts.findIndex(Boolean) !== -1) { container.style.display = 'none'; return; }

    let text = "";
    let pool = [];

    if (type === 'resume') { 
        text = "……さて、旅の続きを始めよう。"; 
    } else if (type === 'start') {
        pool = monologueData.start;
    } else if (lastEventContext) { 
        const { name, progress } = lastEventContext;
        const stage = Math.min(progress - 1, 5); 
        if (heroineReactions[name] && heroineReactions[name][stage]) {
            text = heroineReactions[name][stage];
        } else {
            pool = monologueData.success; 
        }
        lastEventContext = null;
    } else {
        const maxStats = statKeys.filter(k => stats[k] >= 50);
        if (maxStats.length > 0 && Math.random() < 0.3) { 
            pool = monologueData.stat_max; 
        } 
        else if (lastEventResult && Math.random() < 0.7) {
            const resKey = (lastEventResult === 'great_success' || lastEventResult === 'great') ? 'great' : lastEventResult;
            pool = monologueData[resKey] || monologueData.failure;
            lastEventResult = null;
        }
        else if (Math.random() < 0.4) { 
            const unmetHeroines = heroines.filter(h => h.progress === 0);
            if (unmetHeroines.length > 0 && Math.random() < 0.5) {
                const target = unmetHeroines[Math.floor(Math.random() * unmetHeroines.length)];
                const originalIdx = heroines.indexOf(target);
                if (originalIdx !== -1) {
                    text = `噂によると、${scenarios[originalIdx].name}の方に${target.title}がいるらしい。`;
                }
            } else {
                pool = monologueData.hint_weak;
            }
        }
        else {
            if (turn < 5) pool = monologueData.progress_low;
            else if (turn < 15) pool = monologueData.progress_mid;
            else pool = monologueData.progress_high;
        }
    }

    if (!text) {
        if (!pool || pool.length === 0) pool = monologueData.progress_mid;
        text = pool[Math.floor(Math.random() * pool.length)];
    }

    if (saveToLog) {
        currentGameLog.push(`<div class="log-entry monologue-log">（独り言）${text}</div>`);
        const logContent = document.getElementById("log-content");
        if (logContent) {
            logContent.innerHTML = currentGameLog.join('');
        }
    }

    textEl.innerHTML = "";
    container.style.display = 'flex';
    container.classList.remove('visible');
    void container.offsetWidth; 
    container.classList.add('visible');
    
    clearInterval(monologueInterval);
    let i = 0;
    monologueInterval = setInterval(() => {
        textEl.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(monologueInterval);
    }, 50);
};

// オープニング開始
function startOP() { 
    seOp.currentTime = 0; seOp.play(); 
    resizeGameContainer(); currentGameLog = []; document.getElementById("log-content").innerHTML = ""; 
    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1) { statKeys.forEach(k => { stats[k] = 0; updateUI(k); }); } else { statKeys.forEach(k => { stats[k] = activeBoosts[k] ? 10 : 0; updateUI(k); }); }
    bgmOp.pause(); bgmOp.currentTime = 0; bgmOp.play(); 
    document.getElementById("title-screen").classList.add("hidden-screen"); 
    setTimeout(() => { document.getElementById("op-screen").classList.remove("hidden-screen"); 
    const opLines = (activeIdx !== -1) ? heroineOPLines[activeIdx] : ["陽が沈む西の地、マグリバル。", "ここには名声、富、知識、そして力が眠っている。", "残された時間は、そう長くはない。", "どの道を歩み、何者となるか。", "全ては汝の選択に委ねられている。"];
    updateMapState(); 
    
    let idx = 0; const opDiv = document.getElementById("op-text"); const showLine = () => { opDiv.style.opacity = 0; setTimeout(() => { opDiv.innerHTML = opLines[idx]; opDiv.style.opacity = 1; }, 400); }; showLine(); window.nextOP = () => { idx++; if (idx < opLines.length) showLine(); else { 
        document.getElementById("op-screen").classList.add("hidden-screen"); document.getElementById("top-ui-container").style.display = "flex"; document.getElementById("background-layer").classList.add("visible"); 
        bgmOp.pause(); bgmMap.currentTime = 0; playBgmFadeIn(bgmMap);
        setTimeout(() => { 
            document.querySelectorAll('.map-spot').forEach(s => s.classList.add('spot-visible')); 
            updateMonologue('start');
            isGameStarted = true; 
        }, 1000); 
    } }; }, 500); 
}

// ブースト解放処理（ヘルパー）
function processBoostUnlock() { 
    const sortedKeys = [...statKeys].sort((a, b) => stats[b] - stats[a]); 
    for (let key of sortedKeys) { 
        if (!unlockedBoosts[key]) { 
            unlockedBoosts[key] = true; 
            localStorage.setItem('maghribal_boosts', JSON.stringify(unlockedBoosts)); 
            break; 
        } 
    } 
}

function showEnding() { 
    processBoostUnlock(); 
    if (activeImpacts.findIndex(Boolean) === -1) saveCurrentGameLog();
    
    localStorage.removeItem('maghribal_resume_data'); 

    document.getElementById("ed-screen").classList.remove("hidden-screen"); 
    bgmMap.pause(); bgmEd.currentTime = 0; bgmEd.play();
    
    const activeIdx = activeImpacts.findIndex(Boolean);
    if (activeIdx !== -1) {
        document.getElementById("ed-rank").innerText = "SPECIAL EPISODE CLEAR";
        const h1 = heroines[activeIdx];
        const tIdx = heroineImpacts[activeIdx].target;
        const scene = scenarios[tIdx];
        const h2 = heroines.find(h => h.file === scene.file) || heroines[tIdx];
        const partnerHTML = `<span style="display:flex; align-items:center; gap:8px;"><i class="fa-solid ${h1.icon}"></i> ${h1.name} <span style="font-size:0.8em; opacity:0.7;">+</span> <i class="fa-solid ${scene.icon}"></i> ${scene.name} <span style="font-size:0.8em; opacity:0.7;">+</span> <i class="fa-solid ${h2.icon}"></i> ${h2.name}</span>`;
        document.getElementById("ed-heroine").innerHTML = partnerHTML;
        document.getElementById("ed-stats").innerHTML = ""; 
    } else {
        const total = Object.values(stats).reduce((sum, v) => sum + v, 0); let rank = total >= 150 ? "LEGEND" : (total >= 100 ? "GOLD" : (total >= 50 ? "SILVER" : "BRONZE")); document.getElementById("ed-rank").innerText = `Rank: ${rank}`; let best = heroines.reduce((a, b) => a.affection > b.affection ? a : b); let endingDisplay = ""; if (best && best.affection > 0) { const hIcon = `<i class="fa-solid ${best.icon}" style="margin:0 10px;"></i>`; let affinityIcon = ""; if (best.progress >= 5) affinityIcon = `<span class="affinity-icon bouquet-icon"><i class="fa-solid fa-mound"></i></span>`; else if (best.progress >= 3) affinityIcon = `<span class="affinity-icon affinity-seedling" style="margin-left:8px;"><i class="fa-solid fa-seedling"></i></span>`; else affinityIcon = `<span class="affinity-icon affinity-leaf" style="margin-left:8px;"><i class="fa-solid fa-leaf"></i></span>`; endingDisplay = `Partner: ${hIcon} ${best.name}${affinityIcon}`; } else { const maxK = [...statKeys].sort((a, b) => stats[b] - stats[a])[0]; endingDisplay = `称号: ${soloTitles[maxK]}`; } document.getElementById("ed-heroine").innerHTML = endingDisplay; let h = ""; statKeys.forEach(k => { const val = Math.floor(stats[k]); const isMax = val >= 50; const color = statColors[k]; const borderStyle = isMax ? `border: 2px solid ${color}; box-shadow: 0 0 10px ${color};` : ""; const iconStyle = isMax ? `color: ${color};` : ""; const maxLabel = isMax ? `<span class="max-label" style="color:${color}">MAX</span>` : ""; h += `<div class="ed-stat-box" style="${borderStyle}"><i class="fa-solid ${statConfig[k].icon}" style="${iconStyle}"></i><div style="font-size:9px; color:#ccc;">${statConfig[k].name}</div><span class="ed-stat-val">${val}</span>${maxLabel}</div>`; }); document.getElementById("ed-stats").innerHTML = h; 
    }
    setTimeout(() => { document.getElementById('fade-overlay').classList.remove('active'); }, 500);
}

function retryGame() {
    playSE(seFootstep); 
    document.getElementById('fade-overlay').classList.add('active'); 
    setTimeout(() => {
        location.reload();
    }, 1500);
}