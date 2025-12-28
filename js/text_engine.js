/* --- js/text_engine.js --- */
const TextEngine = {
    queue: [],
    
    config: {
        maxLines: 2,
        minLength: 15,
        lineHeight: 30,
        padding: 40,
        containerWidth: 760,
        // overflow 判定が「境界ギリギリ」で誤爆すると、不要な改ページが入り
        // その結果「セリフ終端の強制改行(<br>)」と組み合わさって空白行が出る。
        // 端数丸め/フォント差で 1〜3px 程度の誤差が出るため、許容値を設ける。
        overflowTolerance: 4
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
        console.log("TextEngine Queue Finalized:", this.queue);
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
                doReset = true;
            }
        }

        // ★重要: 画面上の「改ページ」が発生する場合、先頭の <br> を落とす
        // - init() 時点では overflow による改ページが分からないため、
        //   「セリフ終端→次の塊に <br> 付与」後に、表示側で改ページ判定が入ると
        //   <br> が新ページ先頭に来て「空白行」になります。
        // - ここで doReset が true のときだけ先頭 <br> を除去すれば、
        //   同ページ内の「二行目に落としたい」意図は維持できます。
        let outText = nextItem.text;
        if (doReset && typeof outText === 'string') {
            outText = outText.replace(/^(\s*<br>\s*)+/i, '');
        }

        this.queue.shift();

        return {
            text: outText,
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
        const tol = Number(this.config.overflowTolerance ?? 0) || 0;
        return dummy.clientHeight > (limit + tol);
    },

    // =========================================
    //  Log helper
    //  - TextEngine と同じ分割・改行ルールで「通しログ」用HTMLを生成する
    //  - reset(改ページ) 直後に先頭 <br> が来てしまうケースを除去し、
    //    ログ側でも「無駄な空白行」を作らない
    // =========================================
    buildLogHtml: function(rawText) {
        if (!rawText) return "";

        // init() は this.queue を破壊するので、ログ用はローカルに解析する
        const parseQueue = (text) => {
            const q = [];
            const blocks = String(text).split('||');
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
                            q.push({ text: bufferText, reset: bufferReset });
                        }
                        bufferText = atom;
                        bufferReset = true;
                    } else {
                        if (bufferText.length === 0) bufferReset = false;
                        bufferText += atom;
                    }

                    if (this.getVisibleLength(bufferText) >= this.config.minLength || isQuoteEnd) {
                        q.push({ text: bufferText, reset: bufferReset });
                        bufferText = "";
                        bufferReset = false;
                    }
                });
            });

            if (bufferText.length > 0) {
                q.push({ text: bufferText, reset: bufferReset });
            }

            // 「」終端後の改行付与（reset:true の直後には入れない）
            for (let i = 1; i < q.length; i++) {
                const prev = q[i - 1];
                const curr = q[i];
                if (prev.text.trim().endsWith("」") && !curr.reset) {
                    if (!curr.text.startsWith("<br>")) {
                        curr.text = "<br>" + curr.text;
                    }
                }
            }
            return q;
        };

        const q = parseQueue(rawText);
        let html = "";

        for (let i = 0; i < q.length; i++) {
            const item = q[i];
            let t = item.text || "";

            // 改ページ扱いの塊は、先頭 <br> を除去（空行が先頭に出るのを防ぐ）
            if (item.reset) {
                t = t.replace(/^(\s*<br>\s*)+/i, '');
                // 通しログでは「ページ区切り」を1行空け程度に落とす（必要ならここを調整）
                if (html !== "" && !html.endsWith("<br>")) html += "<br>";
            }

            html += t;
        }

        return html;
    }
};