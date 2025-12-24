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
let currentSeVol = 0.5;

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