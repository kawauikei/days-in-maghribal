/* --- js/game_data.js --- */
const statConfig = {
    health: { name: "健康", icon: "fa-heart-pulse" },
    body:   { name: "肉体", icon: "fa-dumbbell" },
    mind:   { name: "精神", icon: "fa-brain" },
    magic:  { name: "魔力", icon: "fa-wand-sparkles" },
    fame:   { name: "名声", icon: "fa-medal" },
    money:  { name: "資産", icon: "fa-coins" }
};
const statKeys = Object.keys(statConfig);

// game_data.js の定数を変更
const HINT_AVG = "\n[Hint] 各地を巡り、全ステータスの「@average@」を上げると物語が進展します。";
const getHintStat = (statKey) => `\n[Hint] この場所に関連する「@${statKey}@」をより高めると物語が進展します。`;

const heroines = [
    { name: "オルテンシア", title: "王女", icon: "fa-crown", file: "h01_hortensia", progress: 0, affection: 0, 
      minAvg: [0, 6, 14, 22, 30],
      lockAvgMsgs: [
          "人だかりの向こうに王女の姿が見えた。だが、彼女がこちらに目を留めることはなかった。今の貴方には、まだ人を惹きつける何かが足りないようだ。" + HINT_AVG,
          "彼女と目が合った気がしたが、すぐに逸らされた。期待に応えるには、まだ経験が浅いと判断されたのかもしれない。" + HINT_AVG
      ],
      lockStatMsgs: [
          "王女を囲む貴族たちの話し声が聞こえる。どうやら最近、名を上げた勇士を探しているようだが……貴方の名はまだ、彼らの耳には届いていない。" + getHintStat("fame"),
          "「……ごめんなさい。今はまだ、貴方と深く語らう時ではないようですわ」彼女は寂しげに、しかし毅然として歩き去った。" + getHintStat("fame")
      ],
      afterMsg: "オルテンシアと共に王都を歩む。彼女はもう、貴方の隣が一番落ち着く場所だと笑ってくれた。穏やかで幸福な時間が流れていく。",
      chatMsg: "「あら、貴方。今日も精が出ますわね」\n王女として公務に励むオルテンシアと、短くも温かな言葉を交わした。"
    },
    { name: "ルナリス", title: "魔女", icon: "fa-moon", file: "h02_lunaris", progress: 0, affection: 0, 
      minAvg: [0, 8, 16, 26, 35],
      lockAvgMsgs: [
          "塔の最上階に揺らめく影が見えた。だが、貴方の存在はその神秘の霧に触れることすらできず、ただ虚空を見上げるばかりだ。" + HINT_AVG,
          "ルナリスの視線が貴方を通り過ぎていく。彼女の求める『魂の厚み』には、まだ届いていないようだ。" + HINT_AVG
      ],
      lockStatMsgs: [
          "大気に満ちる魔力が激しく渦巻いている。貴方の内なる魔力は、彼女の領域に踏み込むための鍵としては、あまりに弱々しい。" + getHintStat("magic"),
          "「……惜しいわね。貴方の魔力、あと少しだけ強ければ、私の隣に招待できたのだけれど」" + getHintStat("magic")
      ],
      afterMsg: "ルナリスと共にお茶を楽しむ。彼女は古い魔導書を閉じ、貴方の冒険譚をせがんだ。二人の間に、言葉以上の親愛が満ちている。",
      chatMsg: "「ふふ、また貴方ね。その魂の輝き、嫌いじゃないわ」\nルナリスは水晶玉から目を離し、謎めいた微笑みを投げかけてくれた。"
    },
    { name: "エルナ", title: "狩人", icon: "fa-paw", file: "h03_erna", progress: 0, affection: 0, 
      minAvg: [0, 4, 10, 18, 25],
      lockAvgMsgs: [
          "茂みの奥で金色の瞳が光った。だが、獲物でも仲間でもないと判断されたのか、その気配は風と共に消え去ってしまった。" + HINT_AVG,
          "エルナが木の上からこちらを見下ろしているが、すぐに興味を失ったように鼻を鳴らした。まだ野山の深さを知らない足取りだと見抜かれたようだ。" + HINT_AVG
      ],
      lockStatMsgs: [
          "この辺りの空気は重く、毒素を含んでいる。今の貴方の体調では、彼女と共に森の深部へ踏み込むのは無謀だろう。" + getHintStat("health"),
          "「そんな青い顔してどうしたんだ？ 森を舐めるなよ。もっと体を鍛えてから出直してこい！」" + getHintStat("health")
      ],
      afterMsg: "エルナと共に森を駆け抜ける。彼女は貴方の足取りが自分に追いつくようになったことを誇らしげに笑い、そっと肩を寄せてきた。",
      chatMsg: "「よお！ 今日も森の調子はいいぜ。あんたも怪我すんなよ！」\nエルナは獲物を担ぎながら、元気に手を振って去っていった。"
    },
    { name: "シルフィエット", title: "令嬢", icon: "fa-book", file: "h04_sylphiette", progress: 0, affection: 0, 
      minAvg: [0, 5, 12, 20, 28],
      lockAvgMsgs: [
          "古城の窓辺に彼女がいたが、視線が合う前にカーテンを閉ざされてしまった。見知らぬ旅人を受け入れる準備が、まだ城にも彼女にもないようだ。" + HINT_AVG,
          "彼女の差し出した本が、貴方の手前で止まる。共通の話題、あるいはそれを語るに足る経験が、貴方の内側にまだ足りないのかもしれない。" + HINT_AVG
      ],
      lockStatMsgs: [
          "城を包む寂寥感が、貴方の心に冷たく浸食してくる。この静寂に耐えうるだけの強い精神を持たねば、彼女の孤独を分かち合うことはできない。" + getHintStat("mind"),
          "「……ごめんなさい。今の私の不安を、貴方に預けるのは酷だわ。まだ、心が追いつかないの」" + getHintStat("mind")
      ],
      afterMsg: "シルフィエットと一緒に書庫で過ごす。静謐な空気の中、めくられるページの音だけが響く。言葉はなくとも、心は深く通じ合っている。",
      chatMsg: "「……あ、こんにちは。いい本は見つかりましたか？」\nシルフィエットは伏せていた目を上げ、小さく会釈をしてくれた。"
    },
    { name: "マリーナ", title: "商人", icon: "fa-scale-balanced", file: "h05_marina", progress: 0, affection: 0, 
      minAvg: [0, 6, 14, 24, 32],
      lockAvgMsgs: [
          "活気に満ちた市場で彼女は忙しそうに指示を飛ばしている。一介の旅人に構う時間はないようで、こちらを向くことは一度もなかった。" + HINT_AVG,
          "商談の場に立ち会うことができたが、彼女の鋭い視線に気圧されてしまう。人間としての『格』が、まだ彼女と肩を並べるには至っていない。" + HINT_AVG
      ],
      lockStatMsgs: [
          "彼女の扱う品々はどれも一級品ばかりだ。今の貴方の懐事情では、彼女の興味を引くような投資も取引も到底叶いそうにない。" + getHintStat("money"),
          "「悪いけど、ビジネスは数字がすべてよ。今のあんたに賭けるのは、私の美学に反するわね」" + getHintStat("money")
      ],
      afterMsg: "マリーナと次なる商機の話を交わす。彼女は最高のパートナーを見つけたと満足げにワインを傾け、貴方の手腕に全幅の信頼を寄せてくれた。",
      chatMsg: "「あら、いい顔してるじゃない。商売敵にならないよう祈ってるわよ」\nマリーナは帳簿を閉じ、いたずらっぽくウインクをくれた。"
    },
    { name: "カタリナ", title: "騎士", icon: "fa-chess-knight", file: "h06_katarina", progress: 0, affection: 0, 
      minAvg: [0, 7, 15, 25, 33],
      lockAvgMsgs: [
          "要塞の中庭で剣を振るう彼女の姿があった。その鋭い打ち込みに、声をかける隙さえ見つけられず、ただ圧倒されるばかりだった。" + HINT_AVG,
          "模擬戦を申し込もうとしたが、彼女の冷徹な瞳に射抜かれ足が止まった。戦士としての歩みが、まだ彼女の想定する基準に達していない。" + HINT_AVG
      ],
      lockStatMsgs: [
          "カタリナの放つ剣気が空気を震わせている。今の貴方の肉体では、彼女の初太刀を受け止めることすら叶わず、命を散らすだけだろう。" + getHintStat("body"),
          "「軟弱な。その足取り、その筋肉……戦場に出れば一秒も持たぬぞ。鍛え直してこい」" + getHintStat("body")
      ],
      afterMsg: "カタリナと剣を合わせる。激しい打ち合いの後、彼女は清々しい顔で貴方の強さを称えた。背中を預け合える戦友としての絆を再確認した。",
      chatMsg: "「貴殿か。その立ち居振舞い、以前より磨きがかかったようだな」\nカタリナは剣を鞘に納め、武人としての敬意を示してくれた。"
    },
    { name: "エリスフェリア", title: "聖女", icon: "fa-hands-praying", file: "h07_elisferia", progress: 0, affection: 0, 
      minAvg: [0, 8, 18, 28, 36],
      lockAvgMsgs: [
          "祭壇で祈る彼女の背中が、今の自分にはあまりに遠く感じられた。聖域の清浄な空気に馴染むには、貴方の魂はまだ世俗に塗れすぎているのかもしれない。" + HINT_AVG,
          "彼女が貴方に向けて微笑んだが、その目はどこか遠くを見ている。救いを与える対象としては認識されていても、対等な道連れとしてはまだ遠い。" + HINT_AVG
      ],
      lockStatMsgs: [
          "聖堂の荘厳な静寂が、貴方の心の迷いを暴き立てる。揺るぎない精神の柱を持たねば、彼女の背負う重荷を共に担うことはできないだろう。" + getHintStat("mind"),
          "「……貴方の心には、まだ迷いの影が差しています。その暗がりを払拭せねば、光は届きません」" + getHintStat("mind")
      ],
      afterMsg: "エリスフェリアと共に祈りを捧げる。彼女は貴方の存在こそが自分の支えだと囁いた。神に導かれたのではなく、自らの意志で選んだ絆を感じた。",
      chatMsg: "「今日も光が貴方を守りますように。健やかな旅を」\nエリスフェリアは穏やかに微笑み、貴方の行く末に祝福を授けてくれた。"
    },
    { name: "レグリナ", title: "盗賊", icon: "fa-mask", file: "h08_legrina", progress: 0, affection: 0, 
      minAvg: [0, 5, 12, 22, 30],
      lockAvgMsgs: [
          "暗がりにレグリナの気配を感じたが、からかうような笑い声が遠ざかるだけだった。彼女の歩幅に追いつくには、まだ経験が浅すぎるようだ。" + HINT_AVG,
          "罠を仕掛けたのは彼女の方か、それとも貴方か。翻弄されるばかりで、彼女の本質を掴むには至らない。もっと海千山千の経験が必要だ。" + HINT_AVG
      ],
      lockStatMsgs: [
          "迷宮の仕掛けが、貴方の魔力探査を弾き飛ばした。彼女の足跡を追うには、もっと繊細で強固な魔力の扱いを覚える必要がありそうだ。" + getHintStat("magic"),
          "「あはは！ そんなにスキだらけじゃ迷宮の餌食だよ。もっと鋭くなってからアタイを捕まえてみな！」" + getHintStat("magic")
      ],
      afterMsg: "レグリナと共に闇夜を駆け抜ける。悪戯っぽく笑う彼女は、もう二度と貴方の手を離すつもりはないようだ。世界中を翻弄する旅が続く。",
      chatMsg: "「しししっ、また会ったね！ お宝は見つかったかい？」\nレグリナは屋根の上から軽やかに声をかけ、風のように去っていった。"
    },
    { name: "ゼファー", title: "舞巫女", icon: "fa-wand-magic-sparkles", file: "h09_zephyr", progress: 0, affection: 0, 
      minAvg: [0, 4, 12, 20, 28],
      lockAvgMsgs: [
          "ゼファーの舞う鈴の音が風に乗って聞こえてきた。だが、砂嵐が貴方と彼女の距離を阻んでいる。荒野を渡りきる知恵と経験が、まだ足りていない。" + HINT_AVG,
          "砂漠の夜、彼女が焚き火の向こうで踊っている。だが、貴方がその輪に加わることを風が許さない。魂の練度が、まだ彼女の舞に届いていない。" + HINT_AVG
      ],
      lockStatMsgs: [
          "荒野を旅するには、何よりも準備と資産が重要だ。今の貴方の手持ちでは、彼女を目的地まで護衛しきることなど夢のまた夢だろう。" + getHintStat("money"),
          "「風が言っているわ……貴方はまだ、荒野を渡る覚悟ができていないって。もっと自分を整えて」" + getHintStat("money")
      ],
      afterMsg: "ゼファーの舞を特等席で眺める。彼女は貴方の瞳の中に新しい風を見たと言い、感謝を込めた口づけを風に乗せて送ってくれた。",
      chatMsg: "「いい風が吹いているわね。貴方の旅に、精霊の加護があらんことを」\nゼファーは優雅な一礼を捧げ、砂の向こうへと歩みを進めた。"
    },
    { name: "ネクロア", title: "亡霊", icon: "fa-skull", file: "h10_necroa", progress: 0, affection: 0, 
      minAvg: [0, 9, 19, 29, 38],
      lockAvgMsgs: [
          "古びた墓碑の傍らで、透き通った少女が泣いている。声をかけようとしたが、指先は虚空をすり抜けた。存在を認識させるには、貴方の命の輝きがまだ弱すぎる。" + HINT_AVG,
          "彼女の瞳に貴方が映った気がしたが、すぐに霧のように霧散してしまった。彼女をこの世に繋ぎ止めるだけの『物語』が、貴方にはまだ備わっていない。" + HINT_AVG
      ],
      lockStatMsgs: [
          "死者の眠る地で、名もなき旅人が消えていく。彼女を呼び戻すには、世界を揺るがすほどの『名声』という名の楔が必要なようだ。" + getHintStat("fame"),
          "「……冷たいわね。貴方の魂。もっと強く、世界に響くような存在にならないと、アタシ、消えちゃうわ」" + getHintStat("fame")
      ],
      afterMsg: "ネクロアと月光の下で語り合う。彼女の体はもう透き通っていない。貴方が与えた『温もり』が、彼女をこの世に留める楔となっている。",
      chatMsg: "「……あ、貴方。アタシのこと、見えてるのね」\nネクロアは寂しげな墓地で、少しだけ嬉しそうに目を細めてくれた。"
    },
    { name: "メルル", title: "闘士", icon: "fa-hand-fist", file: "h11_merle", progress: 0, affection: 0, 
      minAvg: [0, 5, 13, 23, 31],
      lockAvgMsgs: [
          "リングの上で喝采を浴びる彼女の姿が見えた。だが、観客の一人に過ぎない貴方の存在は、彼女の闘争心を欠片も刺激しなかったようだ。" + HINT_AVG,
          "メルルの拳が貴方の鼻先で止まる。その威力に気圧され、反撃の一歩が踏み出せない。実戦経験の差が、圧倒的な壁となって立ちはだかっている。" + HINT_AVG
      ],
      lockStatMsgs: [
          "彼女の筋肉は鋼のように鍛え上げられている。今の貴方の細腕では、全力の拳を叩き込んだとしても、彼女を満足させることはできないだろう。" + getHintStat("body"),
          "「ハハッ！ そんな細腕で私に挑むのかい？ 笑わせるな、出直してきな！」" + getHintStat("body")
      ],
      afterMsg: "メルルと共に祝杯を挙げる。彼女は貴方を「唯一自分を震わせた男」と呼び、熱烈なハグで迎えてくれた。闘いの後の静かな熱情が心地よい。",
      chatMsg: "「おっ、いい筋肉になってきたじゃないか！ 今度また稽古つけてやるよ」\nメルルは快活に笑い、貴方の肩を力強く叩いて去っていった。"
    },
    { name: "エルヴィーラ", title: "薬師", icon: "fa-flask-vial", file: "h12_elvira", progress: 0, affection: 0, 
      minAvg: [0, 7, 15, 25, 34],
      lockAvgMsgs: [
          "エルヴィーラは眼鏡を直し、貴方の全身を分析するように見つめた。だが、すぐに興味を失ったように薬草の調合に戻ってしまった。サンプルとしての面白みがないようだ。" + HINT_AVG,
          "彼女の実験を手伝おうとしたが、手際の悪さを鋭い視線で指摘された。薬師の助手として、あるいはパートナーとして、まだ経験が追いついていない。" + HINT_AVG
      ],
      lockStatMsgs: [
          "新薬の試作には、被験者の強靭な生命力が必要だ。今の貴方の虚弱な数値では、治療どころか毒見にさえ耐えられないだろう。" + getHintStat("health"),
          "「今の貴方の数値……ええ、『至極平凡』ね。私の時間を奪う価値はないわ、出直しなさい」" + getHintStat("health")
      ],
      afterMsg: "エルヴィーラと共に新しい薬草の研究に没頭する。彼女は毒舌を吐きながらも、貴方の体調を誰よりも気遣う慈しみを見せるようになった。",
      chatMsg: "「不摂生は万病の元よ。せいぜい長生きしてちょうだい」\nエルヴィーラは毒づきながらも、栄養価の高い薬草茶を差し出してくれた。"
    }
];

