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

const scenarios = [
    { name: "六角の王都", icon: "fa-city", file: "e01_royal_city", zoom: 2.2, security: 5, economy: 5 },
    { name: "賢者の塔", icon: "fa-tower-observation", file: "e02_sage_tower", zoom: 2.8, security: 4, economy: 2 },
    { name: "辺境の村", icon: "fa-house-chimney", file: "e03_frontier_village", zoom: 2.5, security: 2, economy: 1 },
    { name: "忘れられた古城", icon: "fa-landmark", file: "e04_old_castle", zoom: 2.5, security: 1, economy: 1 },
    { name: "賑わいの港町", icon: "fa-ship", file: "e05_port_town", zoom: 2.2, security: 3, economy: 5 },
    { name: "巨岩の要塞", icon: "fa-chess-rook", file: "e06_fortress", zoom: 2.3, security: 5, economy: 2 },
    { name: "静謐の聖堂", icon: "fa-church", file: "e07_monastery", zoom: 2.5, security: 4, economy: 2 },
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