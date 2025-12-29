// =========================================
//  Audio Management (BGM & SE)
// =========================================

// --- Audio Objects Definition ---

// BGM (bgm/ フォルダ)
const bgmOp = new Audio('bgm/op.mp3');
bgmOp.loop = true;

const bgmMap = new Audio('bgm/map.mp3');
bgmMap.loop = true;

const bgmEd = new Audio('bgm/ed.mp3');
bgmEd.loop = true;

// SE (se/ フォルダ)
const seOp = new Audio('se/op.mp3');
const sePage = new Audio('se/pera.mp3');
const sePi = new Audio('se/pi.mp3');
const seFootstep = new Audio('se/za.mp3');

// グローバル音量変数（初期値）
let currentBgmVol = 0.3;

// ヒロインBGM（動的にロードされた Audio を再生するため）
let currentHeroineBgm = null;
let currentSeVol = 0.5;

// フェード用タイマー（複数BGMが被った時に前のフェードを止める）
const __bgmFadeTimers = new WeakMap();

function __clearFadeTimer(audio) {
    const t = __bgmFadeTimers.get(audio);
    if (t) clearInterval(t);
    __bgmFadeTimers.delete(audio);
}

/**
 * BGMを指定音量へフェードさせる（Promise）
 * - duration中に volume を滑らかに変える
 * - フェード完了後に pause/stop したい場合は onDone を使う
 */
function fadeBgmTo(audio, targetVol, duration = 800, onDone = null) {
    return new Promise((resolve) => {
        if (!audio) return resolve();

        __clearFadeTimer(audio);

        // duration=0 は即時
        if (duration <= 0) {
            audio.volume = Math.max(0, Math.min(1, targetVol));
            try { if (onDone) onDone(); } catch (_) {}
            return resolve();
        }

        const interval = 50;
        const steps = Math.max(1, Math.round(duration / interval));
        const start = (isFinite(audio.volume) ? audio.volume : 0);
        const delta = (targetVol - start) / steps;

        let n = 0;
        const timer = setInterval(() => {
            n++;
            const v = start + delta * n;
            audio.volume = Math.max(0, Math.min(1, v));

            if (n >= steps) {
                audio.volume = Math.max(0, Math.min(1, targetVol));
                clearInterval(timer);
                __bgmFadeTimers.delete(audio);
                try { if (onDone) onDone(); } catch (_) {}
                resolve();
            }
        }, interval);

        __bgmFadeTimers.set(audio, timer);
    });
}

function fadeOutBgm(audio, duration = 800, pauseAndReset = true) {
    if (!audio) return Promise.resolve();
    const onDone = pauseAndReset ? () => {
        try { audio.pause(); } catch (_) {}
        try { audio.currentTime = 0; } catch (_) {}
    } : null;
    return fadeBgmTo(audio, 0, duration, onDone);
}

function fadeInBgm(audio, duration = 800, resetTime = false) {
    if (!audio) return Promise.resolve();
    __clearFadeTimer(audio);

    const targetVol = currentBgmVol;
    if (resetTime) {
        try { audio.currentTime = 0; } catch (_) {}
    }

    // 音量0設定なら無音再生にして終わり
    if (targetVol <= 0) {
        audio.volume = 0;
        audio.play().catch(() => {});
        return Promise.resolve();
    }

    audio.volume = 0;
    audio.play().catch(() => {});
    return fadeBgmTo(audio, targetVol, duration);
}

/**
 * 2つのBGMをクロスフェードする
 * @param {Audio|null} fromAudio - 今鳴っている側（null可）
 * @param {Audio} toAudio - 切り替え先
 */
function crossFadeBgm(fromAudio, toAudio, duration = 900, resetToTime = false) {
    if (!toAudio) return Promise.resolve();
    if (fromAudio === toAudio) {
        // 同一なら必要なら音量だけ合わせる
        toAudio.volume = currentBgmVol;
        toAudio.play().catch(() => {});
        return Promise.resolve();
    }

    // 先に to を起動
    toAudio.loop = true;
    if (resetToTime) {
        try { toAudio.currentTime = 0; } catch (_) {}
    }
    // from が止まっていて to も止まっているケースを想定して play
    toAudio.volume = 0;
    toAudio.play().catch(() => {});

    const pIn = fadeBgmTo(toAudio, currentBgmVol, duration);
    const pOut = fromAudio ? fadeOutBgm(fromAudio, duration, true) : Promise.resolve();
    return Promise.all([pIn, pOut]).then(() => {});
}

// --- Functions ---

/**
 * SEを再生する（重ねて再生可能にするためcloneNodeを使用）
 * @param {Audio} audio - 再生するAudioオブジェクト
 */
function playSE(audio) {
    const clone = audio.cloneNode();
    clone.volume = currentSeVol; // 現在の設定音量を適用
    clone.play();
}

