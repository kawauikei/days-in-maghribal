/* --- ステータス定義 --- */
const statConfig = {
    health: { name: "健康", icon: "fa-heart-pulse" },
    body:   { name: "肉体", icon: "fa-dumbbell" },
    mind:   { name: "精神", icon: "fa-brain" },
    magic:  { name: "魔力", icon: "fa-wand-sparkles" },
    fame:   { name: "名声", icon: "fa-medal" },
    money:  { name: "資産", icon: "fa-coins" }
};
const statKeys = Object.keys(statConfig);

/* --- ヒロイン設定（テキストは heroine_events.json へ） --- */
const heroines = [
    { name: "シェラ", title: "王女", icon: "fa-crown", progress: 0, affection: 0, events: [] },
    { name: "ルルリス", title: "魔女", icon: "fa-moon", progress: 0, affection: 0, events: [] },
    { name: "エイラ", title: "狩人", icon: "fa-paw", progress: 0, affection: 0, events: [] },
    { name: "シルフィエット", title: "令嬢", icon: "fa-book", progress: 0, affection: 0, events: [] },
    { name: "マニ", title: "商人", icon: "fa-scale-balanced", progress: 0, affection: 0, events: [] },
    { name: "カタリナ", title: "騎士", icon: "fa-chess-knight", progress: 0, affection: 0, events: [] },
    { name: "セシリア", title: "聖女", icon: "fa-hands-praying", progress: 0, affection: 0, events: [] },
    { name: "ナディア", title: "盗賊", icon: "fa-mask", progress: 0, affection: 0, events: [] },
    { name: "ザフィラ", title: "舞巫女", icon: "fa-wand-magic-sparkles", progress: 0, affection: 0, events: [] },
    { name: "ヘルマ", title: "亡霊", icon: "fa-skull", progress: 0, affection: 0, events: [] },
    { name: "ヴァルキ", title: "闘士", icon: "fa-hand-fist", progress: 0, affection: 0, events: [] },
    { name: "リヴィア", title: "薬師", icon: "fa-flask-vial", progress: 0, affection: 0, events: [] }
];

/* --- シナリオ設定 --- */
const scenarios = [
    { name: "王都", icon: "fa-city", zoom: 2.2, security: 5, economy: 5, baseChanges: { fame: 3, money: 1, mind: -1 }, events: {} },
    { name: "賢者の塔", icon: "fa-tower-observation", zoom: 2.8, security: 4, economy: 2, baseChanges: { magic: 3, mind: 1, body: -1 }, events: {} },
    { name: "辺境の村", icon: "fa-house-chimney", zoom: 2.5, security: 2, economy: 1, baseChanges: { health: 3, body: 1, fame: -1 }, events: {} },
    { name: "忘れられた古城", icon: "fa-landmark", zoom: 2.5, security: 1, economy: 1, baseChanges: { mind: 3, magic: 1, health: -1 }, events: {} },
    { name: "賑わいの港町", icon: "fa-ship", zoom: 2.2, security: 3, economy: 5, baseChanges: { money: 3, fame: 1, magic: -1 }, events: {} },
    { name: "巨岩の要塞", icon: "fa-chess-rook", zoom: 2.3, security: 5, economy: 2, baseChanges: { body: 3, health: 1, money: -1 }, events: {} },
    { name: "静謐な修道院", icon: "fa-church", zoom: 2.5, security: 4, economy: 2, baseChanges: { mind: 3, health: 1, body: -1 }, events: {} },
    { name: "迷宮の入り口", icon: "fa-dungeon", zoom: 2.6, security: 2, economy: 1, baseChanges: { magic: 3, body: 1, health: -1 }, events: {} },
    { name: "真鍮の荒野", icon: "fa-mountain-sun", zoom: 2.3, security: 2, economy: 4, baseChanges: { money: 3, mind: 1, health: -1 }, events: {} },
    { name: "太古の墓地", icon: "fa-monument", zoom: 2.5, security: 1, economy: 1, baseChanges: { fame: 3, magic: 1, mind: -1 }, events: {} },
    { name: "喧騒の闘技場", icon: "fa-khanda", zoom: 2.4, security: 3, economy: 3, baseChanges: { body: 3, fame: 1, money: -1 }, events: {} },
    { name: "緑の隠れ里", icon: "fa-leaf", zoom: 2.6, security: 4, economy: 2, baseChanges: { health: 3, money: 1, fame: -1 }, events: {} }
];

/* --- 座標データ --- */
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