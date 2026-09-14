/* =========================================================================
   Forever Talents 双语对照版 —— 主程序 / main app
   A bilingual (简体中文 + English) rebuild of the Forever 60-level talent
   calculator. Same layout, same rules and same values as the original site;
   every piece of text is shown in both languages. Local-only edition: the
   share/copy-link feature of the original site is intentionally not included.
   ========================================================================= */
(function () {
  "use strict";

  var DATA = window.TALENT_DATA, ZH = window.TALENT_ZH || {}, I18N = window.FT_I18N;
  var CLASSES = Object.keys(DATA);
  var ROWS = 7;

  /* ---- 素材地址 assets ----
     默认走本地 icons/ 与 bg/（由 build/fetch-assets.mjs 抓下来，可完全离线）。
     本地文件缺失时自动回退到 Wowhead 在线素材。                          */
  var REMOTE_ICON = "https://wow.zamimg.com/images/wow/icons/large/";
  var REMOTE_BG = "https://wow.zamimg.com/images/wow/talents/backgrounds/classic/";
  var ASSETS = window.FT_ASSETS || { icon: REMOTE_ICON, bg: REMOTE_BG };
  var ICON = function (n) { return ASSETS.icon + n + ".jpg"; };
  var BG = function (id) { return ASSETS.bg + id + ".jpg"; };
  var $ = function (s) { return document.querySelector(s); };

  /* 本地图标取不到就换在线地址，再取不到就露出中文占位字 */
  window.FT_ICON_FAIL = function (img, name) {
    if (img.getAttribute("data-fb") !== "1" && ASSETS.icon !== REMOTE_ICON) {
      img.setAttribute("data-fb", "1");
      img.src = REMOTE_ICON + name + ".jpg";
    } else {
      img.remove();
    }
  };
  var bgProbed = {}, bgFailed = {};
  function setBg(el, id) {
    el.style.backgroundImage = "url('" + (bgFailed[id] ? REMOTE_BG : ASSETS.bg) + id + ".jpg')";
    if (ASSETS.bg === REMOTE_BG || bgProbed[id]) return;
    bgProbed[id] = 1;
    var probe = new Image();
    probe.onerror = function () {
      bgFailed[id] = 1;
      var url = "url('" + REMOTE_BG + id + ".jpg')";
      [].forEach.call(document.querySelectorAll(".tbody, .banner"), function (e) {
        if (e.style.backgroundImage.indexOf(id) >= 0) e.style.backgroundImage = url;
      });
    };
    probe.src = BG(id);
  }

  /* ================================================================== *
   *  1. 语言层 language layer
   * ================================================================== */
  var LANGS = ["both", "zh", "en"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fill(s, vars) {
    if (!vars) return s;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] === undefined || vars[k] === null ? m : String(vars[k]);
    });
  }
  /* 源数据里混进了 DBC 的 HTML（<br>、颜色 span、<!--pl…--> 注释）。
     原站是直接 innerHTML 渲染的；这里统一转成纯文本，中英两边排版才一致。 */
  var plainCache = {};
  function plainText(s) {
    if (s == null) return s;
    if (plainCache[s] !== undefined) return plainCache[s];
    var out = String(s)
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .trim();
    plainCache[s] = out;
    return out;
  }
  /* 从 I18N.ui 取一条文案并填充占位符 -> {zh, en} */
  function U(key, vars) { var o = I18N.ui[key]; return { zh: fill(o.zh, vars), en: fill(o.en, vars) }; }

  /* 双语成对渲染。默认 block（两行），传 "inl" 则同行显示（中文在前，英文小字在后）。
     显隐完全由 body.lang-* 控制，切换语言无需重绘。 */
  function pair(o, mode) {
    var zh = o && o.zh != null ? o.zh : "", en = o && o.en != null ? o.en : "";
    return '<span class="pr ' + (mode || "block") + '"><span class="zh">' + esc(zh) +
           '</span><span class="en">' + esc(en) + "</span></span>";
  }
  function duo(zh, en, mode) { return pair({ zh: zh, en: en }, mode); }

  function applyLang() {
    document.body.classList.remove("lang-both", "lang-zh", "lang-en");
    document.body.classList.add("lang-" + state.lang);
    try { localStorage.setItem("ft-lang", state.lang); } catch { /* 隐私模式下可能被禁 */ }
  }

  /* ================================================================== *
   *  2. 中文数据访问 zh data accessors
   * ================================================================== */
  var zhClass = function (c) { return I18N.classes[c] || c; };
  function zhTreeName(cls, ti) {
    var z = ZH[cls];
    if (z && z.trees[ti] && z.trees[ti].name) return z.trees[ti].name;
    return I18N.trees[DATA[cls].trees[ti].name] || DATA[cls].trees[ti].name;
  }
  function zhTal(cls, ti, i) { var z = ZH[cls]; return (z && z.trees[ti] && z.trees[ti].talents[i]) || null; }
  function zhRemoved(cls, ti, i) { var z = ZH[cls]; return (z && z.trees[ti] && z.trees[ti].removed[i]) || null; }

  /* 法术消耗行 EN -> ZH（按 “|” / “;” 切段逐段翻译） */
  function zhCost(s) {
    if (!s) return null;
    return String(s).split(/\s*[|;]\s*/).map(function (seg) {
      var m;
      if ((m = /^(\d+)\s+(Rage|Mana|Energy)$/.exec(seg))) return m[1] + " " + I18N.costUnits[m[2]];
      if ((m = /^(\d+(?:\.\d+)?)\s*sec cooldown$/.exec(seg))) return m[1] + " 秒冷却";
      if ((m = /^(\d+(?:\.\d+)?)\s*min cooldown$/.exec(seg))) return m[1] + " 分钟冷却";
      if ((m = /^(\d+(?:\.\d+)?)\s*sec cast$/.exec(seg))) return m[1] + " 秒施法";
      if ((m = /^(\d+(?:-\d+)?)\s*yd range$/.exec(seg))) return m[1] + " 码";
      if ((m = /^Enemy:\s*(.+)$/.exec(seg))) return "敌人：" + zhCost(m[1]);
      if ((m = /^Friendly:\s*(.+)$/.exec(seg))) return "友方：" + zhCost(m[1]);
      if ((m = /^Tools:\s*(.+)$/.exec(seg))) return "工具：" + (I18N.costWords[m[1]] || m[1]);
      if ((m = /^Reagents:\s*(.+)$/.exec(seg))) return "材料：" + (I18N.costWords[m[1]] || m[1]);
      if ((m = /^(.+?)\s*\((.+?)\):\s*(.+)$/.exec(seg)))
        return (I18N.costWords[m[1]] || m[1]) + "（" + (I18N.costWords[m[2]] || m[2]) + "）：" + zhCost(m[3]);
      return I18N.costWords[seg] || seg;
    }).join(" | ");
  }
  function zhReqText(s) { return s ? (I18N.reqText[s] || s) : null; }

  /* ================================================================== *
   *  3. 等级文本 rank text
   * ================================================================== */
  function scaleText(text, from, to) {
    return text.replace(/(\bby (?:an additional )?|\ba |\ban additional |\bup to )?(\d+(?:\.\d+)?)(%)?/g,
      function (m, pre, num, pct) {
        if (!pct && !/\./.test(num) && !(pre && /^by/.test(pre))) return m;
        var v = parseFloat(num) * to / from;
        var out = Number.isInteger(v) ? String(v) : (Math.round(v * 10) / 10).toFixed(1);
        return (pre || "") + out + (pct || "");
      });
  }
  function rankTextEN(t, r) {
    if (r < 1) return null;
    if (Array.isArray(t.desc)) return { text: t.desc[Math.min(r, t.desc.length) - 1], est: false };
    var known = Object.keys(t.desc).map(Number).sort(function (a, b) { return a - b; });
    if (t.desc[r]) return { text: t.desc[r], est: false };
    var base = known.reduce(function (b, k) { return Math.abs(k - r) < Math.abs(b - r) ? k : b; }, known[0]);
    return { text: scaleText(t.desc[base], base, r), est: true };
  }
  /* -> {zh, en, est}；中文各等级文本在构建时已全部预生成 */
  function rankText(cls, ti, i, r) {
    if (r < 1) return null;
    var t = DATA[cls].trees[ti].talents[i];
    var e = rankTextEN(t, r);
    var z = zhTal(cls, ti, i);
    var zt = (z && z.ranks && z.ranks.length) ? z.ranks[Math.min(r, z.ranks.length) - 1] : null;
    return { en: plainText(e.text), zh: plainText(zt) || plainText(e.text), est: e.est };
  }

  /* ================================================================== *
   *  4. 状态与规则 state & rules（规则与原站完全一致）
   * ================================================================== */
  var state = {
    cls: CLASSES.filter(function (c) {
      return DATA[c].trees.some(function (t) { return t.talents.length; });
    })[0] || CLASSES[0],
    race: null,            /* 用户勾选的种族（右栏面板跟随）；null=默认第一个可选种族 */
    level: 60,
    lang: "both",
    ranks: {}
  };
  try {
    var savedLang = localStorage.getItem("ft-lang");
    if (LANGS.indexOf(savedLang) >= 0) state.lang = savedLang;
  } catch { /* 隐私模式下可能被禁，用默认值 */ }

  var ranksFor = function (cls) {
    return state.ranks[cls] || (state.ranks[cls] = DATA[cls].trees.map(function (t) {
      return t.talents.map(function () { return 0; });
    }));
  };
  var pool = function () { return Math.max(0, state.level - 9); };
  var treePts = function (cls, ti) { return ranksFor(cls)[ti].reduce(function (a, b) { return a + b; }, 0); };
  var totalPts = function (cls) {
    return DATA[cls].trees.reduce(function (a, _, i) { return a + treePts(cls, i); }, 0);
  };
  var above = function (cls, ti, tier) {
    return DATA[cls].trees[ti].talents.reduce(function (a, t, i) {
      return a + (t.row < tier ? ranksFor(cls)[ti][i] : 0);
    }, 0);
  };
  var idx = function (tree, name) { return tree.talents.findIndex(function (t) { return t.name === name; }); };

  function gate(cls, ti, i) {
    var tree = DATA[cls].trees[ti], t = tree.talents[i], r = ranksFor(cls)[ti];
    var need = (t.row - 1) * 5;
    if (above(cls, ti, t.row) < need) return U("reqTreePts", { n: need, tree: zhTreeName(cls, ti) });
    if (t.req) {
      var p = idx(tree, t.req);
      if (p >= 0 && r[p] < tree.talents[p].max) {
        var zn = zhTal(cls, ti, p);
        return U("reqTalentPts", { n: tree.talents[p].max, talent: (zn && zn.name) || t.req });
      }
    }
    return null;
  }
  function canAdd(cls, ti, i) {
    var t = DATA[cls].trees[ti].talents[i], r = ranksFor(cls)[ti][i];
    if (r >= t.max) return U("maxRank");
    var g = gate(cls, ti, i); if (g) return g;
    if (totalPts(cls) >= pool()) return U("noPoints");
    return null;
  }
  function canRemove(cls, ti, i) {
    var tree = DATA[cls].trees[ti], r = ranksFor(cls)[ti];
    if (r[i] <= 0) return false;
    r[i]--; var ok = true;
    for (var j = 0; j < tree.talents.length && ok; j++) { if (r[j] > 0 && gate(cls, ti, j)) ok = false; }
    r[i]++; return ok;
  }
  function status(cls, ti, i) {
    var t = DATA[cls].trees[ti].talents[i], r = ranksFor(cls)[ti][i];
    return r >= t.max ? "maxed" : r > 0 ? "partial" : (gate(cls, ti, i) ? "locked" : "avail");
  }

  /* ================================================================== *
   *  5. 渲染 render
   * ================================================================== */
  var treesEl, tip;
  var tipAt = null;          /* 当前悬浮提示对应的 [树, 天赋] */

  /* 图标缺失时的占位文字：优先用中文前两字 */
  function abbrev(enName, zhName) {
    if (zhName && zhName !== enName) return zhName.slice(0, 2);
    var w = enName.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
    return w.length === 1 ? w[0].slice(0, 3) : w.slice(0, 3).map(function (x) { return x[0]; }).join("");
  }

  function renderLangBar() {
    var box = $("#lang");
    box.innerHTML = "";
    [["both", "双语", "Bilingual"], ["zh", "中文", "中文"], ["en", "EN", "English"]]
      .forEach(function (opt) {
        var b = document.createElement("button");
        b.className = "btn langbtn";
        b.textContent = opt[1];
        b.setAttribute("aria-pressed", state.lang === opt[0]);
        b.title = opt[2];
        b.onclick = function () { state.lang = opt[0]; applyLang(); renderLangBar(); };
        box.appendChild(b);
      });
  }

  function renderClasses() {
    var nav = $("#classes"); nav.innerHTML = "";
    CLASSES.forEach(function (c) {
      var has = DATA[c].trees.some(function (t) { return t.talents.length; });
      var b = document.createElement("button");
      b.className = "clsbtn";
      b.innerHTML = '<img src="' + ICON(DATA[c].icon) + '" alt="" onerror="FT_ICON_FAIL(this,\'' + DATA[c].icon + '\')">' +
        '<span class="cn">' + esc(zhClass(c)) + '</span><span class="ce">' + esc(c) + "</span>";
      b.setAttribute("aria-pressed", c === state.cls);
      if (!has) { b.classList.add("soon"); b.title = I18N.ui.noVideo.zh + " / " + I18N.ui.noVideo.en; }
      b.onclick = function () {
        if (!has) return;
        state.cls = c; sheetAt = null; $("#sheet").hidden = true;
        /* 切职业后：若当前种族不在新职业可选范围内，重置为该职业默认种族 */
        var R = window.RACIALS || {}, ok = false;
        for (var f in R) for (var i = 0; i < R[f].length; i++)
          if (R[f][i].race === state.race && R[f][i].classes.indexOf(c) >= 0) ok = true;
        if (!ok) state.race = null;
        render();
      };
      nav.appendChild(b);
    });
  }

  function renderTrees() {
    var cls = state.cls;
    treesEl.innerHTML = "";
    DATA[cls].trees.forEach(function (tree, ti) {
      var tName = { zh: zhTreeName(cls, ti), en: tree.name };
      var el = document.createElement("section");
      el.className = "tree" + (tree.talents.length ? "" : " empty");
      el.innerHTML =
        '<div class="thead"><img src="' + ICON(tree.icon) + '" alt="" onerror="FT_ICON_FAIL(this,\'' + tree.icon + '\')">' +
          '<span class="n">' + pair(tName, "inl") + "</span>" +
          '<span class="c"><b>' + treePts(cls, ti) + "</b> / " + pool() + "</span>" +
          '<button class="tr" title="' + esc(I18N.ui.resetTree.zh + " / " + I18N.ui.resetTree.en) +
            '" aria-label="' + esc(I18N.ui.resetTree.zh) + '" data-reset="' + ti + '">↺</button></div>' +
        '<div class="tbody"></div>';
      var body = el.querySelector(".tbody");
      setBg(body, tree.bg);
      el.querySelector("[data-reset]").onclick = function () {
        ranksFor(cls)[ti] = tree.talents.map(function () { return 0; });
        render();
      };
      if (!tree.talents.length) {
        body.innerHTML = "<p>" + duo(fill(I18N.ui.treeEmpty.zh, { tree: tName.zh }),
                                     fill(I18N.ui.treeEmpty.en, { tree: tName.en })) + "</p>";
        treesEl.appendChild(el); return;
      }

      var grid = document.createElement("div");
      grid.className = "grid";
      grid.style.gridTemplateRows = "repeat(" + ROWS + ",var(--trow))";

      tree.talents.forEach(function (t, i) {
        var r = ranksFor(cls)[ti][i], st = status(cls, ti, i);
        var zt = zhTal(cls, ti, i);
        var zname = zt && zt.name ? zt.name : t.name;
        var d = document.createElement("div");
        d.className = "talent " + st + (t.note ? " unknown" : "") +
          (t.classic ? " " + t.classic.status : "") + (zt ? "" : " untranslated");
        d.tabIndex = 0;
        d.setAttribute("role", "button");
        d.setAttribute("aria-label", zname + " / " + t.name + ", " + r + "/" + t.max);
        d.style.gridRow = t.row;
        d.style.gridColumn = t.col;
        var stKey = t.classic && t.classic.status;
        var badgeZH = { "new": "新", "changed": "改", "moved": "移" }[stKey] || "";
        var badgeEN = { "new": "N", "changed": "C", "moved": "M" }[stKey] || "";
        d.innerHTML =
          '<span class="ab">' + esc(abbrev(t.name, zname)) + "</span>" +
          (t.icon ? '<img src="' + ICON(t.icon) + '" alt="" loading="lazy" onerror="FT_ICON_FAIL(this,\'' + t.icon + '\')">' : "") +
          '<span class="rk">' + r + "/" + t.max + "</span>" +
          (stKey && stKey !== "same"
            ? '<span class="badge ' + stKey + '"><span class="zh">' + badgeZH +
              '</span><span class="en">' + badgeEN + "</span></span>" : "");
        d.addEventListener("click", function (e) {
          e.preventDefault();
          if (TOUCH) { openSheet(ti, i); return; }
          (e.shiftKey ? remove : add)(ti, i);
        });
        d.addEventListener("contextmenu", function (e) { e.preventDefault(); remove(ti, i); });
        d.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); add(ti, i); }
          if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); remove(ti, i); }
        });
        d.addEventListener("mouseenter", function (e) { showTip(ti, i, e); });
        d.addEventListener("mousemove", moveTip);
        d.addEventListener("mouseleave", hideTip);
        d.addEventListener("focus", function (e) { showTip(ti, i, e); });
        d.addEventListener("blur", hideTip);
        grid.appendChild(d);
      });

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "arrows");
      body.appendChild(grid);
      grid.appendChild(svg);

      if (tree.removed && tree.removed.length) {
        var rm = document.createElement("div");
        rm.className = "removed";
        rm.innerHTML = "<b>" + pair(I18N.ui.removedTitle, "inl") + "</b>" +
          tree.removed.map(function (x, k) {
            var zx = zhRemoved(cls, ti, k);
            return '<span title="' + esc(x.text.replace(/"/g, "&quot;")) +
              " (" + x.max + " rank" + (x.max > 1 ? "s" : "") + ')">' +
              esc(zx && zx.name ? zx.name : x.name) +
              ' <i class="en">' + esc(x.name) + "</i></span>";
          }).join("");
        body.appendChild(rm);
      }
      treesEl.appendChild(el);
      drawArrows(svg, grid, tree, ti);
    });
  }

  function drawArrows(svg, grid, tree, ti) {
    var gb = grid.getBoundingClientRect();
    var cells = [].slice.call(grid.querySelectorAll(".talent"));
    svg.setAttribute("viewBox", "0 0 " + gb.width + " " + gb.height);
    svg.style.width = gb.width + "px";
    svg.style.height = gb.height + "px";
    var html = "";
    tree.talents.forEach(function (t, i) {
      if (!t.req) return;
      var p = idx(tree, t.req);
      if (p < 0) return;
      var on = ranksFor(state.cls)[ti][p] >= tree.talents[p].max;
      var a = cells[p].getBoundingClientRect(), b = cells[i].getBoundingClientRect();
      var ax = a.left - gb.left + a.width / 2, ay = a.top - gb.top + a.height / 2;
      var bx = b.left - gb.left + b.width / 2, by = b.top - gb.top + b.height / 2;
      var mk = "m" + ti + "_" + i;
      html += '<defs><marker id="' + mk + '" class="' + (on ? "on" : "") +
        '" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">' +
        '<path d="M0,0 L7,3.5 L0,7 z"/></marker></defs>';
      var k = on ? "on" : "";
      if (Math.abs(ay - by) < 2) {
        var s = Math.sign(bx - ax);
        html += '<line class="' + k + '" x1="' + (ax + s * (a.width / 2 + 3)) + '" y1="' + ay +
          '" x2="' + (bx - s * (b.width / 2 + 7)) + '" y2="' + by + '" marker-end="url(#' + mk + ')"/>';
      } else if (Math.abs(ax - bx) < 2) {
        html += '<line class="' + k + '" x1="' + ax + '" y1="' + (ay + a.height / 2 + 3) +
          '" x2="' + bx + '" y2="' + (by - b.height / 2 - 7) + '" marker-end="url(#' + mk + ')"/>';
      } else {
        var s2 = Math.sign(bx - ax);
        html += '<polyline class="' + k + '" points="' + ax + "," + (ay + a.height / 2 + 3) + " " +
          ax + "," + by + " " + (bx - s2 * (b.width / 2 + 7)) + "," + by +
          '" marker-end="url(#' + mk + ')"/>';
      }
    });
    svg.innerHTML = html;
  }

  function renderTop() {
    var cls = state.cls, spent = totalPts(cls), avail = pool();
    $("#split").textContent = DATA[cls].trees.map(function (_, i) { return treePts(cls, i); }).join("/");
    var left = $("#left");
    left.textContent = avail - spent;
    left.classList.toggle("over", spent > avail);
    $("#lvlneed").textContent = Math.max(10, spent + 9);
    $("#bannerName").innerHTML = pair({ zh: zhClass(cls), en: cls }, "inl");
    $("#bannerIcon").src = ICON(DATA[cls].icon);
    setBg($("#banner"), DATA[cls].trees[1].bg);
    [].forEach.call($("#classes").querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", b.querySelector(".ce").textContent.trim() === cls);
    });
    var f = I18N.sourceFile[cls] || "";
    $("#src").innerHTML = duo(fill(I18N.ui.source.zh, { file: f }), fill(I18N.ui.source.en, { file: f }));
  }

  /* ------------------------ 种族特长 racials ------------------------ */
  function renderRacials() {
    var all = $("#allRaces").checked, cls = state.cls, box = $("#factions");
    var RACIALS = window.RACIALS || {};
    var zhF = I18N.racialsZH || {};
    box.innerHTML = "";
    $("#raceCls").innerHTML = pair({ zh: zhClass(cls), en: cls }, "inl");
    var shown = 0, total = 0;
    Object.keys(RACIALS).forEach(function (fac) {
      var races = RACIALS[fac], zhRaces = zhF[fac] || [];
      var f = document.createElement("div");
      f.className = "faction " + fac.toLowerCase();
      f.innerHTML = "<h3>" + pair({ zh: I18N.factions[fac] || fac, en: fac }, "inl") + "</h3>";
      races.forEach(function (r, ri) {
        total++;
        var ok = r.classes.indexOf(cls) >= 0;
        if (!ok && !all) return;
        shown++;
        var zr = zhRaces[ri] || { race: r.race, classes: r.classes, abilities: [] };
        var d = document.createElement("div");
        d.className = "race" + (ok ? "" : " dim");
        d.innerHTML = '<div class="rn"><span class="name">' + pair({ zh: zr.race, en: r.race }, "inl") +
          '</span><small class="cl">' + pair({
            zh: (zr.classes || []).join("、"), en: r.classes.join(", ") }, "inl") + "</small></div><ul>" +
          r.abilities.map(function (ab, ai) {
            var za = zr.abilities[ai] || [ab[0], ab[1]];
            return "<li><b>" + esc(za[0]) + ' <i class="en">' + esc(ab[0]) + "</i></b> " +
              '<span class="zh">' + esc(za[1]) + '</span><span class="en">' + esc(ab[1]) + "</span></li>";
          }).join("") + "</ul>";
        f.appendChild(d);
      });
      if (f.children.length > 1) box.appendChild(f);
    });
    $("#raceCnt").innerHTML = duo(
      fill(I18N.ui.raceCount.zh, { n: shown, t: total }),
      fill(I18N.ui.raceCount.en, { n: shown, t: total }), "inl");
  }

  /* --------------------------- 悬浮提示 tooltip --------------------------- */
  function tipHTML(ti, i) {
    var cls = state.cls, t = DATA[cls].trees[ti].talents[i], r = ranksFor(cls)[ti][i];
    var z = zhTal(cls, ti, i) || { name: t.name, classic: null };
    var h = '<div class="n">' + pair({ zh: z.name, en: t.name }) + "</div>";
    h += '<div class="r">' + pair(U("rank", { r: r, m: t.max }), "inl") + "</div>";
    if (t.cost) h += '<div class="cost">' + duo(zhCost(t.cost), t.cost) + "</div>";
    if (t.passive) h += '<div class="p">' + pair(I18N.ui.passive, "inl") + "</div>";

    var cur = rankText(cls, ti, i, r);
    var nxt = r < t.max ? rankText(cls, ti, i, r + 1) : null;
    if (cur) {
      h += '<div class="d">' + duo(cur.zh, cur.en) + "</div>";
      if (cur.est) h += '<div class="est">' + pair(U("estimated", { r: r })) + "</div>";
    }
    if (nxt) {
      if (cur) h += '<div class="next">' + pair(I18N.ui.nextRank, "inl") + "</div>";
      h += '<div class="d">' + duo(nxt.zh, nxt.en) + "</div>";
      if (nxt.est) h += '<div class="est">' + pair(U("estimated", { r: r + 1 })) + "</div>";
    }
    if (t.note) h += '<div class="est">' + duo(plainText(I18N.notes[t.note] || t.note), plainText(t.note)) + "</div>";

    if (document.body.classList.contains("cmp") && t.classic) {
      var c = t.classic;
      if (c.status === "new") {
        h += '<div class="cl">' + pair(I18N.ui.clNew) + "</div>";
      } else {
        var head = c.status === "same" ? I18N.ui.clSame
          : c.status === "moved" ? I18N.ui.clMoved : I18N.ui.clChanged;
        var headBoth = { zh: head.zh, en: head.en };
        if (c.moved) {
          var w = U("clWasPos", { tree: I18N.trees[c.tree] || c.tree, row: c.row, col: c.col });
          headBoth.zh += w.zh; headBoth.en += w.en;
        }
        if (c.max !== t.max) {
          var m2 = U("clWasMax", { max: c.max });
          headBoth.zh += m2.zh; headBoth.en += m2.en;
        }
        h += '<div class="cl"><b>' + pair(headBoth, "inl") + "</b>" +
             '<div class="t">' + pair({ zh: "经典旧世 1 级：", en: "Classic rank 1:" }, "inl") + "</div>" +
             duo(plainText(z.classic || c.text), plainText(c.text)) + "</div>";
      }
    }
    if (t.reqText) h += '<div class="req">' + duo(zhReqText(t.reqText), t.reqText) + "</div>";

    var why = canAdd(cls, ti, i);
    if (!why) h += '<div class="cta">' + pair(I18N.ui.clickLearn, "inl") + "</div>";
    else if (why.zh === I18N.ui.maxRank.zh) h += '<div class="cta no">' + pair(I18N.ui.maxRank, "inl") + "</div>";
    else if (why.zh === I18N.ui.noPoints.zh) h += '<div class="cta no">' + pair(I18N.ui.noPoints, "inl") + "</div>";
    else h += '<div class="req">' + pair(why) + "</div>";
    return h;
  }
  function showTip(ti, i, e) { tipAt = [ti, i]; tip.innerHTML = tipHTML(ti, i); tip.hidden = false; moveTip(e); }
  function refreshTip(ti, i) {
    if (tipAt && tipAt[0] === ti && tipAt[1] === i && !tip.hidden) tip.innerHTML = tipHTML(ti, i);
  }
  function moveTip(e) {
    if (tip.hidden) return;
    var pad = 14, w = tip.offsetWidth, h = tip.offsetHeight, rect = e.target.getBoundingClientRect();
    var cx = e.clientX == null ? rect.right : e.clientX, cy = e.clientY == null ? rect.top : e.clientY;
    var x = cx + pad, y = cy + pad;
    if (x + w > innerWidth - 8) x = Math.max(8, cx - w - pad);
    if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  function hideTip() { tip.hidden = true; tipAt = null; }

  /* --------------------- 种族基础属性 base stats --------------------- */
  /* 等级线性插值：1 级 ↔ 60 级（经典旧世成长接近线性，误差 ±2 内） */
  function statAt(race, attr, lv) {
    var clsStats = window.CLASS_BASE_STATS && window.CLASS_BASE_STATS[state.cls];
    var d = clsStats && clsStats[race];
    if (!d) return null;
    var b1 = d.b1[attr], b60 = d.b60[attr];
    if (lv <= 1) return b1;
    if (lv >= 60) return b60;
    return Math.round(b1 + (b60 - b1) * (lv - 1) / 59);
  }
  /* 职业等级基础生命/法力（1.12 player_class_stats，1↔60 线性插值） */
  function baseHpAt(cls, lv) {
    var d = window.CLASS_BASE_HP_MP && window.CLASS_BASE_HP_MP[cls];
    if (!d) return 0;
    if (lv <= 1) return d.hp1;
    if (lv >= 60) return d.hp60;
    return Math.round(d.hp1 + (d.hp60 - d.hp1) * (lv - 1) / 59);
  }
  function baseMpAt(cls, lv) {
    var d = window.CLASS_BASE_HP_MP && window.CLASS_BASE_HP_MP[cls];
    if (!d) return 0;
    if (lv <= 1) return d.mp1;
    if (lv >= 60) return d.mp60;
    return Math.round(d.mp1 + (d.mp60 - d.mp1) * (lv - 1) / 59);
  }
  /* 耐力→生命 / 智力→法力 换算：经典 1.12 恒定 1 耐 = 10 生命、1 智 = 15 法力（所有等级） */
  function staPerHp(lv) { return 10; }
  function intPerMp(lv) { return 15; }
  /* 属性类天赋联动：点天赋后，面板的智力 / 攻击强度 / 法伤跟着变 */
  var STAT_TALENTS = {
    "Ancestral Knowledge": { attr: "intPct", per: 0.02, zh: "先祖知识" },
    "Mental Dexterity":    { attr: "apPct",  per: 0.33, zh: "心灵敏捷" },
    "Mental Quickness":    { attr: "spPct",  per: 0.15, zh: "心灵迅捷" },
    "Careful Aim":         { attr: "apPct",  per: 0.20, zh: "精心瞄准" }
  };
  function statEffects() {
    var out = { intPct: 0, apPct: 0, spPct: 0, notes: [] };
    DATA[state.cls].trees.forEach(function (tree, ti) {
      tree.talents.forEach(function (t, i) {
        var r = ranksFor(state.cls)[ti][i];
        var e = r && STAT_TALENTS[t.name];
        if (!e) return;
        out[e.attr] += e.per * r;
        out.notes.push({ zh: e.zh, en: t.name, rank: r, max: t.max });
      });
    });
    return out;
  }
  /* 各职业无装备基础 AP（经典旧世公式） */
  function baseAP(cls, str, agi, lv) {
    /* 经典旧世 1.12 AP 公式（NFU 属性详解）：
       战士/圣骑 = 等级×3+力量×2-20；萨满 = 等级×2+力量×2-20；
       猎人/盗贼 = 等级×2+力量+敏捷-20；德鲁伊 = 力量×2-20；法/牧/术 = 力量-10 */
    if (cls === "Warrior" || cls === "Paladin") return 2 * str + 3 * lv - 20;
    if (cls === "Shaman") return 2 * str + 2 * lv - 20;
    if (cls === "Hunter" || cls === "Rogue") return 2 * lv + str + agi - 20;
    if (cls === "Druid") return 2 * str - 20;
    return str - 10;                             /* Priest / Mage / Warlock */
  }
  /* 常驻暴击天赋扫描：从已点天赋的当前等级文本里识别
     “武器攻击暴击”（攻击暴击）与“所有法术暴击”（法术暴击），自动覆盖各职业。 */
  function critEffects() {
    var out = { melee: 0, spell: 0, notes: [] };
    DATA[state.cls].trees.forEach(function (tree, ti) {
      tree.talents.forEach(function (t, i) {
        var r = ranksFor(state.cls)[ti][i];
        if (!r) return;
        var rt = rankText(state.cls, ti, i, r);
        if (!rt) return;
        var en = rt.en, zh = rt.zh;
        var pct = function (s) { var m = /(\d+(?:\.\d+)?)\s*%/.exec(s); return m ? parseFloat(m[1]) : 0; };
        /* 匹配“武器攻击”/“所有法术和攻击” → 攻击暴击；匹配“所有法术” → 法术暴击。
           例：Thundering Strikes “all spells and attacks” 同时计入两边。 */
        var isCrit = /critical|critically/i.test(en) || /[暴爆]击/.test(zh);
        var mHit = isCrit && (
          /weapon attacks/i.test(en) || /all spells and attacks/i.test(en) ||
          (/武器攻击|近战攻击/.test(zh) && !/法术/.test(zh)));
        var sHit = isCrit && (
          /all spells/i.test(en) || /所有法术|全部法术/.test(zh));
        if (mHit) {
          var mv = pct(mHit ? en : zh);
          out.melee += mv;
          out.notes.push({ zh: (zhTal(state.cls, ti, i) || {}).name || t.name, en: t.name,
                           rank: r, max: t.max, kind: "m", v: mv });
        }
        if (sHit) {
          var sv = pct(sHit ? en : zh);
          out.spell += sv;
          out.notes.push({ zh: (zhTal(state.cls, ti, i) || {}).name || t.name, en: t.name,
                           rank: r, max: t.max, kind: "s", v: sv });
        }
      });
    });
    return out;
  }
  /* 各职业无装备暴击率（经典旧世 1.12 口径）
     - 基础近战暴击：Beaza 1.12 数据挖掘表（等级无关）
     - 基础法术暴击：1.12 各职业实测/挖掘值
     - 换算系数：60 级时 1% 所需敏捷/智力；等级 L 时按 L/60 线性缩放，
       所以同样属性在升级后提供的暴击会下降（游戏内面板的真实表现）。
     萨满法术系数 59.2 为怀旧服实测值（Odealo），与 40 级实测 38 智线性吻合。 */
  var MEELE_CRIT_BASE = { "Rogue": 0, "Druid": 0.9, "Hunter": 0, "Mage": 3.2,
    "Paladin": 0.7, "Priest": 3, "Shaman": 1.7, "Warlock": 2, "Warrior": 0 };
  var MELEE_AGI_PER1 = { "Rogue": 29, "Hunter": 53 };          /* 60 级 1% 需要的敏捷，其余职业 20 */
  var SPELL_CRIT_BASE = { "Mage": 0.2, "Priest": 0.8, "Warlock": 1.7,
    "Paladin": 1, "Shaman": 2.3, "Druid": 1.8 };
  var SPELL_INT_PER1 = { "Mage": 59.5, "Priest": 50, "Warlock": 40,
    "Druid": 39, "Paladin": 29.5, "Shaman": 59.2 };            /* 60 级 1% 需要的智力 */
  function meleeCritPct(cls, agi, lv) {
    var base = MEELE_CRIT_BASE[cls] !== undefined ? MEELE_CRIT_BASE[cls] : 0;
    var per1 = MELEE_AGI_PER1[cls] || 20;
    return base + agi / (per1 * Math.max(lv, 10) / 60);
  }
  function spellCritPct(cls, intV, lv) {
    var base = SPELL_CRIT_BASE[cls] !== undefined ? SPELL_CRIT_BASE[cls] : 1;
    var per1 = SPELL_INT_PER1[cls] || 59.5;
    return base + intV / (per1 * Math.max(lv, 10) / 60);
  }
  /* 闪避/格挡/命中（经典旧世 1.12 口径）
     - 基础闪避率：wowwiki 1.12 表（敏捷型职业为负值，公式外推截距）
     - 1% 闪避所需敏捷（60 级）：盗贼 14.5、猎人 26.5、其余 ~20（怀旧服实测），等级 L 按 L/60 缩放
     - 格挡：裸体无盾为 0；持盾后 格挡率=5%+(防御技能-等级×5)×0.04
     - 攻击命中：同级 95%（基础未命中 5%）、63 级首领 92%（300 武器技能对 315 防御，未命中 8%）
     - 法术命中：同级 96%、63 级首领 83%（17% 未命中） */
  var DODGE_BASE = { "Druid": -1.87, "Hunter": -5.45, "Mage": 3.46, "Paladin": 0.65,
    "Priest": 3.18, "Rogue": -0.59, "Shaman": 1.68, "Warlock": 2.04, "Warrior": 0.76 };
  var DODGE_AGI_PER1 = { "Rogue": 14.5, "Hunter": 26.5 };          /* 其余职业 20 */
  function dodgePct(cls, agi, lv) {
    var base = DODGE_BASE[cls] !== undefined ? DODGE_BASE[cls] : 1;
    var per1 = DODGE_AGI_PER1[cls] || 20;
    return Math.max(0, base + agi / (per1 * Math.max(lv, 10) / 60));
  }
  function hitPct() { return { same: 95, boss: 92 }; }      /* 攻击命中 %（同级 / 63 级首领） */
  function spellHitPct() { return { same: 96, boss: 83 }; } /* 法术命中 %（同级 / 63 级首领） */
  /* 生命 / 法力 / 5 回蓝（经典旧世 1.12 权威，NFU 换算器同口径）
     - 生命 = 耐力×10；法力 = 智力×15（1.12 属性详解，未含等级/种族基础值）
     - 5 回蓝（非施法状态基础值）：牧师/法师 = 精神/4+13；德/萨/骑/术 = 精神/5+13；
       战/贼/猎 无法力资源显示 “—” */
  function mp5Rate(cls, spi) {
    if (cls === "Priest" || cls === "Mage") return Math.round(spi / 4 + 13);
    if (cls === "Druid" || cls === "Shaman" || cls === "Paladin" || cls === "Warlock")
      return Math.round(spi / 5 + 13);
    return null;                                  /* Warrior / Rogue / Hunter */
  }
  /* ================================================================== *
   *  5a. 职业技能书（BlizzCon 2026 试玩 demo 数据，spellbooks.js）
   *      SPELLBOOKS[cls] = {general, tabs, notes, level, race, seen}
   *      技能描述与等级来自 spelldesc.js（SPELL_DESC["Cls|Name|Sub"]）
   *      中文名/图标 slug 来自 skills-cn.js（SKILL_ZH / SKILL_ICONS）
   * ================================================================== */
  var sbOpen = true;                               /* 技能书面板默认展开 */
  var bsOpen = true;                               /* 种族属性表默认展开 */
  var gsOpen = true;                               /* 装备配装默认展开 */
  function zhSkill(name) { var z = (window.SKILL_ZH || {})[name]; return z || name; }
  function skillIcon(name) { return (window.SKILL_ICONS || {})[name] || (window.SKILL_ICONS_EXTRA2 || {})[name] || ""; }
  /* 属性行英文 -> 中文（Mana/射程/施法/冷却等） */
  var ZH_TERMS = {
    "Mana": "法力", "Rage": "怒气", "Energy": "能量", "Focus": "集中值",
    "range": "射程", "cast": "施法", "cooldown": "冷却", "Instant": "瞬发",
    "Passive": "被动", "of base mana": "基础法力", "yd": "码", "sec": "秒", "min": "分钟",
    "Tools:": "需要：", "Reagents:": "材料：", "Requires level": "需要等级",
    "Level": "等级", "Next melee": "下一次近战攻击", "Melee range": "近战范围",
    "Weapon": "武器", "Buff": "增益", "Summon": "召唤", "Radius": "半径",
    "Target": "目标", "Friendly": "友方", "Self": "自身", "Enemy": "敌方",
    /* ---- 参数行补充（长词组优先，避免短词误替换）---- */
    "Melee Range": "近战范围", "Unlimited range": "无限射程",
    "Battle Stance": "战斗姿态", "Defensive Stance": "防御姿态", "Berserker Stance": "狂暴姿态",
    "Dire Bear Form": "巨熊形态", "Bear Form": "熊形态", "Cat Form": "猫形态",
    "Water Totem": "水之图腾", "Fire Totem": "火焰图腾", "Air Totem": "空气图腾", "Earth Totem": "大地图腾",
    "Soul Shard": "灵魂碎片", "Combo Points": "连击点数", "Thieves' Tools": "盗贼工具",
    "Blinding Powder": "致盲粉", "Flash Powder": "闪光粉", "Fish Oil": "鱼油",
    "per sec": "每秒",
    "Requires": "需要", "Channeled": "引导",
    "Stance": "姿态", "Form": "形态", "Battle": "战斗", "Defensive": "防御", "Berserker": "狂暴",
    "Dire": "巨", "Bear": "熊", "Cat": "猫",
    "Totem": "图腾", "Soul": "灵魂", "Shard": "碎片",
    "Thrown": "投掷武器", "Stealth": "潜行", "Guns": "枪械", "Thieves": "盗贼",
    "Combo": "连击", "Points": "点数", "Powder": "粉末",
    "Fire": "火焰", "Air": "空气", "Earth": "大地", "Water": "水", "Fish": "鱼", "Oil": "油",
    "Blinding": "致盲", "Flash": "闪光", "Unlimited": "无限",
    "Health": "生命值", "hour": "小时", "plus": "加", "per": "每"
  };
  function zhLine(s) {
    if (!s) return s;
    var out = String(s);
    Object.keys(ZH_TERMS).forEach(function (k) { out = out.split(k).join(ZH_TERMS[k]); });
    return out;
  }
  /* 技能后缀中文化：Rank N -> 等级 N，Passive -> 被动，Shapeshift -> 变形 */
  function zhSub(s) {
    if (!s) return s;
    var out = String(s);
    var m = out.match(/^Rank\s*(\d+)$/i);
    if (m) return "等级 " + m[1];
    if (/^Passive$/i.test(out)) return "被动";
    if (/^Shapeshift$/i.test(out)) return "变形";
    return out;
  }
  function sbTip(cls, name, sub) {
    var e = (window.SPELL_DESC || {})[cls + "|" + name + "|" + (sub || "")];
    if (!e) return "";
    var p = [];
    if (e.l && e.l.length) p.push(e.l.map(function (r) { return r.join(" "); }).join("\n"));
    if (e.d) p.push(e.d);
    if (e.lv) p.push(e.lv);
    if (e.s === "classic") p.push("[经典 1.12 数据]");
    else if (e.s === "demo") p.push("[BlizzCon 2026 试玩实测]");
    return p.join("\n").replace(/"/g, "&quot;");
  }
  /* 游戏式技能 tooltip（复用 #tip 窗体）：名字 / 等级 / 中文描述（含参数）/ 属性行 / 需求 / 来源 */
  function sbTipHTML(cls, name, sub) {
    var e = (window.SPELL_DESC || {})[cls + "|" + name + "|" + (sub || "")];
    var zhFull = (window.SKILL_DESC_ZH_PLUS || {})[cls + "|" + name] || (window.SKILL_DESC_ZH_PLUS || {})[name];
    var zhDesc = zhFull || (window.SKILL_DESC_ZH || {})[name];
    var h = '<div class="n">' + pair({ zh: zhSkill(name), en: name }) + "</div>";
    if (sub) h += '<div class="r">' + zhSub(String(sub)).replace(/"/g, "&quot;") + "</div>";
    if (zhDesc) {
      h += '<div class="d">' + zhDesc + "</div>";
    }
    if (e) {
      if (e.l && e.l.length)
        h += '<div class="d">' + e.l.map(function (r) { return r.map(zhLine).join(" "); }).join("<br>") + "</div>";
      /* 中文描述未含完整参数时，补出英文原文参数行，保证数值不丢失 */
      if (e.d && !zhFull) h += '<div class="d">' + e.d + "</div>";
      if (e.lv) h += '<div class="req">' + zhLine(e.lv) + "</div>";
      h += '<div class="est">' + (e.s === "classic" ? "[经典 1.12 数据]" : "[BlizzCon 2026 试玩实测]") + "</div>";
    } else if (!zhDesc) {
      h += '<div class="est">' + duo("暂无详细描述（仅试玩技能书名录）", "No tooltip captured (demo spellbook listing only)") + "</div>";
    }
    return h;
  }
  function spellbookHTML() {
    var cls = state.cls;
    var sb = (window.SPELLBOOKS || {})[cls];
    if (!sb) return "";
    var cnt = (sb.general ? sb.general.length : 0);
    (sb.tabs || []).forEach(function (t) { cnt += (t.spells || []).length; });
    var g = [];
    function item(name, sub) {
      var ic = skillIcon(name);
      var esc = String(name).replace(/"/g, "&quot;");
      var escs = String(sub || "").replace(/"/g, "&quot;");
      var img = ic
        ? '<img class="sbic" src="' + ICON(ic) + '" alt="" loading="lazy" onerror="FT_ICON_FAIL(this,\'' + ic + '\')">'
        : '<span class="sbic sbna">' + esc.slice(0, 2).toUpperCase() + "</span>";
      return '<div class="sbi" data-n="' + esc + '" data-s="' + escs + '" title="' + esc + '">' + img +
        '<span class="sbz">' + zhSkill(name) + "</span>" +
        (sub ? '<span class="sbr">' + zhSub(escs) + "</span>" : "") + "</div>";
    }
    if (sb.general && sb.general.length) {
      g.push('<div class="sbgroup">' + duo("通用", "General") + "</div><div class=\"sbgrid\">");
      sb.general.forEach(function (s) { g.push(item(s[0], s[1] || "")); });
      g.push("</div>");
    }
    (sb.tabs || []).forEach(function (t) {
      var tabZH = (window.TAB_ZH || {})[t.name] || t.name;
      g.push('<div class="sbgroup">' + duo(tabZH, t.name) + "</div><div class=\"sbgrid\">");
      (t.spells || []).forEach(function (s) { g.push(item(s[0], s[1] || "")); });
      g.push("</div>");
    });
    var seen = sb.seen || "";
    var nzh = (window.SKILL_NOTES_ZH || {})[cls] || [];
    if (sb.notes && sb.notes.length && nzh.length) {
      g.push('<div class="sbnotes"><div class="sbnt">' +
        duo("职业改动说明（BlizzCon 2026 试玩实录）", "Class notes (BlizzCon 2026 demo)") + "</div>");
      nzh.forEach(function (n) { g.push("<p>" + n + "</p>"); });
      g.push("</div>");
    }
    return '<button type="button" class="sbt" id="sbToggle" aria-expanded="' + sbOpen + '">' +
      duo("职业技能书（BlizzCon 2026 试玩 · 38级）", "Spellbook (BlizzCon demo · Lv38)") +
      ' <span class="sbcls">' + duo(zhClass(cls), cls) + "</span> · " + cnt + duo(" 技能", " spells") +
      ' <span class="sbarr">' + (sbOpen ? "▾" : "▸") + "</span></button>" +
      '<div class="sbb" id="sbBody"' + (sbOpen ? "" : " hidden") + ">" + g.join("") +
      (seen ? '<p class="sbsrc">' + duo("数据来源", "Source") + "：" + seen + "</p>" : "") +
      "</div>";
  }
  /* 技能书面板：渲染到主布局下方独立区块（左边缘与种族属性对齐，右边缘与天赋界面右对齐） */
  function renderSpellbook() {
    var host = $("#spellbookHost");
    if (!host) return;
    var cls = state.cls;
    if (!(window.SPELLBOOKS || {})[cls]) { host.hidden = true; host.innerHTML = ""; return; }
    host.hidden = false;
    host.innerHTML = spellbookHTML();
  }
  function renderBaseStats() {
    var box = $("#basestats");
    if (!box) return;
    var clsStats = window.CLASS_BASE_STATS && window.CLASS_BASE_STATS[state.cls];
    var RACIALS = window.RACIALS || {}, zhF = I18N.racialsZH || {};
    var fx = statEffects();
    var fxCrit = critEffects();
    var attrNames = [
      { zh: "力量", en: "Strength" }, { zh: "敏捷", en: "Agility" },
      { zh: "耐力", en: "Stamina" }, { zh: "智力", en: "Intellect" },
      { zh: "精神", en: "Spirit" }
    ];
    /* 收集各可选种族的完整面板值（转置用） */
    var cols = [];   /* [{ name, vals: [16 个 {v,cls}] }] */
    Object.keys(RACIALS).forEach(function (fac) {
      var races = RACIALS[fac], zhRaces = zhF[fac] || [];
      races.forEach(function (r, ri) {
        if (r.classes.indexOf(state.cls) < 0) return;   /* 该职业不可选的种族不显示 */
        var zr = zhRaces[ri] || { race: r.race };
        var d = clsStats && clsStats[r.race];
        var vals = [];
        if (!d) {
          vals = [{ v: duo("自定义种族，暂无数据", "Custom race, no data"), cls: "na" }];
        } else {
          var strV = statAt(r.race, 0, state.level), agiV = statAt(r.race, 1, state.level);
          var intV = statAt(r.race, 3, state.level);
          var intFinal = Math.round(intV * (1 + fx.intPct));
          var apFinal = Math.max(0, baseAP(state.cls, strV, agiV, state.level)) + Math.round(intV * fx.apPct);
          var spFinal = Math.round(intV * fx.spPct);
          var mCrit = meleeCritPct(state.cls, agiV, state.level) + fxCrit.melee;
          var sCrit = spellCritPct(state.cls, intFinal, state.level) + fxCrit.spell;
          var dodge = dodgePct(state.cls, agiV, state.level);
          var mHit = hitPct(), sHit = spellHitPct();
          var noMana = (state.cls === "Warrior" || state.cls === "Rogue" || state.cls === "Hunter");
          var hpFinal = baseHpAt(state.cls, state.level) +
            Math.round(statAt(r.race, 2, state.level) * staPerHp(state.level));
          var mpFinal = noMana ? null :
            baseMpAt(state.cls, state.level) + Math.round(intFinal * intPerMp(state.level));
          var mp5 = mp5Rate(state.cls, statAt(r.race, 4, state.level));
          attrNames.forEach(function (a, ai) {
            var v = statAt(r.race, ai, state.level);
            if (ai === 3) v = intFinal;
            var est = state.level >= 60 ? d.est60 : (d.est1 || d.est60);
            var c = ai === 3 ? "int" : "";
            if (est) c = (ai === 3 ? "int est" : "est");
            vals.push({ v: (est ? "≈" : "") + v, cls: c });
          });
          vals.push({ v: hpFinal, cls: "hp" });
          vals.push({ v: (mpFinal === null ? "—" : mpFinal), cls: "mp" });
          vals.push({ v: (mp5 === null ? "—" : mp5), cls: "mp5" });
          vals.push({ v: apFinal, cls: "ap" });
          vals.push({ v: spFinal, cls: "sp" });
          vals.push({ v: mCrit.toFixed(1) + "%", cls: "cc" });
          vals.push({ v: sCrit.toFixed(1) + "%", cls: "cs" });
          vals.push({ v: dodge.toFixed(1) + "%", cls: "dd" });
          vals.push({ v: "0*", cls: "bl" });
          vals.push({ v: mHit.same + "/" + mHit.boss, cls: "mh" });
          vals.push({ v: sHit.same + "/" + sHit.boss, cls: "sh" });
        }
        cols.push({ key: r.race, name: pair({ zh: zr.race, en: r.race }, "inl"), vals: vals, hasData: !!d });
      });
    });
    /* 天赋联动脚注 */
    var fxnote = "";
    if (fx.notes.length || fxCrit.notes.length) {
      var parts = [];
      fx.notes.forEach(function (n) {
        var pct = "";
        if (n.zh === "先祖知识") pct = "智力+" + Math.round(fx.intPct * 100) + "%";
        else if (n.zh === "心灵敏捷") pct = "智力" + Math.round(n.rank * 33) + "%→AP";
        else if (n.zh === "精心瞄准") pct = "智力" + Math.round(n.rank * 20) + "%→AP";
        else pct = "智力" + Math.round(n.rank * 15) + "%→法伤";
        parts.push(duo(n.zh, n.en) + " " + n.rank + "/" + n.max + "（" + pct + "）");
      });
      fxCrit.notes.forEach(function (n) {
        var lab = n.kind === "m" ? "攻击暴击+" : "法术暴击+";
        parts.push(duo(n.zh, n.en) + " " + n.rank + "/" + n.max + "（" + lab + n.v + "%）");
      });
      fxnote = duo("天赋联动：", "Talents: ") + parts.join("、");
    }
    var intHead = fx.intPct > 0
      ? duo("智力+" + Math.round(fx.intPct * 100) + "%", "Int+" + Math.round(fx.intPct * 100) + "%")
      : duo("智力", "Intellect");
    /* 转置渲染：属性为行、种族为列（左栏竖排） */
    var rowDefs = [
      { zh: "力量", en: "Str" }, { zh: "敏捷", en: "Agi" }, { zh: "耐力", en: "Sta" },
      { zh: intHead, en: "" },
      { zh: "精神", en: "Spi" },
      { zh: "生命", en: "HP" }, { zh: "法力", en: "Mana" }, { zh: "5回蓝", en: "MP5" },
      { zh: "攻击强度", en: "AP" }, { zh: "法伤", en: "SpDmg" },
      { zh: "攻击暴击", en: "MCrit" }, { zh: "法术暴击", en: "SCrit" }, { zh: "闪避", en: "Dodge" },
      { zh: "格挡", en: "Block" }, { zh: "攻击命中", en: "Hit" }, { zh: "法术命中", en: "SpHit" }
    ];
    var headCells = "<th>" + duo("属性", "Stat") + "</th>" +
      cols.map(function (c) {
        var dis = c.hasData ? "" : " disabled";
        var checked = (state.race || firstRaceOf(state.cls)) === c.key ? " checked" : "";
        return '<th><label class="racerdo" title="勾选该种族，右栏面板跟随计算 / Check a race; right panel follows it">' +
          '<input type="radio" name="baserace" data-race="' + esc(c.key) + '"' + checked + dis + ">" +
          "<span>" + c.name + "</span></label></th>";
      }).join("");
    var bodyRows = rowDefs.map(function (rd, ri) {
      var tds = cols.map(function (c) {
        var v = c.vals[ri] || { v: "", cls: "" };
        return '<td class="' + v.cls + '">' + v.v + "</td>";
      }).join("");
      return "<tr><th>" + rd.zh + "</th>" + tds + "</tr>";
    }).join("");
    box.innerHTML =
      '<div class="bshead"><strong>' + pair({ zh: "种族基础属性", en: "Race Base Stats" }) + "</strong>" +
      '<span class="bscls">' + pair({ zh: zhClass(state.cls), en: state.cls }, "inl") + "</span>" +
      '<span class="bslv">' + duo("等级 " + state.level, "Level " + state.level) + "</span>" +
      '<button type="button" class="bsmin" id="bsToggle" aria-expanded="' + bsOpen + '">' +
      (bsOpen ? duo("收起 ▲", "Hide ▲") : duo("展开 ▼", "Show ▼")) + "</button></div>" +
      '<div class="bstbl"' + (bsOpen ? "" : " hidden") + "><table><thead><tr>" + headCells +
      "</tr></thead><tbody>" + bodyRows + "</tbody></table></div>";
  }

  /* ================================================================== *
   *  5b. 30 级装备配装（数据：NFU 1.12 数据库副本掉落）
   * ================================================================== */
  var GEAR_SLOTS = [
    { id: "head", zh: "头" }, { id: "neck", zh: "颈" }, { id: "shoulder", zh: "肩" },
    { id: "back", zh: "背" }, { id: "chest", zh: "胸" }, { id: "wrist", zh: "腕" },
    { id: "hands", zh: "手" }, { id: "waist", zh: "腰" }, { id: "legs", zh: "腿" },
    { id: "feet", zh: "脚" }, { id: "finger", zh: "戒指" },
    { id: "main", zh: "主手" }, { id: "off", zh: "副手" }, { id: "twohand", zh: "双手" },
    { id: "ranged", zh: "远程" }, { id: "shield", zh: "盾牌" }, { id: "relic", zh: "圣物" }
  ];
  var gearSel = {};                       /* slot -> item（对象引用） */
  var gearOpen = null;                    /* 当前展开的槽位 */
  function gearLib() { return window.GEAR30 || {}; }
  function gearItem(slotId) { return gearSel[slotId] || null; }
  /* 汇总已选装备的五维/护甲/秒伤/附加效果/武器信息 */
  function gearTotals() {
    var t = { s: [0, 0, 0, 0, 0], armor: 0, dps: 0, ap: 0, spd: 0, notes: [], wpn: null, hasShield: false };
    GEAR_SLOTS.forEach(function (sl) {
      var it = gearItem(sl.id);
      if (!it) return;
      for (var i = 0; i < 5; i++) t.s[i] += (it.s ? it.s[i] : 0);
      t.armor += it.armor || 0;
      if (it.dps) t.dps = Math.max(t.dps, it.dps);
      if (it.e) {
        var apm = /攻击强度提高\s*(\d+)/.exec(it.e);
        if (apm) t.ap += parseInt(apm[1], 10);
        var spm = /法术(?:和魔法效果)?伤害(?:和治疗效果)?提高\s*(\d+)/.exec(it.e);
        if (spm) t.spd += parseInt(spm[1], 10);
        t.notes.push(it.n + "：" + it.e);
      }
    });
    /* 武器信息：双手 > 主手 > 远程 > 副手 优先级取第一件带攻速的 */
    ["twohand", "main", "ranged", "off"].forEach(function (sid) {
      var it = gearItem(sid);
      if (it && it.spd && !t.wpn) t.wpn = { n: it.n, spd: it.spd, dmg: it.dmg || null, dps: it.dps || 0 };
    });
    t.hasShield = !!gearItem("shield");
    return t;
  }
  var GEAR_Q = { b: ["精良", "#0070dd"], g: ["优秀", "#1eff00"] };
  function gearQ(it) {
    var q = GEAR_Q[it.q] || GEAR_Q.g;
    return '<span style="color:' + q[1] + '">' + q[0] + "</span>";
  }
  /* 物品详情卡（hover tooltip） */
  function gearTipHTML(it) {
    var s = it.s || [];
    var h = '<div class="gtn" style="color:' + (GEAR_Q[it.q] ? GEAR_Q[it.q][1] : "#1eff00") + '">' + it.n + "</div>";
    h += '<div class="gtq">' + gearQ(it) + " · " + duo("需要等级", "Req") + " " + it.req +
      " · " + duo("物品等级", "ilvl") + " " + it.ilvl + "</div>";
    var st = [];
    var zh = ["力量", "敏捷", "耐力", "智力", "精神"];
    for (var i = 0; i < 5; i++) if (s[i]) st.push("+" + s[i] + " " + zh[i]);
    if (it.armor) st.push(duo("护甲", "Armor") + " " + it.armor + (it.at ? "（" + it.at + "甲）" : ""));
    if (it.dps) st.push("DPS " + it.dps);
    if (it.spd) st.push(duo("速度", "Speed") + " " + it.spd.toFixed(2));
    if (it.dmg) st.push(duo("伤害", "Dmg") + " " + it.dmg[0] + "-" + it.dmg[1]);
    if (st.length) h += '<div class="gts">' + st.join("　") + "</div>";
    if (it.e) h += '<div class="gte">' + it.e + "</div>";
    h += '<div class="gtf">' + duo("来源", "Source") + "：" + it.f + "</div>";
    return h;
  }
  function renderGearSim() {
    var box = $("#gearsim");
    if (!box) return;
    var lib = gearLib();
    var any = false;
    for (var k in lib) if (lib[k] && lib[k].length) { any = true; break; }
    if (!any) { box.hidden = true; return; }
    box.hidden = false;
    $("#gearTitle").innerHTML = duo("30 级装备配装", "Lv30 Gear Planner") +
      ' <button type="button" class="gsmin" id="gsToggle" aria-expanded="' + gsOpen + '">' +
      (gsOpen ? duo("收起 ▲", "Hide ▲") : duo("展开 ▼", "Show ▼")) + "</button>";
    $("#gearHint").innerHTML = "";
    var rows = ["", "", "", "", ""];
    GEAR_SLOTS.forEach(function (sl, idx) {
      var opts = lib[sl.id] || [];
      var cur = gearItem(sl.id);
      var btn = '<button type="button" class="gslotbtn" data-gslot="' + sl.id + '">' +
        '<span class="gzl">' + sl.zh + "</span>：<span class=\"gzv\">" +
        (cur ? '<span style="color:' + (GEAR_Q[cur.q] ? GEAR_Q[cur.q][1] : "#1eff00") + '">' + cur.n + "</span>"
             : (opts.length ? duo("未选", "none") : "—")) +
        "</span> <b>▾</b></button>";
      var list = '<div class="glist" data-gslot="' + sl.id + '" hidden>';
      if (!opts.length) {
        list += '<div class="gitem gempty">' + duo(
          (sl.id === "relic" ? "经典旧世 1.12 无圣物装备栏（圣契/神像/图腾为 TBC 2.0 引入），暂无数据" : "该槽位暂无 30 级以下装备"),
          (sl.id === "relic" ? "No relic slot in Vanilla 1.12 (added in TBC), no data" : "No gear under lv30 for this slot")
        ) + "</div>";
      } else {
        list += '<div class="gitem gunsel" data-gslot="' + sl.id + '">' +
          duo("— 未选（清除该槽位）", "— none (clear slot)") + "</div>";
      }
      opts.forEach(function (it) {
        list += '<div class="gitem" data-gslot="' + sl.id + '" data-i="' + it.id + '">' +
          '<i style="background:' + (GEAR_Q[it.q] ? GEAR_Q[it.q][1] : "#1eff00") + '"></i>' +
          '<span class="gn" style="color:' + (GEAR_Q[it.q] ? GEAR_Q[it.q][1] : "#1eff00") + '">' + it.n + "</span>" +
          '<span class="gm">' + (it.q === "b" ? "蓝" : "绿") + "·req" + it.req + "·" + it.f +
          (it.at ? "·" + it.at + "甲" : "") + "</span>" +
          "</div>";
      });
      list += "</div>";
      rows[idx % 5] += '<div class="gwrap" data-gslot="' + sl.id + '">' + btn + list + "</div>";
    });
    $("#gslots").innerHTML = rows.map(function (r) { return '<div class="gsrow">' + r + "</div>"; }).join("");
    $("#gtip").hidden = true;
    gearOpen = null;
    var fold = !gsOpen;
    $("#gslots").hidden = fold;
    $("#gearsum").hidden = fold;
    $("#gearpanel").hidden = fold;
    renderGearSummary();
  }
  function gearSlotBtn(slotId) { return document.querySelector('.gslotbtn[data-gslot="' + slotId + '"]'); }
  function gearSlotList(slotId) { return document.querySelector('.glist[data-gslot="' + slotId + '"]'); }
  function closeGearList() {
    if (gearOpen) {
      var l = gearSlotList(gearOpen);
      if (l) l.hidden = true;
      var b = gearSlotBtn(gearOpen);
      var row = b && b.closest ? b.closest(".gsrow") : null;
      if (row) row.classList.remove("open");
      gearOpen = null;
    }
    $("#gtip").hidden = true;
  }
  function openGearList(slotId) {
    closeGearList();
    gearOpen = slotId;
    var l = gearSlotList(slotId);
    if (l) l.hidden = false;
    var b = gearSlotBtn(slotId);
    var row = b && b.closest ? b.closest(".gsrow") : null;
    if (row) row.classList.add("open");
  }
  function showGearTip(it, ev) {
    var tip = $("#gtip");
    if (!it) { tip.hidden = true; return; }
    tip.innerHTML = gearTipHTML(it);
    tip.hidden = false;
    moveGearTip(ev);
  }
  function moveGearTip(ev) {
    var tip = $("#gtip");
    if (!tip || tip.hidden) return;
    var pad = 14, w = 280;
    var x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
    if (y + 150 > innerHeight - 8) y = Math.max(8, ev.clientY - 150);
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function gearItemById(slotId, id) {
    var opts = (gearLib()[slotId] || []);
    for (var i = 0; i < opts.length; i++) if (String(opts[i].id) === String(id)) return opts[i];
    return null;
  }
  function onGearChange(slotId, idx) {
    var lib = gearLib(), opts = lib[slotId] || [];
    if (idx === "" || idx === null) delete gearSel[slotId];
    else gearSel[slotId] = opts[parseInt(idx, 10)] || null;
    renderGearSummary();
  }
  function gearAttrsSummary(t) {
    var s = t.s, parts = [];
    var zh = ["力量", "敏捷", "耐力", "智力", "精神"];
    for (var i = 0; i < 5; i++) if (s[i]) parts.push(zh[i] + "+" + s[i]);
    return parts.join("  ") || "—";
  }
  function renderGearSummary() {
    var t = gearTotals();
    var s = t.s;
    /* 装备总属性卡 */
    var sum = "";
    sum += '<div class="gcard"><b>' + duo("装备总属性", "Gear Totals") + "</b> " +
      gearAttrsSummary(t) +
      (t.armor ? ' ｜ 护甲 ' + t.armor : "") +
      (t.dps ? ' ｜ 武器 DPS ' + t.dps : "") +
      (t.wpn && t.wpn.spd ? ' ｜ 速度 ' + t.wpn.spd.toFixed(2) : "") +
      (t.wpn && t.wpn.dmg ? ' ｜ 伤害 ' + t.wpn.dmg[0] + "-" + t.wpn.dmg[1] : "") +
      (t.ap ? ' ｜ AP+' + t.ap : "") +
      (t.spd ? ' ｜ 法伤+' + t.spd : "") + "</div>";
    /* 配装后面板（基础 + 装备，当前职业/种族/等级） */
    var p = gearPanelValues(t);
    if (p) {
      /* 竖排面板：属性为行、数值为列（右栏窄版） */
      var wpnCell = t.wpn ? '<td>' + t.wpn.spd.toFixed(2) + ' 秒</td>' : "<td>—</td>";
      var dmgCell = (t.wpn && t.wpn.dmg)
        ? '<td>' + t.wpn.dmg[0] + "-" + t.wpn.dmg[1] + "（熟练300）</td>" : "<td>—</td>";
      var gRows = [
        ["生命", p.hp], ["法力", p.mp], ["5回蓝", p.mp5], ["攻击强度", p.ap],
        ["法伤", p.sp], ["攻击暴击", p.mc], ["法术暴击", p.sc], ["闪避", p.dg],
        ["格挡", p.bl], ["防御等级", p.def],
        ["武器攻速", wpnCell], ["满熟练伤害", dmgCell],
        ["力量", p.str], ["敏捷", p.agi], ["耐力", p.sta], ["智力", p.int], ["精神", p.spi]
      ];
      sum += '<table class="gp"><thead><tr>' +
        "<th>" + duo("属性", "Stat") + "</th>" +
        "<th>" + duo("无装备 → 配装后", "Bare → Geared") + "</th>" +
        "</tr></thead><tbody>" +
        gRows.map(function (r) { return "<tr><th>" + r[0] + "</th>" + r[1] + "</tr>"; }).join("") +
        "</tbody></table>";
      /* 武器技能：1.12 种族专精 +5（兽人斧/人类剑锤/矮人枪/巨魔投掷）→ 305 */
      var RACE_WSKILL = { "Orc": "斧", "Human": "剑/锤", "Dwarf": "枪械", "Troll": "投掷" };
      var rw = RACE_WSKILL[state.race || firstRaceOf(state.cls)];
      if (rw) {
        sum += '<div class="gwnote">' + duo(
          "武器技能 300 → 305（" + rw + "专精 +5）：偏斜伤害 65%→85%、未命中 -3%，对 63 级首领白字 DPS 约 +7~10%",
          "Weapon skill 300→305 (" + rw + " +5): glance 65%→85%, -3% miss, ~+7-10% white DPS vs lv63 boss"
        ) + "</div>";
      }
      if (t.notes.length) {
        sum += '<div class="gnotes">' + duo("装备特效", "Effects") + "：" +
          t.notes.join("；") + "</div>";
      }
    }
    $("#gearsum").innerHTML = sum;
  }
  /* 配装后面板：基础五维（当前种族等级）+ 装备 → 同口径重算全部关键列 */
  function gearPanelValues(t) {
    if (!window.CLASS_BASE_STATS || !window.CLASS_BASE_STATS[state.cls]) return null;
    var race = state.race || firstRaceOf(state.cls);
    if (!race) return null;
    var fx = statEffects(), fxCrit = critEffects();
    /* calc(extra)：extra 为装备提供的五维增量（[力,敏,耐,智,精]） */
    function calc(extra) {
      var base = [0, 0, 0, 0, 0];
      for (var i = 0; i < 5; i++) base[i] = statAt(race, i, state.level) + (extra ? extra[i] : 0);
      var intV = base[3], strV = base[0], agiV = base[1], staV = base[2], spiV = base[4];
      var intFinal = Math.round(intV * (1 + fx.intPct));
      var noMana = (state.cls === "Warrior" || state.cls === "Rogue" || state.cls === "Hunter");
      var hp = baseHpAt(state.cls, state.level) + Math.round(staV * staPerHp(state.level));
      var mp = noMana ? null : (baseMpAt(state.cls, state.level) + Math.round(intFinal * intPerMp(state.level)));
      var mp5 = mp5Rate(state.cls, spiV);
      var ap = Math.max(0, baseAP(state.cls, strV, agiV, state.level)) +
        Math.round(intV * fx.apPct) + (t.ap || 0);
      var sp = Math.round(intV * fx.spPct) + (t.spd || 0);
      var mc = meleeCritPct(state.cls, agiV, state.level) + fxCrit.melee;
      var sc = spellCritPct(state.cls, intFinal, state.level) + fxCrit.spell;
      var dg = dodgePct(state.cls, agiV, state.level);
      return { hp: hp, mp: mp, mp5: mp5, ap: ap, sp: sp, mc: mc, sc: sc, dg: dg,
               str: strV, agi: agiV, sta: staV, int: intFinal, spi: spiV };
    }
    var b0 = calc(null), b1 = calc(t.s);   /* b0=无装备基础，b1=配装后 */
    /* 防御等级：基础 = 等级×5（1.12 全职业通用），装备防御加成暂无数据 */
    var defSkill = state.level * 5;
    /* 格挡：裸体无盾 0；持盾 = 5% + (防御技能 - 等级×5) × 0.04 = 5% */
    var blk = t.hasShield ? (5 + (defSkill - state.level * 5) * 0.04) : 0;
    /* 三段式：基础（+装备增量）配装后总值 —— 括号内只含装备提供的增量 */
    var f = function (a, b) {
      var d = Math.round(b - a);
      return d === 0 ? String(a) : a + ' <em class="up">(+' + d + ")</em> " + b;
    };
    var fm = function (a, b) { return a === null ? "—" : f(a, b); };
    return {
      hp: "<td class=\"hp\">" + f(b0.hp, b1.hp) + "</td>",
      mp: "<td class=\"mp\">" + fm(b0.mp, b1.mp) + "</td>",
      mp5: "<td>" + fm(b0.mp5, b1.mp5) + "</td>",
      ap: "<td>" + f(b0.ap, b1.ap) + "</td>",
      sp: "<td>" + f(b0.sp, b1.sp) + "</td>",
      mc: "<td>" + b1.mc.toFixed(1) + "%</td>",
      sc: "<td>" + b1.sc.toFixed(1) + "%</td>",
      dg: "<td>" + b1.dg.toFixed(1) + "%</td>",
      bl: "<td>" + (blk > 0 ? blk.toFixed(1) + "%*" : "0%*") + "</td>",
      def: "<td>" + defSkill + "</td>",
      str: "<td>" + f(b0.str, b1.str) + "</td>", agi: "<td>" + f(b0.agi, b1.agi) + "</td>",
      sta: "<td>" + f(b0.sta, b1.sta) + "</td>", int: "<td>" + f(b0.int, b1.int) + "</td>",
      spi: "<td>" + f(b0.spi, b1.spi) + "</td>"
    };
  }
  function firstRaceOf(cls) {
    var R = window.RACIALS || {};
    for (var f in R) {
      var arr = R[f];
      for (var i = 0; i < arr.length; i++)
        if (arr[i].classes.indexOf(cls) >= 0) return arr[i].race;
    }
    return null;
  }
  function onGearChange(slotId, idx) {
    var lib = gearLib(), opts = lib[slotId] || [];
    if (idx === "" || idx === null) delete gearSel[slotId];
    else gearSel[slotId] = opts[parseInt(idx, 10)] || null;
    renderGearSummary();
  }

  /* ================================================================== *
   *  6. 操作 actions
   * ================================================================== */
  function add(ti, i) {
    var why = canAdd(state.cls, ti, i);
    if (why) { toast(why.zh + " ／ " + why.en); return; }
    ranksFor(state.cls)[ti][i]++; render(); refreshTip(ti, i);
  }
  function remove(ti, i) {
    if (!canRemove(state.cls, ti, i)) {
      if (ranksFor(state.cls)[ti][i] > 0) {
        toast(I18N.ui.dependsOn.zh + " ／ " + I18N.ui.dependsOn.en);
      }
      return;
    }
    ranksFor(state.cls)[ti][i]--; render(); refreshTip(ti, i);
  }
  var toastT;
  function toast(m) {
    var t = $("#toast");
    t.textContent = m; t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  /* --------------------- 触屏底部面板 touch sheet --------------------- */
  var TOUCH = matchMedia("(hover: none)").matches;
  var sheetAt = null;  function openSheet(ti, i) { sheetAt = [ti, i]; renderSheet(); $("#sheet").hidden = false; }
  function renderSheet() {
    if (!sheetAt) return;
    var ti = sheetAt[0], i = sheetAt[1], cls = state.cls, r = ranksFor(cls)[ti][i];
    $("#sheetBody").innerHTML = tipHTML(ti, i);
    $("#sheetAdd").disabled = !!canAdd(cls, ti, i);
    $("#sheetRem").disabled = !(r > 0 && canRemove(cls, ti, i));
  }

  /* ================================================================== *
   *  7. 总控与启动
   * ================================================================== */
  var render = function () {
    renderTrees(); renderTop(); renderRacials(); renderBaseStats(); renderGearSim(); renderSpellbook();
    if (sheetAt) {
      var ti = sheetAt[0], i = sheetAt[1];
      if (!DATA[state.cls].trees[ti] || !DATA[state.cls].trees[ti].talents[i]) {
        $("#sheet").hidden = true; sheetAt = null;
      } else renderSheet();
    }
  };

  function boot() {
    treesEl = $("#trees");
    tip = $("#tip");
    document.documentElement.lang = "zh-CN";
    document.title = I18N.ui.title.zh + " / " + I18N.ui.title.en;

    /* 静态界面文案 */
    $("#h1").innerHTML = pair(I18N.ui.title) + "<small>" + pair(I18N.ui.subtitle) + "</small>";
    $("#levelLabel").innerHTML = pair(I18N.ui.level, "inl");
    $("#reset").innerHTML = pair(I18N.ui.reset, "inl");
    $("#cmp").innerHTML = pair(I18N.ui.compare, "inl");
    $("#cmp").title = I18N.ui.compareTip.zh + " / " + I18N.ui.compareTip.en;
    $("#talentsLabel").innerHTML = pair(I18N.ui.talents, "inl");
    $("#leftLabel").innerHTML = pair(I18N.ui.pointsLeft, "inl") + "：";
    $("#lvlneedLabel").innerHTML = pair(I18N.ui.levelNeeded, "inl") + "：";
    $("#racialsTitle").innerHTML = pair(I18N.ui.racials, "inl");
    $("#showAllLabel").innerHTML = pair(I18N.ui.showAllRaces, "inl") + ' <span id="raceCls"></span>';
    $("#sheetAdd").innerHTML = pair(I18N.ui.learn, "inl");
    $("#sheetRem").innerHTML = pair(I18N.ui.unlearn, "inl");
    $("#sheetClose").setAttribute("aria-label", I18N.ui.close.zh);
    $("#legend").innerHTML =
      '<span><i style="background:#4ade80"></i>' + pair(I18N.ui.legNew, "inl") + "</span>" +
      '<span><i style="background:#fbbf24"></i>' + pair(I18N.ui.legChanged, "inl") + "</span>" +
      '<span><i style="background:#60a5fa"></i>' + pair(I18N.ui.legMoved, "inl") + "</span>" +
      "<span>" + pair(I18N.ui.legSame, "inl") + "</span>" +
      "<span>" + pair(I18N.ui.legNote) + "</span>";
    $("#help").innerHTML = I18N.ui.help.map(function (p) { return "<p>" + pair(p) + "</p>"; }).join("");

    /* 等级下拉 */
    var lv = $("#level");
    for (var l = 60; l >= 10; l--) {
      var o = document.createElement("option");
      o.value = l;
      o.textContent = l === 60 ? I18N.ui.maxLevel.zh + " / " + I18N.ui.maxLevel.en : l;
      lv.appendChild(o);
    }
    lv.onchange = function () { state.level = +lv.value; render(); };
    $("#allRaces").onchange = renderRacials;
    $("#reset").onclick = function () { state.ranks[state.cls] = null; render(); };

    /* 左栏种族对钩：切换后右栏配装面板跟随该种族 */
    document.addEventListener("change", function (ev) {
      var t = ev.target;
      if (t && t.name === "baserace") {
        state.race = t.getAttribute("data-race") || null;
        render();
      }
    });

    /* 配装槽位交互：点击按钮展开/收起，点击装备项选中，hover 显示物品卡 */
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      var item = t.closest ? t.closest(".gitem") : null;
      if (item && !item.classList.contains("gempty")) {
        var slotId = item.getAttribute("data-gslot");
        if (item.classList.contains("gunsel")) {
          /* “未选”：清除该槽位选择 */
          delete gearSel[slotId];
          closeGearList();
          renderGearSummary();
          var b0 = gearSlotBtn(slotId);
          if (b0) b0.querySelector(".gzv").innerHTML =
            duo("未选", "none") + " <b>▾</b>";
          return;
        }
        var it = gearItemById(slotId, item.getAttribute("data-i"));
        if (it) {
          gearSel[slotId] = it;
          closeGearList();
          renderGearSummary();
          var btn = gearSlotBtn(slotId);
          if (btn) btn.querySelector(".gzv").innerHTML =
            '<span style="color:' + (GEAR_Q[it.q] ? GEAR_Q[it.q][1] : "#1eff00") + '">' + it.n + "</span>";
        }
        return;
      }
      var btn = t.closest ? t.closest(".gslotbtn") : null;
      if (btn) {
        var sid = btn.getAttribute("data-gslot");
        if (gearOpen === sid) closeGearList(); else openGearList(sid);
        return;
      }
      var sbt = t.closest ? t.closest("#sbToggle") : null;
      if (sbt) {
        sbOpen = !sbOpen;
        var body = $("#sbBody"), arr = sbt.querySelector(".sbarr");
        if (body) body.hidden = !sbOpen;
        if (arr) arr.textContent = sbOpen ? "▾" : "▸";
        sbt.setAttribute("aria-expanded", sbOpen);
        return;
      }
      var bst = t.closest ? t.closest("#bsToggle") : null;
      if (bst) {
        bsOpen = !bsOpen;
        var bt = $("#basestats .bstbl");
        if (bt) bt.hidden = !bsOpen;
        bst.innerHTML = bsOpen ? duo("收起 ▲", "Hide ▲") : duo("展开 ▼", "Show ▼");
        bst.setAttribute("aria-expanded", bsOpen);
        return;
      }
      var gst = t.closest ? t.closest("#gsToggle") : null;
      if (gst) {
        gsOpen = !gsOpen;
        var fold = !gsOpen;
        ["#gslots", "#gearsum", "#gearpanel"].forEach(function (s) {
          var el = document.querySelector(s);
          if (el) el.hidden = fold;
        });
        gst.innerHTML = gsOpen ? duo("收起 ▲", "Hide ▲") : duo("展开 ▼", "Show ▼");
        gst.setAttribute("aria-expanded", gsOpen);
        return;
      }
      closeGearList();
    });
    document.addEventListener("mouseover", function (ev) {
      var t = ev.target;
      var sbi = t.closest ? t.closest(".sbi") : null;
      if (sbi) {
        var cls = state.cls;
        var nm = sbi.getAttribute("data-n") || "", su = sbi.getAttribute("data-s") || "";
        tip.innerHTML = sbTipHTML(cls, nm, su);
        tip.hidden = false;
        moveTip(ev);
        return;
      }
      var item = t.closest ? t.closest(".gitem") : null;
      if (item && !item.classList.contains("gempty")) {
        var it = gearItemById(item.getAttribute("data-gslot"), item.getAttribute("data-i"));
        if (it) showGearTip(it, ev);
      }
    });
    document.addEventListener("mousemove", function (ev) {
      var tip = $("#gtip");
      if (tip && !tip.hidden) moveGearTip(ev);
      if (!document.getElementById("tip").hidden) moveTip(ev);
    });
    document.addEventListener("mouseout", function (ev) {
      var t = ev.target;
      if (t && t.closest && t.closest(".sbi")) hideTip();
      if (t && t.closest && t.closest(".gitem")) $("#gtip").hidden = true;
    });

    $("#cmp").onclick = function () {
      var on = !document.body.classList.contains("cmp");
      document.body.classList.toggle("cmp", on);
      $("#cmp").setAttribute("aria-pressed", on);
      if (sheetAt) renderSheet();
    };
    $("#sheetAdd").onclick = function () { if (sheetAt) { add(sheetAt[0], sheetAt[1]); renderSheet(); } };
    $("#sheetRem").onclick = function () { if (sheetAt) { remove(sheetAt[0], sheetAt[1]); renderSheet(); } };
    $("#sheetClose").onclick = function () { $("#sheet").hidden = true; sheetAt = null; };

    var rt;
    addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(renderTrees, 100); });

    applyLang();
    renderLangBar();
    lv.value = state.level;
    renderClasses();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