const scenarios = [
    { name: "王都", icon: "fa-city", file: "e01_royal_city", zoom: 2.2, security: 5, economy: 5 },
    { name: "賢者の塔", icon: "fa-tower-observation", file: "e02_sage_tower", zoom: 2.8, security: 4, economy: 2 },
    { name: "辺境の村", icon: "fa-house-chimney", file: "e03_frontier_village", zoom: 2.5, security: 2, economy: 1 },
    { name: "忘れられた古城", icon: "fa-landmark", file: "e04_old_castle", zoom: 2.5, security: 1, economy: 1 },
    { name: "賑わいの港町", icon: "fa-ship", file: "e05_port_town", zoom: 2.2, security: 3, economy: 5 },
    { name: "巨岩の要塞", icon: "fa-chess-rook", file: "e06_fortress", zoom: 2.3, security: 5, economy: 2 },
    { name: "静謐な修道院", icon: "fa-church", file: "e07_monastery", zoom: 2.5, security: 4, economy: 2 },
    { name: "迷宮の入り口", icon: "fa-dungeon", file: "e08_dungeon_gate", zoom: 2.6, security: 2, economy: 1 },
    { name: "真鍮の荒野", icon: "fa-mountain-sun", file: "e09_brass_desert", zoom: 2.3, security: 2, economy: 4 },
    { name: "太古の墓地", icon: "fa-monument", file: "e10_ancient_cemetery", zoom: 2.5, security: 1, economy: 1 },
    { name: "喧騒の闘技場", icon: "fa-khanda", file: "e11_arena", zoom: 2.4, security: 3, economy: 3 },
    { name: "緑の隠れ里", icon: "fa-leaf", file: "e12_hidden_village", zoom: 2.6, security: 4, economy: 2 }
];

const spotAssignments = [
    {l:56, t:42, main:'fame',  sub:'money'},
    {l:87, t:19, main:'magic', sub:'mind'},
    {l:79, t:88, main:'health',sub:'body'},
    {l:88, t:70, main:'mind',  sub:'magic'},
    {l:8, t:64, main:'money', sub:'fame'},
    {l:10, t:10, main:'body',  sub:'health'},
    {l:72, t:55, main:'mind',  sub:'health'},
    {l:61.5, t:10.5, main:'magic', sub:'body'},
    {l:62, t:85, main:'money', sub:'mind'},
    {l:38, t:23, main:'fame',  sub:'magic'},
    {l:34, t:80, main:'body',  sub:'fame'},
    {l:22, t:20, main:'health',sub:'money'}
];