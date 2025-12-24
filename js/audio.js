// =========================================
//  Audio Management (音響管理)
// =========================================

// SE（効果音）の定義
const sePi = new Audio('se/pi.mp3'); 
const seOp = new Audio('se/op.mp3'); 
const seFootstep = new Audio('se/za.mp3'); 
const sePage = new Audio('se/pera.mp3');

// BGM（音楽）の定義
const bgmOp = new Audio('bgm/op.mp3'); 
bgmOp.loop = true; 
bgmOp.volume = 0.3;

const bgmMap = new Audio('bgm/map.mp3'); 
bgmMap.loop = true; 
bgmMap.volume = 0.3;

const bgmEd = new Audio('bgm/ed.mp3'); 
bgmEd.loop = true; 
bgmEd.volume = 0.3;

/**
 * SEを再生する（連続再生対応のためクローンを作成）
 * @param {Audio} audio - 再生するAudioオブジェクト
 */
function playSE(audio) {
    const clone = audio.cloneNode();
    clone.volume = audio.volume;
    clone.play().catch(e => console.log("Audio play blocked:", e));
}