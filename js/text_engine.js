/* --- js/text_engine.js --- */
const TextEngine = {
    queue: [],
    
    config: {
        maxLines: 2,
        minLength: 15,
        lineHeight: 30,
        padding: 40,
        containerWidth: 760
    },

    // ■初期化・解析処理
    init: function(rawText) {
        this.queue = [];
        if (!rawText) return;

        const blocks = rawText.split('||');
        let bufferText = "";
        let bufferReset = false;

        blocks.forEach((block, bIndex) => {
            let cleanBlock = block.replace(/[\r\n\t]+/g, '');
            if (!cleanBlock) return;

            const atoms = cleanBlock.match(/[^。？！？」）]+[。？！？」）]*/g) || [cleanBlock];

            atoms.forEach((atom, aIndex) => {
                const isBlockStart = (bIndex > 0 && aIndex === 0);
                const isQuoteStart = atom.startsWith("「");
                const isQuoteEnd = atom.endsWith("」");
                const requiresReset = isBlockStart || isQuoteStart;

                if (requiresReset) {
                    if (bufferText.length > 0) {
                        this.queue.push({ text: bufferText, reset: bufferReset });
                    }
                    bufferText = atom;
                    bufferReset = true; 
                } else {
                    if (bufferText.length === 0) bufferReset = false;
                    bufferText += atom;
                }

                if (this.getVisibleLength(bufferText) >= this.config.minLength || isQuoteEnd) {
                    this.queue.push({ text: bufferText, reset: bufferReset });
                    bufferText = "";
                    bufferReset = false;
                }
            });
        });

        if (bufferText.length > 0) {
            this.queue.push({ text: bufferText, reset: bufferReset });
        }

        // --- 後処理: 「」後の改行付与 (物理ガード版) ---
        for (let i = 1; i < this.queue.length; i++) {
            const prev = this.queue[i - 1];
            const curr = this.queue[i];

            // 前が「」で終わり、かつ「今回の塊が改ページ(reset)ではない」時のみ改行を足す
            // これにより Index 0 や reset:true の直後には絶対に <br> が入りません
            if (prev.text.trim().endsWith("」") && !curr.reset) {
                if (!curr.text.startsWith("<br>")) {
                    curr.text = "<br>" + curr.text;
                }
            }
        }
        console.table(this.queue.map((x,i)=>({i, reset:x.reset, text:x.text})));

    },

    // ■見た目の文字数をカウント（タグ無視）
    getVisibleLength: function(text) {
        return text.replace(/<[^>]*>/g, '').replace(/@\w+@/g, '').length;
    },

    // ■次の表示内容を取得
    getNext: function(currentHtml) {
    if (this.queue.length === 0) {
        return { text: null, reset: false, isEnd: true };
    }

    const nextItem = this.queue[0];
    let doReset = nextItem.reset;

    if (!doReset && currentHtml !== "") {
        if (this.checkOverflow(currentHtml + nextItem.text)) {
            // 自動改ページ（オーバーフロー）
            doReset = true;

            // 次ページ先頭が <br> だと空行になるので除去
            nextItem.text = nextItem.text.replace(/^(\s*<br>\s*)+/i, '');
        }
    }

    // 明示改ページ(reset:true)でも安全のため先頭 <br> を除去
    if (doReset) {
        nextItem.text = nextItem.text.replace(/^(\s*<br>\s*)+/i, '');
    }

    this.queue.shift();

    return {
        text: nextItem.text,
        reset: doReset,
        isEnd: false
    };
},


    // ■高さ計算
    checkOverflow: function(text) {
        let dummy = document.getElementById('te-dummy-measure');
        if (!dummy) {
            dummy = document.createElement('div');
            dummy.id = 'te-dummy-measure';
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