/**
 * analytics.js
 * ゲームのプレイ状況をGoogle Analytics 4 (GA4) に送信し、
 * 開発フェーズ（デバッグ/一般公開）ごとのログ制御を行うスクリプト
 */

// =========================================================
// 1. 運用設定 (ここを手動で書き換えて切り替える)
// =========================================================
const ANALYTICS_CONFIG = {
    // ★ここを書き換えて、統計の「箱」を分ける
    // 例: "Debugger_Vol1", "ClosedBeta", "Release_v1.0"
    CURRENT_PHASE: "Debugger_2025_12",

    // デバッグスイッチ
    // true: コンソールに送信ログを表示 & GA4のDebugViewを有効化
    // false: 静かにする (一般公開向け)
    IS_DEBUG: true,

    // Google Analytics 測定ID (固定)
    MEASUREMENT_ID: "G-S3QX32FZWM"
};

// =========================================================
// 2. 初期化処理 (読み込み時に自動実行)
// =========================================================
(function initAnalytics() {
    // 1. GA4のスクリプトタグを動的に生成して読み込む
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // 2. dataLayerの準備
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag; // グローバルで使えるように公開

    // 3. 初期設定
    gtag('js', new Date());

    // 4. 設定の適用 (フェーズ情報とデバッグモード)
    // ここでセットした 'deployment_phase' が、この後の全イベントに自動付与されます
    gtag('config', ANALYTICS_CONFIG.MEASUREMENT_ID, {
        'user_properties': {
            'deployment_phase': ANALYTICS_CONFIG.CURRENT_PHASE
        },
        'debug_mode': ANALYTICS_CONFIG.IS_DEBUG
    });

    // 起動ログ
    if (ANALYTICS_CONFIG.IS_DEBUG) {
        console.log(`%c[Analytics] Initialized. ID: ${ANALYTICS_CONFIG.MEASUREMENT_ID}, Phase: ${ANALYTICS_CONFIG.CURRENT_PHASE}`, "color: #00bcd4; font-weight: bold;");
    }
})();


// =========================================================
// 3. 送信機能
// =========================================================

/**
 * ゲーム内イベント送信関数
 * ゲーム側からはこの関数を呼んでください。
 * * @param {string} eventName - イベント名 (例: "game_start", "level_up")
 * @param {object} params - 詳細データ (例: { level: 1, score: 500 })
 */
function sendGameEvent(eventName, params = {}) {
    // 念のため、イベントパラメータにもフェーズ情報を混ぜる（バックアップ用）
    const finalParams = {
        ...params,
        phase: ANALYTICS_CONFIG.CURRENT_PHASE, // ← ここにカンマが必要です
        debug_mode: ANALYTICS_CONFIG.IS_DEBUG
        
    };

    // デバッグ表示
    if (ANALYTICS_CONFIG.IS_DEBUG) {
        console.log(`[Analytics] Sending Event: ${eventName}`, finalParams);
    }

    // GA4へ送信
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, finalParams);
    }
}