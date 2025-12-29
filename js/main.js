// =========================================
//  Main Logic (変数定義・初期化・進行管理)
// =========================================

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
let currentGameLog = [];
let unlockedBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeBoosts = { health: false, body: false, mind: false, magic: false, fame: false, money: false };
let activeImpacts = Array(12).fill(false);
// gameAssets: ゲーム中に参照する各種データ/アセット
// - stl_db: 事前生成したスチル設定DB (data/heroines/stl_db.json)
const gameAssets = { events: {}, heroines: {}, bgm_heroine: {}, stl_db: {} };

// --- 初期化処理 ---
window.onload = async () => {
    loadAudioSettings(); 
    const statusEl = document.getElementById("load-status"); 
    const barFill = document.getElementById("load-bar-fill");
    
    // 読み込むアセットのリスト作成
    const assetsToLoad = []; 
    
    // 1. JSONデータのロード予約
    scenarios.forEach(s => {
        for (let i = 1; i <= 3; i++) {
            assetsToLoad.push({ type: 'event', file: `${s.file}_${i}` });
        }
    });
    heroines.forEach(h => assetsToLoad.push({ type: 'heroine', file: h.file }));

    // ★追加: ヒロインごとのBGMロード予約 (bgm/h01_hortensia.mp3 など)
    heroines.forEach(h => assetsToLoad.push({ type: 'bgm_heroine', file: h.file, path: `bgm/${h.file}.mp3` }));
    
    // 2. ★追加: 背景画像のロード予約
    scenarios.forEach(s => {
        for (let i = 1; i <= 3; i++) {
            // ファイル名規則 (例: images/bg/e01_royal_city_01.webp)
            const numStr = String(i).padStart(2, '0');
            const path = `images/bg/${s.file}_${numStr}.webp`;
            assetsToLoad.push({ type: 'image', path: path });
        }
    });

    // 3. ★追加: ヒロイン立ち絵のロード予約
    // heroinesデータの .file (例: "h01_hortensia") を利用して _01.webp ～ _07.webp を読み込む
    heroines.forEach(h => {
        for (let i = 0; i <= 6; i++) {
            const numStr = String(i).padStart(2, '0');
            const path = `images/chara/00_normal/${h.file}_${numStr}.webp`;
            assetsToLoad.push({ type: 'image', path: path });
        }
    });
    
    let loadedCount = 0;
    
    // ★重要: ここから下の「読み込み実行処理」を画像対応版に書き換えます
    const loadPromises = assetsToLoad.map(async (asset) => {
        try {
            // 【画像の場合】
            if (asset.type === 'image') {
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = asset.path;
                    img.onload = resolve;
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${asset.path}`);
                        resolve(); // エラーでも止まらないようにする
                    };
                });
            } 
            // 【イベントデータの場合】
            else if (asset.type === 'event') { 
                const res = await fetch(`data/events/${asset.file}.json`);
                const data = await res.json();
                gameAssets.events[asset.file] = data; 
            }
            // 【ヒロインデータの場合】
            else if (asset.type === 'heroine') {
                const res = await fetch(`data/heroines/${asset.file}.json`);
                gameAssets.heroines[asset.file] = await res.json();
            }

            // 【ヒロインBGMの場合】
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
            
            // ログ表示（ファイル名だけ表示）
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
            // イベント進行中のみ反応
            if (isEventActive) {
                proceedText();
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
    
    let text = "";
    let pool = [];

    // --- コンソールデバッグ開始 ---
    console.group("--- Monologue Debug ---");
    console.log("Type:", type);
    console.log("Last Event Context:", lastEventContext);

    if (type === 'resume') { 
        text = "……さて、旅の続きを始めよう。"; 
    } else if (type === 'start') {
        pool = monologueData.start;
    } else if (lastEventContext) { 
        const { name, progress } = lastEventContext;
        console.log(`Heroine Event detected: ${name}, Context Progress Value: ${progress}`);
        
        // --- 修正箇所：progressの値に基づいて参照インデックスを決定 ---
        // progress: 6 は「後日談(events[5])」を見た直後 → モノローグも index 5 を出す
        // progress: 7 は「世間話(events[6])」を見た直後 → モノローグも index 6 を出す
        
        let targetIndex = 0;
        if (progress === 7) {
            targetIndex = 6; // 世間話用モノローグ
            console.log("System: Small Talk result detected. Using index 6.");
        } else if (progress === 6) {
            targetIndex = 5; // 後日談用モノローグ
            console.log("System: After Story result detected. Using index 5.");
        } else {
            targetIndex = Math.min(progress - 1, 4); // 通常イベント(1-5回目)
            console.log(`System: Normal Event detected. Using index ${targetIndex}.`);
        }

        if (heroineReactions[name] && heroineReactions[name][targetIndex]) {
            text = heroineReactions[name][targetIndex];
        } else {
            console.warn(`Result: heroineReactions['${name}'][${targetIndex}] not found.`);
            pool = monologueData.success;
        }
        lastEventContext = null;
    } else {
        // --- 汎用モノローグの抽選 ---
        console.log("System: Selecting random general monologue.");
        const maxStats = statKeys.filter(k => stats[k] >= 50);
        if (maxStats.length > 0 && Math.random() < 0.3) { 
            console.log("Selected: Max Stat Pool");
            pool = monologueData.stat_max; 
        } 
        else if (lastEventResult && Math.random() < 0.7) {
            const resKey = (lastEventResult === 'great_success' || lastEventResult === 'great') ? 'great' : lastEventResult;
            console.log(`Selected: Result Pool (${resKey})`);
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
                    console.log("Selected: Rumor text");
                }
            } else {
                console.log("Selected: Hint Pool");
                pool = monologueData.hint_weak;
            }
        }
        else {
            if (turn < 5) pool = monologueData.progress_low;
            else if (turn < 15) pool = monologueData.progress_mid;
            else pool = monologueData.progress_high;
            console.log("Selected: Turn Progress Pool");
        }
    }

    if (!text) {
        if (!pool || pool.length === 0) {
            console.error("Critical: No pool found, using backup progress_mid.");
            pool = monologueData.progress_mid;
        }
        text = pool[Math.floor(Math.random() * pool.length)];
    }
    console.log("Final Text:", text);
    console.groupEnd();
    // --- コンソールデバッグ終了 ---

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
    resizeGameContainer(); 
    currentGameLog = []; 
    document.getElementById("log-content").innerHTML = ""; 
    
    statKeys.forEach(k => { 
        // activeBoosts[k] が true なら 3+15=18、false なら 3
        stats[k] = activeBoosts[k] ? 18 : 3; 
        updateUI(k); 
    });
    
    bgmOp.pause(); bgmOp.currentTime = 0; bgmOp.play(); 
    document.getElementById("title-screen").classList.add("hidden-screen"); 
    
    setTimeout(() => { 
        document.getElementById("op-screen").classList.remove("hidden-screen"); 

        // ▼【変更】opLines の分岐を削除し、常に通常OPテキストを使用
        const opLines = ["陽が沈む西の地、マグリバル。", "ここには名声、富、知識、そして力が眠っている。", "残された時間は、そう長くはない。", "どの道を歩み、何者となるか。", "全ては汝の選択に委ねられている。"];
        
        updateMapState(); 
        
        // ... (以降のアニメーション処理はそのまま) ...
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
        window.nextOP = () => { 
            idx++; 
            if (idx < opLines.length) showLine(); 
            else { 
                document.getElementById("op-screen").classList.add("hidden-screen"); 
                document.getElementById("top-ui-container").style.display = "flex"; 
                document.getElementById("background-layer").classList.add("visible"); 
                bgmOp.pause(); bgmMap.currentTime = 0; playBgmFadeIn(bgmMap);
                setTimeout(() => { 
                    document.querySelectorAll('.map-spot').forEach(s => s.classList.add('spot-visible')); 
                    updateMonologue('start');
                    isGameStarted = true; 
                }, 1000); 
            } 
        }; 
    }, 500); 
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

/* --- js/main.js --- */

function showEnding() {
    processBoostUnlock(); // 既存: ステータスブーストの解放処理

    // ▼▼▼ 追加: 親密度No.1ヒロインの地域解放処理 ▼▼▼
    // 親密度(affection)が最も高いヒロインを特定
    // (同点の場合は配列の順序が早い方が選ばれますが、仕様として許容します)
    const bestHeroine = heroines.reduce((prev, current) => 
        (prev.affection > current.affection) ? prev : current
    );

    // まだ解放されていない場合、リストに追加して保存
    if (bestHeroine && !clearedHeroines.includes(bestHeroine.name)) {
        clearedHeroines.push(bestHeroine.name);
        localStorage.setItem('maghribal_cleared_heroines', JSON.stringify(clearedHeroines));
        
        console.log(`[Unlock] Best Heroine: ${bestHeroine.name} (Affection: ${bestHeroine.affection})`);
    }
    // ▲▲▲ 追加ここまで ▲▲▲

    saveCurrentGameLog();
    localStorage.removeItem('maghribal_resume_data');

    document.getElementById("ed-screen").classList.remove("hidden-screen");
    bgmMap.pause(); bgmEd.currentTime = 0; bgmEd.play();
    
    const total = Object.values(stats).reduce((sum, v) => sum + v, 0);
    let rank = total >= 150 ? "LEGEND" : (total >= 100 ? "GOLD" : (total >= 50 ? "SILVER" : "BRONZE"));
    document.getElementById("ed-rank").innerText = `Rank: ${rank}`;

    // 画面表示用のベストパートナー選定（ここもaffection基準に統一します）
    // 元コード: let best = heroines.reduce((a, b) => a.progress > b.progress ? a : b);
    let best = bestHeroine; // さっき計算したものを使う

    let endingDisplay = "";
    let finalMessage = "";

    if (best && best.progress > 0) {
        const hIcon = `<i class="fa-solid ${best.icon}" style="margin:0 10px;"></i>`;
        let affinityIcon = (best.progress >= 5) ? `<span class="affinity-icon bouquet-icon"><i class="fa-solid fa-mound"></i></span>` : 
                            (best.progress >= 3) ? `<span class="affinity-icon affinity-seedling" style="margin-left:8px;"><i class="fa-solid fa-seedling"></i></span>` : 
                                                    `<span class="affinity-icon affinity-leaf" style="margin-left:8px;"><i class="fa-solid fa-leaf"></i></span>`;
        endingDisplay = `Partner: ${hIcon} ${best.name}${affinityIcon}`;
        finalMessage = best.finMsg[best.progress] || best.finMsg[best.finMsg.length - 1];
    } else {
        const maxK = [...statKeys].sort((a, b) => stats[b] - stats[a])[0];
        endingDisplay = `称号: ${soloTitles[maxK]}`;
        const randomH = heroines[Math.floor(Math.random() * heroines.length)];
        finalMessage = randomH.finMsg[0];
    }

    document.getElementById("ed-heroine").innerHTML = endingDisplay;
    
    const statsContainer = document.getElementById("ed-stats");
    const msgHTML = `<div style="flex: 0 0 100%; width: 100%; text-align: center; margin: 20px 0 40px; font-style: italic; color: #eee; font-size: 1.1em;">${finalMessage}</div>`;
    
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

    statsContainer.innerHTML = msgHTML + statHTML;
    statsContainer.style.display = "flex";
    statsContainer.style.flexWrap = "wrap";
    statsContainer.style.justifyContent = "center";
    setTimeout(() => { document.getElementById('fade-overlay').classList.remove('active'); }, 500);
}

function retryGame() {
    playSE(seFootstep);
    const fade = document.getElementById('fade-overlay');
    fade.classList.add('active');

    setTimeout(() => {
    resetRunToTitle();        // ★追加
    fade.classList.remove('active');
    }, 800);
    syncPersistentUnlocksFromStorage();
    renderBoostButtons();
}

function resetRunToTitle() {
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

    // --- ステータス初期化（タイトル表示用。開始時は startOP が上書きする）---
    stats = { health: 5, body: 5, mind: 5, magic: 5, fame: 5, money: 5 };
    statKeys.forEach(k => updateUI(k));
    const turnEl = document.getElementById("turn-count");
    if (turnEl) turnEl.innerText = turn;

    // --- ヒロイン進捗をリセット（周回の“今回プレイ分”だけ）---
    heroines.forEach(h => { h.progress = 0; h.affection = 0; });

    // --- ログ（今回プレイ分）をクリア。過去記録は localStorage 側なので残る ---
    currentGameLog = [];
    const log = document.getElementById("log-content");
    if (log) log.innerHTML = "";

    // --- セッション再開データは消す（showEnding と同じ挙動）---
    localStorage.removeItem('maghribal_resume_data');
    const contBtn = document.getElementById('continue-btn');
    if (contBtn) contBtn.style.display = 'none';

    // --- 画面をタイトル状態へ戻す ---
    document.getElementById("ed-screen")?.classList.add("hidden-screen");
    document.getElementById("op-screen")?.classList.add("hidden-screen");
    document.getElementById("title-screen")?.classList.remove("hidden-screen");

    const topUI = document.getElementById("top-ui-container");
    if (topUI) topUI.style.display = "none";

    document.getElementById("background-layer")?.classList.remove("visible");
    document.querySelectorAll('.map-spot').forEach(s => s.classList.remove('spot-visible'));

    // --- オーバーレイ類を閉じる（開きっぱなし防止）---
    const logOverlay = document.getElementById("log-overlay");
    if (logOverlay) logOverlay.style.display = "none";
    const resDiv = document.getElementById("result-display");
    if (resDiv) { resDiv.style.opacity = "0"; resDiv.innerHTML = ""; }

    // --- 音をタイトルへ ---
    try { bgmEd.pause(); bgmEd.currentTime = 0; } catch {}
    try { bgmMap.pause(); bgmMap.currentTime = 0; } catch {}
    try { bgmOp.currentTime = 0; bgmOp.play(); } catch {}

    // --- マップ表示などの再計算（必要なら）---
    try { updateMapState(); } catch {}
    }
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
