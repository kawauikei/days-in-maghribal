/* --- js/text_engine.js --- */
const TextEngine = {
    // データ構造: { text: "表示文字列", reset: true/false }
    queue: [],
    
    // 設定（style.cssに合わせて調整）
    config: {
        maxLines: 3,
        lineHeight: 30, // px
        padding: 40,    // px (上下余白合計)
        containerWidth: 760 // px
    },

    // ■初期化・解析処理
    init: function(rawText) {
        this.queue = [];
        if (!rawText) return;

        // 1. まず「||」（手動改ページ記号）でブロックに分ける
        const blocks = rawText.split('||');

        blocks.forEach((block, bIndex) => {
            // 改行削除
            let cleanBlock = block.replace(/[\r\n\t]+/g, '');
            if (!cleanBlock) return;

            // 2. 句読点や閉じカッコで細かく分割する（クリック待ちの単位）
            // 区切り文字: 。 、 ？ ！ 」 ）
            // ※「（ は区切り文字に含めない
            const chunks = cleanBlock.match(/[^。、？！？」）]+[。、？！？」）]*/g);
            
            const sentences = chunks || [cleanBlock];

            sentences.forEach((sentence, sIndex) => {
                // ■改ページ（リセット）判定
                let shouldReset = false;

                // 条件A: 「||」で区切られた新しいブロックの先頭である
                if (sIndex === 0 && bIndex > 0) {
                    shouldReset = true;
                }
                
                // 条件B: 文の先頭が「（カギ括弧）で始まっている ★ここが重要
                if (sentence.startsWith("「")) {
                    shouldReset = true;
                }

                this.queue.push({
                    text: sentence,
                    reset: shouldReset
                });
            });
        });

        console.log("TextEngine Queue:", this.queue);
    },

    // ■次の表示内容を取得（main.jsから呼ばれる）
    getNext: function(currentHtml) {
        if (this.queue.length === 0) {
            return { text: null, reset: false, isEnd: true };
        }

        const nextItem = this.queue[0];
        let doReset = nextItem.reset;

        // 強制リセットでない場合のみ、あふれ計算を行う
        if (!doReset && currentHtml !== "") {
            // 現在の画面 + 次のテキスト を合体させてあふれるかチェック
            if (this.checkOverflow(currentHtml + nextItem.text)) {
                doReset = true;
            }
        }

        this.queue.shift(); // 先頭を削除

        return {
            text: nextItem.text,
            reset: doReset,
            isEnd: false
        };
    },

    // ■高さ計算（あふれ判定用）
    checkOverflow: function(text) {
        let dummy = document.getElementById('te-dummy-measure');
        if (!dummy) {
            dummy = document.createElement('div');
            dummy.id = 'te-dummy-measure';
            // style.cssの #event-text と同じ設定にする
            dummy.style.cssText = `
                position: absolute; top: -9999px; left: -9999px; visibility: hidden;
                width: ${this.config.containerWidth}px;
                font-size: 18px; line-height: 1.6; font-family: "Zen Old Mincho", serif;
                white-space: pre-wrap; padding: 20px; box-sizing: border-box;
            `;
            document.body.appendChild(dummy);
        }
        dummy.innerHTML = text;
        const limit = (this.config.maxLines * this.config.lineHeight) + this.config.padding;
        return dummy.clientHeight > limit;
    }
};