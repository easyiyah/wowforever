/* =========================================================================
   Forever Talents 双语版 —— 界面 / 种族特长 / 公共词条 中文数据
   UI chrome, racials and shared tooltip vocabulary (EN -> ZH).
   Loaded after talents.js and racials.js; consumed by app.js.
   ========================================================================= */
window.FT_I18N = {

  /* ---------------- 职业名 class names ---------------- */
  classes: {
    Warrior: "战士", Paladin: "圣骑士", Hunter: "猎人", Rogue: "潜行者",
    Priest: "牧师", Shaman: "萨满祭司", Mage: "法师", Warlock: "术士", Druid: "德鲁伊"
  },

  /* ---------------- 天赋树名 tree names ---------------- */
  trees: {
    "Arms": "武器", "Fury": "狂暴", "Protection": "防护",
    "Holy": "神圣", "Retribution": "惩戒",
    "Beast Mastery": "野兽控制", "Marksmanship": "射击", "Survival": "生存",
    "Assassination": "刺杀", "Combat": "战斗", "Subtlety": "敏锐",
    "Discipline": "戒律", "Shadow Magic": "暗影魔法",
    "Elemental Combat": "元素战斗", "Enhancement": "增强", "Restoration": "恢复",
    "Arcane": "奥术", "Fire": "火焰", "Frost": "冰霜",
    "Affliction": "痛苦", "Demonology": "恶魔学识", "Destruction": "毁灭",
    "Balance": "平衡", "Feral Combat": "野性战斗"
  },

  /* ---------------- 界面文案 UI strings ---------------- */
  ui: {
    title:        { zh: "永久服天赋模拟器",        en: "Forever Talents" },
    subtitle:     { zh: "魔兽世界经典旧世「永久服」天赋计算器。天赋文本取自游戏内悬浮提示；图标与背景图来自 Wowhead 的经典旧世素材。",
                    en: "WoW Classic Forever talent calculator. Talent text comes from in-game tooltips; icons and art are Wowhead's classic assets." },

    classesLabel: { zh: "职业",      en: "Class" },
    level:        { zh: "等级",      en: "Level" },
    maxLevel:     { zh: "满级（60）", en: "Max (60)" },
    reset:        { zh: "重置",      en: "Reset" },
    compare:      { zh: "与原版经典旧世对照", en: "Compare with Classic" },
    compareTip:   { zh: "高亮显示与原始经典旧世天赋树相比有改动的地方", en: "Highlight what changed versus the original Classic trees" },

    talents:      { zh: "天赋",      en: "Talents" },
    pointsLeft:   { zh: "剩余点数",  en: "Points left" },
    levelNeeded:  { zh: "需要等级",  en: "Level needed" },

    legNew:       { zh: "永久服新增",                     en: "New in Forever" },
    legChanged:   { zh: "有改动（文本、等级或位置）",     en: "Changed (text, ranks or position)" },
    legMoved:     { zh: "位置变动，效果相同",             en: "Moved, same effect" },
    legSame:      { zh: "变暗 ＝ 与经典旧世相同",         en: "Dimmed = unchanged from Classic" },
    legNote:      { zh: "每个悬浮提示里都会附上经典旧世原文；被移除的经典旧世天赋列在各天赋树下方。",
                    en: "Classic text appears in each tooltip; removed Classic talents are listed under each tree." },

    racials:      { zh: "种族特长",  en: "Racials" },
    showAllRaces: { zh: "显示不能成为", en: "Show races that can't be" },
    thisClass:    { zh: "该职业",    en: "this class" },
    raceCount:    { zh: "{n} / {t} 个种族", en: "{n} of {t} races" },

    help: [
      { zh: "左键加一点，右键（或 Shift＋左键）减一点。和游戏一样，每一行都需要在该天赋树中再投入 5 点。箭头表示该天赋需要上方天赋达到满级。",
        en: "Left-click adds a point, right-click (or Shift+click) removes one. Every row needs 5 more points in that tree, same as the game. Arrows mark talents that need the talent above at max rank." },
      { zh: "视频里只看到一级的天赋，其更高等级数值由程序按比例推算，并已标注为估算值。",
        en: "Where only one rank was visible in the video, higher ranks are estimated and marked as such." },
      { zh: "发现数字或箭头有误？所有天赋都是从视频里人工读取的，难免出错。把职业、天赋名和正确数值发来即可修正。",
        en: "Spotted a wrong number or arrow? Every talent was read from video, so mistakes are possible. Send the class, talent and correction and it gets fixed." }
    ],
    source:       { zh: "天赋文本转录自游戏内悬浮提示视频（{file}）。", en: "Talent text transcribed from in-game tooltip video ({file})." },

    noVideo:      { zh: "该职业暂无悬浮提示视频", en: "No tooltip video for this class yet" },
    treeEmpty:    { zh: "尚未采集到「{tree}」的悬浮提示。录制该天赋树后即可填充。", en: "No {tree} tooltips captured yet. Record this tree and it fills in." },
    resetTree:    { zh: "重置「{tree}」", en: "Reset {tree}" },
    removedTitle: { zh: "经典旧世中被移除", en: "Removed from Classic" },

    rank:         { zh: "等级 {r}/{m}", en: "Rank {r}/{m}" },
    passive:      { zh: "被动",      en: "Passive" },
    nextRank:     { zh: "下一级：",  en: "Next rank:" },
    estimated:    { zh: "第 {r} 级的数值由视频中出现的等级推算而来。", en: "Rank {r} value estimated from the rank shown in the video." },
    clickLearn:   { zh: "点击学习",   en: "Click to learn" },
    maxRank:      { zh: "已达最高等级", en: "Max rank" },
    noPoints:     { zh: "没有可用的天赋点", en: "No unspent talent points" },

    clNew:        { zh: "永久服新增。经典旧世没有同名天赋。", en: "New in Forever. No Classic talent with this name." },
    clSame:       { zh: "与经典旧世相同。", en: "Same as Classic." },
    clMoved:      { zh: "位置变动，效果相同。", en: "Moved, same effect." },
    clChanged:    { zh: "与经典旧世相比有改动。", en: "Changed from Classic." },
    clWasPos:     { zh: "原为{tree}第 {row} 行第 {col} 列。", en: "Was {tree} row {row}, column {col}." },
    clWasMax:     { zh: "原为 {max} 级。", en: "Was {max} rank(s)." },
    clRank1:      { zh: "经典旧世 1 级：{text}", en: "Classic rank 1: {text}" },

    unlearn:      { zh: "− 取消学习", en: "− Unlearn" },
    learn:        { zh: "＋ 学习",    en: "+ Learn" },
    close:        { zh: "关闭",      en: "Close" },

    dependsOn:    { zh: "有其他天赋依赖这一点", en: "Other talents depend on this point" },

    reqTreePts:   { zh: "需要在「{tree}」天赋中投入 {n} 点", en: "Requires {n} points in {tree} Talents" },
    reqTalentPts: { zh: "需要「{talent}」达到 {n} 点", en: "Requires {n} point(s) in {talent}" }
  },

  /* ---------------- 法术消耗 / 需求 cost & requirement lines ---------------- */
  costWords: {
    "Melee Range": "近战范围",
    "Instant": "瞬发",
    "Channeled": "引导",
    "1 to 5 Combo Points": "1 到 5 点连击点数",
    "Water Totem": "水之图腾",
    "Soul Shard": "灵魂碎片",
    "Cat": "猎豹形态",
    "Bear": "熊形态",
    "Feral Charge": "野性冲锋"
  },
  costUnits: { Rage: "怒气", Mana: "法力值", Energy: "能量" },
  reqText: {
    "Requires Battle Stance": "需要战斗姿态",
    "Requires Defensive Stance": "需要防御姿态",
    "Requires Shields": "需要盾牌",
    "Requires Level 40": "需要等级 40",
    "Requires Bear Form, Dire Bear Form": "需要熊形态、巨熊形态",
    "Requires Cat Form, Bear Form, Dire Bear Form": "需要猎豹形态、熊形态、巨熊形态",
    "Requires Bear Form, Dire Bear Form (bear part); Requires Cat Form (cat part)":
      "需要熊形态、巨熊形态（熊形态部分）；需要猎豹形态（猎豹形态部分）"
  },

  /* 三处视频裁切说明 note fields */
  notes: {
    "Right edge of this tooltip was cut off in the video; \"and\" and \"%\" are inferred.":
      "该悬浮提示的右边缘在视频中被裁掉；\"and\" 与 \"%\" 为推断内容。",
    "Tooltip edge was cut off in the video; \"chance of\" is inferred.":
      "悬浮提示的边缘在视频中被裁掉；\"chance of\" 为推断内容。",
    "Right edge of this tooltip was clipped in the video; a couple of word endings are inferred.":
      "该悬浮提示的右边缘在视频中被截断；若干词尾为推断内容。"
  },

  /* 视频来源文件名 class -> 原视频数据文件 */
  sourceFile: {
    Warrior: "warrior.json", Paladin: "paladin.json", Hunter: "hunter.json",
    Rogue: "rogue.json", Priest: "priest.json", Shaman: "shaman.json",
    Mage: "mage.json", Warlock: "warlock.json", Druid: "druid.json"
  },

  /* ---------------- 种族特长 racials ---------------- */
  factions: { Horde: "部落", Alliance: "联盟" },
  racialsZH: {
    "Horde": [
      { race: "兽人", classes: ["战士", "猎人", "法师", "潜行者", "术士", "萨满祭司"], abilities: [
        ["血性狂怒", "攻击强度与法术强度提高 10%，持续 15 秒。"],
        ["碎咒", "免疫诅咒与灾祸；受到的魔法伤害降低，持续 8 秒。"],
        ["斧类武器专精", "法术与技能的爆击几率提高 1%。"],
        ["坚韧", "昏迷持续时间缩短 20%。"]
      ]},
      { race: "亡灵", classes: ["战士", "法师", "潜行者", "牧师", "术士", "圣骑士"], abilities: [
        ["亡灵意志", "移除魅惑、恐惧和睡眠效果。（不再是免疫效果。）"],
        ["食尸", "从尸体上恢复 35% 的生命值和法力值。"],
        ["水下呼吸", "水下呼吸时间延长 300%。"],
        ["坟墓之触", "攻击时有时会吸取生命。"]
      ]},
      { race: "牛头人", classes: ["战士", "猎人", "德鲁伊", "萨满祭司"], abilities: [
        ["战争践踏", "使附近的敌人昏迷 2 秒。"],
        ["栽培", "无需草药学专业技能也能获得额外草药。"],
        ["平原奔跑", "移动时移动速度提高。"],
        ["耐久", "生命值总量提高 5%，命中几率提高 1%。"]
      ]},
      { race: "巨魔", classes: ["战士", "猎人", "法师", "潜行者", "牧师", "术士", "萨满祭司"], abilities: [
        ["狂暴", "攻击速度与施法速度提高 10%，持续 10 秒。"],
        ["快速再生", "在一段时间内恢复 50% 的最大生命值。"],
        ["野兽杀手", "对野兽造成的伤害提高 5%。"],
        ["再生", "战斗中仍保留 10% 的生命回复速度。"]
      ]},
      { race: "天裔", classes: ["战士", "猎人", "潜行者", "德鲁伊", "萨满祭司"], abilities: [
        ["踏空而行", "在空中向下滑翔 10 秒。"],
        ["天视", "获得元素祝福，移动速度提高 10%。"],
        ["风之赐福", "被动。近战、远程与施法急速提高 1%。"],
        ["元素洞察", "被动。对元素生物造成的伤害提高 5%。"]
      ]}
    ],
    "Alliance": [
      { race: "人类", classes: ["战士", "猎人", "法师", "潜行者", "牧师", "术士", "圣骑士"], abilities: [
        ["求生意志", "移除昏迷效果。"],
        ["感知", "侦测潜行，持续 20 秒。"],
        ["剑类武器专精", "法术与技能的爆击几率提高 2%。"],
        ["人类精魂", "精神提高 5%。"]
      ]},
      { race: "矮人", classes: ["战士", "猎人", "潜行者", "牧师", "圣骑士", "萨满祭司"], abilities: [
        ["石像形态", "免疫流血、中毒和疾病；受到的物理伤害降低，持续 8 秒。"],
        ["寻找宝藏", "追踪宝箱。"],
        ["锤类武器专精", "法术与技能的爆击几率提高 1%。"],
        ["大型猎物猎人", "对野兽造成的伤害提高 5%。"]
      ]},
      { race: "暗夜精灵", classes: ["战士", "猎人", "潜行者", "牧师", "德鲁伊"], abilities: [
        ["艾露恩之光", "爆击几率提高 10%，持续 15 秒。"],
        ["影遁", "静止不动时进入潜行状态。"],
        ["迅捷", "闪避几率提高 1%，移动速度提高 2%。"],
        ["精灵之魂", "死亡后移动速度提高 75%。"]
      ]},
      { race: "侏儒", classes: ["战士", "法师", "潜行者", "牧师", "术士"], abilities: [
        ["逃脱大师", "短时间内免疫定身与减速效果。"],
        ["找到了！", "接下来 3 个技能的消耗降低，造成的伤害或治疗效果提高 10%。"],
        ["开阔思维", "法力值、怒气与能量提高 5%。"],
        ["工程学专精", "工程学装置更加可靠。"]
      ]},
      { race: "天裔·高阶", classes: ["战士", "猎人", "法师", "潜行者", "德鲁伊"], abilities: [
        ["踏空而行", "在空中向下滑翔 10 秒。"],
        ["读取魔网", "激活一条魔网，生命值与法力值的回复速度提高 100%。"],
        ["风之赐福", "被动。近战、远程与施法急速提高 1%。"],
        ["元素洞察", "被动。对元素生物造成的伤害提高 5%。"]
      ]}
    ]
  }
};