/**
 * BGM音量を変更する
 * @param {number} val - 0.0 〜 1.0
 */
function setBgmVolume(val) {
    currentBgmVol = parseFloat(val);
    
    // 現在再生中のBGMに即時反映
    bgmOp.volume = currentBgmVol;
    bgmMap.volume = currentBgmVol;
    bgmEd.volume = currentBgmVol;
    if (currentHeroineBgm) currentHeroineBgm.volume = currentBgmVol;
    
    // 設定を保存
    localStorage.setItem('maghribal_bgm_vol', currentBgmVol);
}

/**
 * SE音量を変更する
 * @param {number} val - 0.0 〜 1.0
 */
function setSeVolume(val) {
    currentSeVol = parseFloat(val);
    
    // オリジナルのオブジェクトの音量も更新しておく（念のため）
    seOp.volume = currentSeVol;
    sePage.volume = currentSeVol;
    sePi.volume = currentSeVol;
    seFootstep.volume = currentSeVol;
    
    // 設定を保存
    localStorage.setItem('maghribal_se_vol', currentSeVol);
}

/**
 * 起動時に保存された音量を適用する
 */
function loadAudioSettings() {
    const savedBgm = localStorage.getItem('maghribal_bgm_vol');
    const savedSe = localStorage.getItem('maghribal_se_vol');
    
    if (savedBgm !== null) setBgmVolume(savedBgm);
    else setBgmVolume(0.3); // デフォルト

    if (savedSe !== null) setSeVolume(savedSe);
    else setSeVolume(0.5); // デフォルト
}

/**
 * BGMをフェードイン再生する
 * 設定音量(currentBgmVol)に向かって徐々に音量を上げる
 * @param {Audio} audio - 再生するAudioオブジェクト
 * @param {number} duration - かける時間(ms) デフォルト2000ms
 */
function playBgmFadeIn(audio, duration = 2000) {
    const targetVol = currentBgmVol; 
    
    // 音量が0設定ならフェードイン処理はせず、ただ再生（無音）にして終了
    if (targetVol <= 0) {
        audio.volume = 0;
        audio.currentTime = 0;
        audio.play();
        return;
    }

    audio.volume = 0;
    audio.currentTime = 0;
    audio.play();

    const interval = 50;
    const step = targetVol / (duration / interval); 

    const timer = setInterval(() => {
        // 設定音量が途中で下げられた場合などの安全策
        if (audio.volume >= targetVol) {
            audio.volume = targetVol;
            clearInterval(timer);
            return;
        }

        if (audio.volume < targetVol - step) {
            audio.volume += step;
        } else {
            audio.volume = targetVol;
            clearInterval(timer); 
        }
    }, interval);
}

// =========================================
//  Heroine BGM Controls
// =========================================

function playHeroineBgm(audio) {
    if (!audio) return;

    // 同じ曲なら何もしない
    if (currentHeroineBgm === audio && !audio.paused) return;

    // どのBGMから切り替えるか（優先: ヒロイン → マップ → OP）
    const from = (currentHeroineBgm && !currentHeroineBgm.paused) ? currentHeroineBgm
               : (!bgmMap.paused ? bgmMap
               : (!bgmOp.paused ? bgmOp : null));

    // 切り替え先をセット
    currentHeroineBgm = audio;
    currentHeroineBgm.loop = true;

    // クロスフェードで切り替え（マップBGMは止める）
    crossFadeBgm(from, currentHeroineBgm, 900, false);
}

function stopHeroineBgm() {
    if (!currentHeroineBgm) return;
    // マップへ戻すときに呼ばれる想定。フェードアウトのみ。
    const a = currentHeroineBgm;
    currentHeroineBgm = null;
    fadeOutBgm(a, 600, true);
}

/**
 * マップBGMへ戻す（ヒロインBGMが鳴っていればクロスフェード）
 */
function switchToMapBgm() {
    const from = (currentHeroineBgm && !currentHeroineBgm.paused) ? currentHeroineBgm
               : (!bgmOp.paused ? bgmOp : null);
    // bgmMap が既に鳴っているなら、音量だけ合わせる
    if (!bgmMap.paused) {
        bgmMap.volume = currentBgmVol;
        if (from && from !== bgmMap) fadeOutBgm(from, 600, true);
        return;
    }
    crossFadeBgm(from, bgmMap, 900, false);
    // currentHeroineBgm は切り替え完了前でも null にしておく（状態をマップ側に寄せる）
    currentHeroineBgm = null;
}

function playHeroineBgmByFile(heroineFile) {
    // main.js 側で gameAssets.bgm_heroine に Audio が入る想定
    const audio = (typeof gameAssets !== 'undefined' && gameAssets.bgm_heroine)
        ? gameAssets.bgm_heroine[heroineFile]
        : null;

    if (!audio) {
        console.warn('Heroine BGM not found:', heroineFile);
        return;
    }
    playHeroineBgm(audio);
}
