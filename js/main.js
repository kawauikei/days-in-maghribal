// =========================================
//  Main Logic (変数定義・初期化・進行管理)
// =========================================

// ★ GameStatusを5段階に拡張 (ロジック追加)
const GameStatus = {
    TITLE: 'title',
    OP: 'opening',
    MAP: 'map',
    EVENT: 'event',
    ENDING: 'ending'
};

let currentStatus = GameStatus.TITLE; // 初期値

// --- グローバル変数定義 ---
const impactConfig = {
    "オルテンシア":   { targetIdx: 2,  sec: 1,  eco: 1,  name: "王家の配給" }, // 辺境の村
    "エルナ":         { targetIdx: 6,  sec: 1,  eco: 0,  name: "収穫の祈り" }, // 静謐な修道院
    "シルフィエット": { targetIdx: 1,  sec: 0,  eco: 0,  name: "古書の寄贈" }, // 賢者の塔
    "ルナリス":       { targetIdx: 7,  sec: -1, eco: 1,  name: "深淵の解明" }, // 迷宮の入り口
    "マリーナ":       { targetIdx: 0,  sec: -1, eco: 1,  name: "闇市場" },    // 六角の王都
    "カタリナ":       { targetIdx: 4,  sec: 1,  eco: -1, name: "海賊狩り" },  // 賑わいの港町
    "エリスフェリア": { targetIdx: 9,  sec: 1,  eco: 1,  name: "精霊祭" },    // 太古の墓地
    "レグリナ":       { targetIdx: 10, sec: -1, eco: 1,  name: "真夜中" },    // 喧騒の闘技場
    "ゼファー":       { targetIdx: 11, sec: 1,  eco: 1,  name: "異文化" },    // 緑の隠れ里
    "メルル":         { targetIdx: 5,  sec: 0,  eco: 0,  name: "傭兵団" },    // 巨岩の要塞
    "ネクロア":       { targetIdx: 3,  sec: -1, eco: 1,  name: "幻影の祝宴" }, // 忘れられた古城
    "エルヴィーラ":   { targetIdx: 8,  sec: 1,  eco: 0,  name: "砂漠の花" }    // 真鍮の荒野
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

let isMotivationBuff = false; 
let stats = { health: 5, body: 5, mind: 5, magic: 5, fame: 5, money: 5 };
let turn = 1, maxTurn = 20, isEventActive = false, isGameStarted = false, isTyping = false, targetText = "";
let messageQueue = [], currentMsgIndex = 0, pendingResultHtml = "", typeInterval;
let consecutiveNormalEvents = 0, lastEventWasHeroine = false, isForcedHeroine = false, isResultDisplayed = false;
let isProcessingTurn = false;
let currentGameLog = [];
let unlockedBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeImpacts = Array(12).fill(false);
const gameAssets = { events: {}, heroines: {}, bgm_heroine: {}, stl_db: {} };

// --- 初期化処理 ---
window.onload = async () => {
    loadAudioSettings(); 
    const statusEl = document.getElementById("load-status"); 
    const barFill = document.getElementById("load-bar-fill");
    
    // 読み込むアセットのリスト作成
    const assetsToLoad = []; 
    
    scenarios.forEach(s => {
        for (let i = 1; i <= 3; i++) {
            assetsToLoad.push({ type: 'event', file: `${s.file}_${i}` });
        }
    });
    heroines.forEach(h => assetsToLoad.push({ type: 'heroine', file: h.file }));
    heroines.forEach(h => assetsToLoad.push({ type: 'bgm_heroine', file: h.file, path: `bgm/${h.file}.mp3` }));
    
    scenarios.forEach(s => {
        for (let i = 1; i <= 3; i++) {
            const numStr = String(i).padStart(2, '0');
            const path = `images/bg/${s.file}_${numStr}.webp`;
            assetsToLoad.push({ type: 'image', path: path });
        }
    });

    heroines.forEach(h => {
        for (let i = 0; i <= 6; i++) {
            const numStr = String(i).padStart(2, '0');
            const path = `images/chara/00_normal/${h.file}_${numStr}.webp`;
            assetsToLoad.push({ type: 'image', path: path });
        }
    });
    
    let loadedCount = 0;
    
    const loadPromises = assetsToLoad.map(async (asset) => {
        try {
            if (asset.type === 'image') {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.src = asset.path;
                    img.onload = resolve;
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${asset.path}`);
                        resolve();
                    };
                });
            } 
            else if (asset.type === 'event') { 
                const res = await fetch(`data/events/${asset.file}.json`);
                const data = await res.json();
                gameAssets.events[asset.file] = data; 
            }
            else if (asset.type === 'heroine') {
                const res = await fetch(`data/heroines/${asset.file}.json`);
                gameAssets.heroines[asset.file] = await res.json();
            }
            else if (asset.type === 'bgm_heroine') {
                await new Promise((resolve) => {
                    const audio = new Audio(asset.path);
                    audio.loop = true;
                    const done = () => resolve();
                    audio.addEventListener('canplaythrough', done, { once: true });
                    audio.addEventListener('loadeddata', done, { once: true });
                    audio.addEventListener('error', () => {
                        console.warn(`Failed to load BGM: ${asset.path}`);
                        resolve();
                    }, { once: true });
                    audio.load();
                    gameAssets.bgm_heroine[asset.file] = audio;
                });
            }
            
            loadedCount++; 
            const percent = (loadedCount / assetsToLoad.length) * 100; 
            barFill.style.width = percent + "%"; 
            const dispName = asset.path ? asset.path.split('/').pop() : asset.file;
            statusEl.innerText = `Loading: ${dispName} (${Math.round(percent)}%)`;
            
        } catch (e) { 
            console.error(`Load Error (${asset.type}):`, e); 
        }
    });

    await Promise.all(loadPromises);
    // --- データロード（モノローグ等） ---
    try {
        const monoRes = await fetch('data/events/monologues.json');
        const monoJson = await monoRes.json();
        monologueData = monoJson.common;
        heroineReactions = monoJson.heroines;
        const specRes = await fetch('data/events/special.json');
        specialData = await specRes.json();
        // スチル設定DB（存在しない場合もあるので、失敗しても止めない）
        try {
            const stlRes = await fetch('data/heroines/stl_db.json');
            if (stlRes.ok) {
                gameAssets.stl_db = await stlRes.json();
            } else {
                gameAssets.stl_db = {};
                console.warn('stl_db.json not found (ok for now).');
            }
        } catch (e) {
            gameAssets.stl_db = {};
            console.warn('Failed to load stl_db.json (ok for now).', e);
        }
    } catch (e) { console.error("Data load failed", e); }

    // --- インパクト・設定データの復元 ---
    heroineImpacts = heroines.map(h => {
        const config = impactConfig[h.name];
        
        if (config) {
            // ID(番号)からシナリオデータを取得して、現在の名前を参照する
            const targetScenario = scenarios[config.targetIdx];
            const currentMapName = targetScenario ? targetScenario.name : "不明な地域";

            return { 
                target: config.targetIdx, // 番号を直接使用
                sec: config.sec, 
                eco: config.eco, 
                name: config.name,
                // 最新の地名を使ってボタンのラベルを生成
                btnLabel: `${currentMapName} +`
            };
        } else {
            // 設定が見つからない場合の予備処理
            return { target: 0, sec: 0, eco: 0, name: "Unknown", btnLabel: "???" };
        }
    });

    syncPersistentUnlocksFromStorage();
    initUI(); displayPastRecords(); renderBoostButtons();

const clickOverlay = document.getElementById("click-overlay");
    if (clickOverlay) {
        clickOverlay.onclick = function() {
            // ★修正: ステータスも厳密にチェック
            if (isEventActive || currentStatus === GameStatus.EVENT) {
                
                // 処理中（連打）なら無視して終了
                if (isProcessingTurn) return;

                // 結果画面（イベント終了時）ならロックをかける
                if (isResultDisplayed) {
                    isProcessingTurn = true;
                    // 0.6秒後にロック解除
                    setTimeout(() => { isProcessingTurn = false; }, 600);
                }

                // 正しい（event.js側の）proceedTextを呼ぶ
                if (typeof proceedText === 'function') {
                    proceedText();
                }
            }
        };
    }

    resizeGameContainer(); window.addEventListener('resize', resizeGameContainer);
    
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resizeGameContainer);
        window.visualViewport.addEventListener('scroll', resizeGameContainer);
    }
    checkResumeData(); 
    
    // ロード完了時の演出
    setTimeout(() => { 
        const loader = document.getElementById("loading-screen");
        loader.classList.add("loaded"); 
        setTimeout(() => {
            loader.style.display = "none";
        }, 500);
    }, 800);
    currentStatus = GameStatus.TITLE;
    updateDebugUIState();
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
        
        // ★状態を「MAP」に更新
        currentStatus = GameStatus.MAP; updateDebugUIState();
        
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
    
    let text = "";
    let pool = [];

    if (type === 'resume') { 
        text = "……さて、旅の続きを始めよう。"; 
    } else if (type === 'start') {
        pool = monologueData.start;
    } else if (lastEventContext) { 
        const { name, progress } = lastEventContext;
        
        let targetIndex = 0;
        if (progress === 7) {
            targetIndex = 6; // 世間話用モノローグ
        } else if (progress === 6) {
            targetIndex = 5; // 後日談用モノローグ
        } else {
            targetIndex = Math.min(progress - 1, 4); // 通常イベント(1-5回目)
        }

        if (heroineReactions[name] && heroineReactions[name][targetIndex]) {
            text = heroineReactions[name][targetIndex];
        } else {
            pool = monologueData.success;
        }
        lastEventContext = null;
    } else {
        // 汎用モノローグの抽選
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
        if (!pool || pool.length === 0) {
            pool = monologueData.progress_mid;
        }
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
/**
 * ゲーム本編を開始する（タイトルボタンから呼び出し）
 */
function startOP() { 
    // ★状態を「OP」に更新
    currentStatus = GameStatus.OP; updateDebugUIState();
    
    seOp.currentTime = 0; seOp.play(); 
    resizeGameContainer(); 
    currentGameLog = []; 
    document.getElementById("log-content").innerHTML = ""; 
    
    statKeys.forEach(k => { 
        // 初期値計算 (Boost適用なら18、そうでなければ3)
        stats[k] = activeBoosts[k] ? 18 : 3; 
        updateUI(k); 
    });
    
    bgmOp.pause(); bgmOp.currentTime = 0; bgmOp.play(); 
    document.getElementById("title-screen").classList.add("hidden-screen"); 
    
    setTimeout(() => { 
        document.getElementById("op-screen").classList.remove("hidden-screen"); 

        const opLines = [
            "陽が沈む西の地、マグリバル。", 
            "ここには名声、富、知識、そして力が眠っている。", 
            "残された時間は、そう長くはない。", 
            "どの道を歩み、何者となるか。", 
            "全ては汝の選択に委ねられている。"
        ];
        
        updateMapState(); 
        
        let idx = 0; 
        const opDiv = document.getElementById("op-text"); 
        opDiv.innerHTML = "";
        
        const showLine = () => { 
            opDiv.style.opacity = 0; 
            setTimeout(() => { 
                opDiv.innerHTML = opLines[idx]; 
                opDiv.style.opacity = 1; 
            }, 400); 
        }; 
        
        showLine(); 
        
        // オープニング進行（クリックイベント）
        window.nextOP = () => { 
            idx++; 
            if (idx < opLines.length) {
                showLine(); 
            } else { 
                document.getElementById("op-screen").classList.add("hidden-screen"); 
                document.getElementById("top-ui-container").style.display = "flex"; 
                document.getElementById("background-layer").classList.add("visible"); 
                
                bgmOp.pause(); 
                bgmMap.currentTime = 0; 
                playBgmFadeIn(bgmMap);
                
                setTimeout(() => { 
                    // ★状態を「MAP」に更新
                    currentStatus = GameStatus.MAP;updateDebugUIState();
                    
                    document.querySelectorAll('.map-spot').forEach(s => s.classList.add('spot-visible')); 
                    updateMonologue('start');
                    isGameStarted = true; 
                }, 1000); 
            } 
        }; 
    }, 500); 
}

/**
 * 永続的なブースト要素の解放
 * @returns {string|null} 解放されたステータスのキー
 */
function processBoostUnlock() { 
    const sortedKeys = [...statKeys].sort((a, b) => stats[b] - stats[a]); 
    for (let key of sortedKeys) { 
        if (!unlockedBoosts[key]) { 
            unlockedBoosts[key] = true; 
            localStorage.setItem('maghribal_boosts', JSON.stringify(unlockedBoosts)); 
            return key; // ★実際に解放したキーを返す
        } 
    } 
    return null; // すべて解放済みの場合はnull
}

/**
 * ゲームのエンディング処理を実行する
 * 修正：新規解放があった場合のみアナウンスを表示するロジックに変更
 */
function showEnding() {
    if (currentStatus === GameStatus.TITLE || currentStatus === GameStatus.ENDING) return;
    currentStatus = GameStatus.ENDING;
    updateDebugUIState();

    const total = Object.values(stats).reduce((sum, v) => sum + v, 0);
    const rank = total >= 150 ? "LEGEND" : (total >= 100 ? "GOLD" : (total >= 50 ? "SILVER" : "BRONZE"));
    
    // 1. ステータス解放処理：新規解放があればキーが返る（なければ null）
    const newlyUnlockedStatKey = processBoostUnlock(); 

    // 2. ヒロインの特定 (同値の場合は先頭優先)
    let best = heroines.reduce((prev, current) => (prev.affection >= current.affection) ? prev : current);
    if (!best || best.affection === 0) {
        best = heroines[Math.floor(Math.random() * heroines.length)];
    }
    const bestHeroine = best; 

    // 3. エリア解放処理：今回初めて解放されたかどうかを判定
    let isNewAreaUnlocked = false;
    if (bestHeroine && !clearedHeroines.includes(bestHeroine.name)) {
        clearedHeroines.push(bestHeroine.name);
        localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
        isNewAreaUnlocked = true; // ★新規解放フラグON
        console.log(`[Unlock] Best Heroine: ${bestHeroine.name}`);
    }

    saveCurrentGameLog();
    localStorage.removeItem('maghribal_resume_data');

    document.getElementById("ed-screen").classList.remove("hidden-screen");
    document.getElementById("ed-rank").innerText = `Rank: ${rank}`;

    try {
        if (typeof stopHeroineBgm === 'function') stopHeroineBgm();
        fadeOutBgm(bgmMap, 300, true);
        fadeOutBgm(bgmOp, 300, true);
    } catch(e) {}
    bgmEd.currentTime = 0; bgmEd.play();
    
    // 4. 表示テキスト作成
    let endingDisplay = "";
    let finalMessage = "";
    if (bestHeroine) {
        const hIcon = `<i class="fa-solid ${bestHeroine.icon}" style="margin:0 10px;"></i>`;
        const msgIdx = bestHeroine.affection > 0 ? (bestHeroine.progress || 0) : 0;
        finalMessage = bestHeroine.finMsg[msgIdx] || bestHeroine.finMsg[0];
        
        if (bestHeroine.affection > 0) {
            let affinityIcon = (bestHeroine.progress >= 5) ? `<span class="affinity-icon bouquet-icon"><i class="fa-solid fa-mound"></i></span>` : 
                               (bestHeroine.progress >= 3) ? `<span class="affinity-icon affinity-seedling" style="margin-left:8px;"><i class="fa-solid fa-seedling"></i></span>` : 
                                                           `<span class="affinity-icon affinity-leaf" style="margin-left:8px;"><i class="fa-solid fa-leaf"></i></span>`;
            endingDisplay = `Partner: ${hIcon} ${bestHeroine.name}${affinityIcon}`;
        } else {
            const maxK = statKeys.reduce((a, b) => stats[a] >= stats[b] ? a : b, statKeys[0]);
            endingDisplay = `称号: ${soloTitles[maxK]}`;
        }
    }
    document.getElementById("ed-heroine").innerHTML = endingDisplay;

    // 5. 解放アナウンスHTMLの作成（新規解放がある場合のみ生成）
    let unlockHtml = "";
    
    // ステータスまたはエリアのどちらかが新規解放された場合のみ中身を作る
    if (newlyUnlockedStatKey || isNewAreaUnlocked) {
        
        // --- スタイル定義（前回と同じ安全版） ---
        const ocherColor = "#e6c15c";
        const cyanColor = statColors.average;
        // マージン調整済みコンテナ
        const containerStyle = `max-width: 650px; margin: 0 auto; border: 1px solid ${cyanColor}; padding: 10px 20px; border-radius: 4px; background: rgba(0, 255, 255, 0.05); display: inline-block; text-align: left; color: #fff;`;
        const itemStyle = `font-size: 0.9em; margin: 5px 0; letter-spacing: 0.05em; display: flex; align-items: center; gap: 10px;`;
        const iconW = `width: 24px; text-align: center;`; 
        const nameWidthStyle = `display: inline-block; width: 160px; text-align: left;`;
        const prefixStyle = `display: flex; align-items: center; gap: 6px; margin-right: 5px;`;

        // 内部コンテンツ（行）の蓄積
        let rowsHtml = "";

        // A. ステータス新規解放
        if (newlyUnlockedStatKey) {
            rowsHtml += `
                <div style="${itemStyle}">
                    <span style="${prefixStyle}">
                        <i class="fa-solid fa-lock-open" style="${iconW} color: ${ocherColor};"></i>
                        <span style="color: ${cyanColor};">【解放】</span>
                    </span>
                    <i class="fa-solid ${statConfig[newlyUnlockedStatKey].icon}" style="${iconW} color:${statColors[newlyUnlockedStatKey]};"></i>
                    <span style="${nameWidthStyle}">${statConfig[newlyUnlockedStatKey].name} +15</span>
                    <span>：初期値ブースト可能</span>
                </div>`;
        }

        // B. エリア新規解放
        if (isNewAreaUnlocked) {
            // bestHeroine は必ず存在しているはずだが念のためチェック
            const hIdx = heroines.indexOf(bestHeroine);
            if (hIdx !== -1) {
                const targetScene = scenarios[heroineImpacts[hIdx].target];
                rowsHtml += `
                    <div style="${itemStyle}">
                        <span style="${prefixStyle}">
                            <i class="fa-solid fa-lock-open" style="${iconW} color: ${ocherColor};"></i>
                            <span style="color: ${cyanColor};">【解放】</span>
                        </span>
                        <i class="fa-solid ${targetScene.icon}" style="${iconW}"></i>
                        <span style="${nameWidthStyle}">${heroineImpacts[hIdx].btnLabel}</span>
                        <span>：対象エリアブースト可能</span>
                    </div>`;
            }
        }

        // 中身がある場合のみ、ラッパーと枠で囲む
        if (rowsHtml !== "") {
            unlockHtml = `<div style="flex: 0 0 100%; width: 100%; margin: 10px 0; text-align: center; font-family: serif;">
                            <div style="${containerStyle}">${rowsHtml}</div>
                          </div>`;
        }
    }

    // 6. 画面への流し込み
    const statsContainer = document.getElementById("ed-stats");
    const msgHTML = `<div style="flex: 0 0 100%; width: 100%; text-align: center; margin: 10px 0 15px; font-style: italic; color: #eee; font-size: 1.1em;">${finalMessage}</div>`;
    
    let statHTML = "";
    statKeys.forEach(k => {
        const val = Math.floor(stats[k]);
        const isMax = val >= 50;
        const color = statColors[k];
        const borderStyle = isMax ? `border: 2px solid ${color}; box-shadow: 0 0 10px ${color};` : "";
        const iconStyle = isMax ? `color: ${color};` : "";
        const maxLabel = isMax ? `<span class="max-label" style="color:${color}">MAX</span>` : "";
        statHTML += `<div class="ed-stat-box" style="${borderStyle}"><i class="fa-solid ${statConfig[k].icon}" style="${iconStyle}"></i><div style="font-size:9px; color:#ccc;">${statConfig[k].name}</div><span class="ed-stat-val">${val}</span>${maxLabel}</div>`;
    });

    statsContainer.innerHTML = msgHTML + unlockHtml + statHTML;
    statsContainer.style.display = "flex";
    statsContainer.style.flexWrap = "wrap";
    statsContainer.style.justifyContent = "center";

    // 7. Analytics 送信
    if (typeof sendGameEvent === 'function') {
        const partnerId = (bestHeroine && bestHeroine.affection > 0) ? bestHeroine.file.split('_')[0] : "solo";
        sendGameEvent("game_clear", { rank, total_score: total, partner_id: partnerId });
    }

    setTimeout(() => { document.getElementById('fade-overlay')?.classList.remove('active'); }, 500);
}

/**
 * ゲームをリトライし、タイトル画面へ戻る
 */
function retryGame() {
    playSE(seFootstep);
    const fade = document.getElementById('fade-overlay');
    fade.classList.add('active');

    // ★リトライ時にチートフラグをリセット
    window.isCheatUsed = false;

    setTimeout(() => {
        resetRunToTitle();
        fade.classList.remove('active');
    }, 800);
    
    syncPersistentUnlocksFromStorage();
    renderBoostButtons();
}

/**
 * 各種フラグ・表示をタイトル画面の状態へリセットする
 */
/* --- js/main.js --- */

function resetRunToTitle() {
    currentStatus = GameStatus.TITLE; // 状態をリセット
    
    // --- 進行/フラグ類を初期化 ---
    turn = 1;
    isEventActive = false;
    isGameStarted = false;
    isTyping = false;
    targetText = "";
    messageQueue = [];
    currentMsgIndex = 0;
    pendingResultHtml = "";
    consecutiveNormalEvents = 0;
    lastEventWasHeroine = false;
    isForcedHeroine = false;
    isResultDisplayed = false;
    lastEventContext = null;
    lastEventResult = null;

    // --- ステータス初期化 ---
    stats = { health: 5, body: 5, mind: 5, magic: 5, fame: 5, money: 5 };
    statKeys.forEach(k => updateUI(k));
    const turnEl = document.getElementById("turn-count");
    if (turnEl) turnEl.innerText = turn;

    // --- ヒロイン進捗をリセット ---
    heroines.forEach(h => { h.progress = 0; h.affection = 0; });

    // --- ログクリア ---
    currentGameLog = [];
    const log = document.getElementById("log-content");
    if (log) log.innerHTML = "";

    localStorage.removeItem('maghribal_resume_data');
    const contBtn = document.getElementById('continue-btn');
    if (contBtn) contBtn.style.display = 'none';

    // --- 画面遷移 ---
    document.getElementById("ed-screen")?.classList.add("hidden-screen");
    document.getElementById("op-screen")?.classList.add("hidden-screen");
    document.getElementById("title-screen")?.classList.remove("hidden-screen");

    const topUI = document.getElementById("top-ui-container");
    if (topUI) topUI.style.display = "none";

    // ★修正: モノローグの残留処理（クラスも削除して完全初期化）---
    const monoContainer = document.getElementById("monologue-container");
    if (monoContainer) {
        monoContainer.style.opacity = ""; // スタイル属性のリセット
        monoContainer.className = "";     // ★追加: 付着したクラスを全て剥ぎ取る
    }

    const monoText = document.querySelector(".monologue-text");
    if (monoText) monoText.innerHTML = ""; // テキスト削除

    // --- ヘルプ画面が開いたままなら閉じる ---
    const helpOverlay = document.getElementById("help-overlay");
    if (helpOverlay) helpOverlay.style.display = "none";

    document.getElementById("background-layer")?.classList.remove("visible");
    document.querySelectorAll('.map-spot').forEach(s => s.classList.remove('spot-visible'));

    const logOverlay = document.getElementById("log-overlay");
    if (logOverlay) logOverlay.style.display = "none";
    const resDiv = document.getElementById("result-display");
    if (resDiv) { resDiv.style.opacity = "0"; resDiv.innerHTML = ""; }

    // --- 音声リセット ---
    try { 
        if (typeof stopHeroineBgm === 'function') stopHeroineBgm();
        bgmEd.pause(); bgmEd.currentTime = 0;
        bgmMap.pause(); bgmMap.currentTime = 0;
        bgmOp.currentTime = 0; bgmOp.play(); 
    } catch(e) {}

    try { updateMapState(); } catch(e) {}
}

/**
 * localStorageから永続的な解放状況を同期する
 */
function syncPersistentUnlocksFromStorage() {
    try {
        const savedB = localStorage.getItem('maghribal_boosts');
        if (savedB) unlockedBoosts = JSON.parse(savedB);

        const savedA = localStorage.getItem('maghribal_active_boosts');
        if (savedA) activeBoosts = JSON.parse(savedA);

        const savedI = localStorage.getItem('maghribal_active_impacts');
        if (savedI) activeImpacts = JSON.parse(savedI);

        const savedC = localStorage.getItem('maghribal_cleared_heroines');
        if (savedC) clearedHeroines = JSON.parse(savedC);
    } catch (e) {
        console.warn("Failed to sync persistent unlocks:", e);
    }
}