/* --- テキスト管理・表示エンジン --- */
const TextEngine = {
    queue: [],         // 表示待ちのテキストチャンク配列
    currentText: "",   // 現在画面に出ているテキスト（HTML含む）
    maxLines: 3,       // 最大行数
    lineHeight: 28,    // 1行の高さ（CSSに合わせて調整が必要）
    
    // ■初期化・解析処理
    // JSONの生テキストを受け取り、表示用のキューに変換する
    init: function(rawText) {
        // 1. JSON上の改行やタブを削除（直感的な編集のため）
        let cleanText = rawText.replace(/[\r\n\t]+/g, '');

        // 2. 明示的な改ページ記号（例: [p]）で大きく分割
        // もし [p] があれば、そこは強制的に「新しい塊」として扱うロジックが必要ですが、
        // 今回はシンプルに「配列の要素」として扱い、取り出し時に判定します。
        
        // 3. 句読点や「」で分割して配列にする
        // 例: 「こんにちは。」「いい天気ですね」 -> ["「こんにちは。」", "「いい天気ですね」"]
        // 正規表現: 任意の文字(複数) + 句読点等(0個以上)
        const chunks = cleanText.match(/[^、。！？「」]+[、。！？「」]*/g) || [cleanText];
        
        this.queue = chunks;
        this.currentText = "";
        
        console.log("Parsed Queue:", this.queue); // デバッグ用
    },

    // ■次のテキストを取得する処理（クリック時に呼ぶ）
    // 戻り値: { text: "表示する文字", shouldReset: true/false, isEnd: boolean }
    getNext: function() {
        if (this.queue.length === 0) {
            return { text: "", shouldReset: false, isEnd: true };
        }

        const nextChunk = this.queue[0]; // 次の候補（まだ削除しない）
        
        // あふれ判定
        const willOverflow = this.checkOverflow(this.currentText + nextChunk);
        let shouldReset = false;

        if (willOverflow) {
            // あふれるならリセット指示を出す
            // ただし、現在が「空」なのにあふれる（＝1つの塊が巨大すぎる）場合はリセットしても意味がないので除外
            if (this.currentText !== "") {
                shouldReset = true;
            }
        }
        
        // リセット指示なら、現在テキストをクリアして計算し直す
        if (shouldReset) {
            this.currentText = nextChunk;
        } else {
            this.currentText += nextChunk;
        }

        // キューから正式に削除
        this.queue.shift();

        return { 
            text: nextChunk, 
            shouldReset: shouldReset, 
            isEnd: false 
        };
    },

    // ■高さ計算（あふれ判定）
    checkOverflow: function(simulatedText) {
        // 計測用のダミー要素を取得（なければ作る）
        let dummy = document.getElementById('text-measure-dummy');
        if (!dummy) {
            dummy = document.createElement('div');
            dummy.id = 'text-measure-dummy';
            // 本番のテキストエリアと同じスタイルを適用することが重要
            dummy.style.cssText = `
                position: absolute; 
                visibility: hidden; 
                top: -9999px; 
                width: 600px; /* 本番の横幅に合わせる */
                font-size: 16px; /* 本番に合わせる */
                line-height: 1.5; /* 本番に合わせる */
                white-space: pre-wrap; /* 改行の扱い */
                padding: 20px; /* パディングも合わせる */
            `;
            document.body.appendChild(dummy);
        }

        // テキストを入れて高さを測る
        dummy.innerHTML = simulatedText;
        const height = dummy.clientHeight;
        
        // 許容高さ（行数 × 行の高さ ＋ パディング等）
        // ここは実際のCSSに合わせて微調整が必要です
        const limitHeight = this.maxLines * this.lineHeight + 40; // +40はpadding分など

        return height > limitHeight;
    }
};