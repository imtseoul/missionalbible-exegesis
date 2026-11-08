/* Search, copy, text size, outline, chapter picker and reading position for current pages (2026-11-08).
   Static; no account or external request. Fixed editions keep the script they were published with.
   Search data comes in two files written by the build: a list (passages, titles, summaries and the 개역개정 chapter
   and verse table) for book and passage searches, and the commentary text, requested only for a word search. */
(function (global) {
  "use strict";
  // Book id, Korean name, and the short names and English names a reader may type.
  const books = [
    ["Gen", "창세기", "창 genesis gen"], ["Exod", "출애굽기", "출 exodus exod"],
    ["Lev", "레위기", "레 leviticus lev"], ["Num", "민수기", "민 numbers num"],
    ["Deut", "신명기", "신 deuteronomy deut"], ["Josh", "여호수아", "수 joshua josh"],
    ["Judg", "사사기", "삿 judges judg"], ["Ruth", "룻기", "룻 ruth"],
    ["1Sam", "사무엘상", "삼상 1samuel 1sam"], ["2Sam", "사무엘하", "삼하 2samuel 2sam"],
    ["1Kgs", "열왕기상", "왕상 1kings 1kgs"], ["2Kgs", "열왕기하", "왕하 2kings 2kgs"],
    ["1Chr", "역대상", "대상 1chronicles 1chr"], ["2Chr", "역대하", "대하 2chronicles 2chr"],
    ["Ezra", "에스라", "스 ezra"], ["Neh", "느헤미야", "느 nehemiah neh"],
    ["Esth", "에스더", "에 esther esth"], ["Job", "욥기", "욥 job"],
    ["Ps", "시편", "시 psalm psalms ps"], ["Prov", "잠언", "잠 proverbs prov"],
    ["Eccl", "전도서", "전 ecclesiastes eccl"], ["Song", "아가", "아 songofsolomon songofsongs song"],
    ["Isa", "이사야", "사 isaiah isa"], ["Jer", "예레미야", "렘 jeremiah jer"],
    ["Lam", "예레미야애가", "애 lamentations lam"], ["Ezek", "에스겔", "겔 ezekiel ezek"],
    ["Dan", "다니엘", "단 daniel dan"], ["Hos", "호세아", "호 hosea hos"],
    ["Joel", "요엘", "욜 joel"], ["Amos", "아모스", "암 amos"],
    ["Obad", "오바댜", "옵 obadiah obad"], ["Jonah", "요나", "욘 jonah"],
    ["Mic", "미가", "미 micah mic"], ["Nah", "나훔", "나 nahum nah"],
    ["Hab", "하박국", "합 habakkuk hab"], ["Zeph", "스바냐", "습 zephaniah zeph"],
    ["Hag", "학개", "학 haggai hag"], ["Zech", "스가랴", "슥 zechariah zech"],
    ["Mal", "말라기", "말 malachi mal"], ["Matt", "마태복음", "마 matthew matt"],
    ["Mark", "마가복음", "막 mark"], ["Luke", "누가복음", "눅 luke"],
    ["John", "요한복음", "요 john"], ["Acts", "사도행전", "행 acts"],
    ["Rom", "로마서", "롬 romans rom"], ["1Cor", "고린도전서", "고전 1corinthians 1cor"],
    ["2Cor", "고린도후서", "고후 2corinthians 2cor"], ["Gal", "갈라디아서", "갈 galatians gal"],
    ["Eph", "에베소서", "엡 ephesians eph"], ["Phil", "빌립보서", "빌 philippians phil"],
    ["Col", "골로새서", "골 colossians col"], ["1Thess", "데살로니가전서", "살전 1thessalonians 1thess"],
    ["2Thess", "데살로니가후서", "살후 2thessalonians 2thess"], ["1Tim", "디모데전서", "딤전 1timothy 1tim"],
    ["2Tim", "디모데후서", "딤후 2timothy 2tim"], ["Titus", "디도서", "딛 titus"],
    ["Phlm", "빌레몬서", "몬 philemon phlm"], ["Heb", "히브리서", "히 hebrews heb"],
    ["Jas", "야고보서", "약 james jas"], ["1Pet", "베드로전서", "벧전 1peter 1pet"],
    ["2Pet", "베드로후서", "벧후 2peter 2pet"], ["1John", "요한일서", "요일 1john"],
    ["2John", "요한이서", "요이 2john"], ["3John", "요한삼서", "요삼 3john"],
    ["Jude", "유다서", "유 jude"], ["Rev", "요한계시록", "계 revelation rev"]
  ];
  const unitOf = (book) => (book === "Ps" ? "편" : "장");
  // Topic particle 은/는 chosen by the final syllable of the word.
  const topic = (word) => {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    return word + (code >= 0 && code <= 11171 && code % 28 ? "은" : "는");
  };
  const normalize = (value) => value.toLocaleLowerCase().replace(/\s+/g, "");
  const aliases = books.flatMap((book) => [book[1], ...book[2].split(" ")].map((alias) => ({ alias, book }))).sort((a, b) => b.alias.length - a.alias.length);
  const shortName = (book) => book[2].split(" ")[0];
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1];
  const compareBound = (a, aSegment, b, bSegment) => compare(a, b) || aSegment.charCodeAt(0) - bSegment.charCodeAt(0);
  const textQuery = (trimmed) => ({ kind: "text", terms: trimmed.toLocaleLowerCase().split(/\s+/).filter(Boolean) });
  const invalid = (message) => ({ kind: "invalid", message });

  /* parseQuery(query, verses): verses is the 개역개정 table { book: [verses in chapter 1, ...] } from the search list.
     Without the table a query naming a book returns { kind: "needs-data" }; ranges are checked only against the table. */
  function parseQuery(query, verses) {
    const trimmed = query.trim();
    if (!trimmed) return { kind: "empty" };
    const compact = normalize(trimmed);
    // Book abbreviations only introduce a passage when followed by a number, a colon or a minus sign before a number
    // ("시 -1" is a chapter out of range, not a word search). "시온" and other words stay word searches.
    const found = aliases.find(({ alias }) => compact === alias || (compact.startsWith(alias) && /^(?:[\d:]|-\d)/.test(compact.slice(alias.length))));
    if (!found) {
      if (/^[\d\s:장편절.-]+$/.test(trimmed)) return invalid("책 이름과 장절을 입력하세요. 예: 시 23:1");
      return textQuery(trimmed);
    }
    const book = found.book;
    let rest = compact.slice(found.alias.length);
    if (!rest) return { kind: "book", book: book[0], label: book[1] };
    // Some titles give the verse range before a vertical separator.
    if (/^\d+:\d+[ab]?(?:-(?:\d+:)?\d+[ab]?)?\|.+/.test(rest)) return textQuery(trimmed);
    if (!verses) return { kind: "needs-data" };
    const counts = verses[book[0]];
    if (!Array.isArray(counts) || !counts.length) throw new Error("verse table lacks " + book[0]);
    const last = counts.length;
    const unit = unitOf(book[0]);
    const example = shortName(book) + " " + (last === 1 ? "1:" + Math.min(3, counts[0]) : "1:3");
    // A chapter below 1, typed with a minus sign, gets the book's chapter range.
    if (/^-\d/.test(rest)) return invalid(topic(book[1]) + " 1" + unit + "부터 " + last + unit + "까지 있습니다.");
    if (last === 1 && /^\d+(?:-\d+)?절$/.test(rest)) rest = "1:" + rest;
    // Korean chapter (장, or 편 for Psalms) and verse notation shares the colon parser.
    rest = rest.replace(/[장편](?=\d)/g, ":").replace(/[장편]$/g, "").replace(/절/g, "");
    const match = rest.match(/^(\d+)(?::(\d+)([ab])?)?(?:-(?:(\d+):)?(\d+)([ab])?)?$/);
    if (!match) return invalid("장과 절을 숫자로 입력하세요. 예: " + example);
    const chapter = Number(match[1]);
    const verse = match[2] ? Number(match[2]) : null;
    const startSegment = match[3];
    const endSegment = match[5] ? match[6] : startSegment;
    let start, end, whole = false;
    if (verse === null) {
      if (match[4] || match[6]) return invalid("장 범위나 장절 범위를 입력하세요. 예: 사 40장, 사 40-41장, 사 40:1-11");
      whole = true;
      start = [chapter, 1];
      end = [match[5] ? Number(match[5]) : chapter, 0];
    } else {
      start = [chapter, verse];
      end = [match[4] ? Number(match[4]) : chapter, match[5] ? Number(match[5]) : verse];
    }
    for (const c of [start[0], end[0]]) {
      if (c < 1) return invalid(topic(book[1]) + " 1" + unit + "부터 " + last + unit + "까지 있습니다.");
      if (c > last) return invalid(topic(book[1]) + " " + last + unit + "까지 있습니다.");
    }
    if (whole) end[1] = counts[end[0] - 1];
    for (const [c, v] of [start, end]) {
      const most = counts[c - 1];
      if (v < 1) return invalid(book[1] + " " + topic(c + unit) + " 1절부터 " + most + "절까지 있습니다.");
      if (v > most) return invalid(book[1] + " " + topic(c + unit) + " " + most + "절까지 있습니다.");
    }
    // Only 베드로후서 2:10 is divided into a and b in the published passages.
    const badSegment = [[start, startSegment], [end, endSegment]].some(([[c, v], segment]) => segment && (book[0] !== "2Pet" || c !== 2 || v !== 10));
    if (badSegment) return invalid("절 번호를 숫자로 입력하세요. 예: " + shortName(book) + " " + start[0] + ":" + start[1]);
    if (compareBound(start, startSegment || "a", end, endSegment || "b") > 0) return invalid("끝 장절을 시작 장절보다 뒤로 입력하세요.");
    const first = start[1] + (startSegment || "");
    const final = end[1] + (endSegment || "");
    let span;
    if (whole) span = start[0] === end[0] ? start[0] + unit : start[0] + "-" + end[0] + unit;
    else if (start[0] === end[0] && first === final) span = start[0] + ":" + first;
    else if (start[0] === end[0]) span = start[0] + ":" + first + "-" + final;
    else span = start[0] + ":" + first + "-" + end[0] + ":" + final;
    return { kind: "passage", book: book[0], label: book[1], display: book[1] + " " + span, start, end, startSegment, endSegment };
  }

  /* search(query, list, text): list = { verses, items }, text = { id: [paragraph, ...] } (needed for word searches). */
  function search(query, list, text) {
    const parsed = parseQuery(query, list.verses);
    const index = list.items;
    let results = [];
    if (parsed.kind === "book") results = index.filter((item) => item.book === parsed.book);
    if (parsed.kind === "passage") {
      results = index.filter((item) => item.book === parsed.book
        && compareBound(item.start, item.start_segment || "a", parsed.end, parsed.endSegment || "b") <= 0
        && compareBound(item.end, item.end_segment || "b", parsed.start, parsed.startSegment || "a") >= 0);
    }
    if (parsed.kind === "text") {
      if (!text) throw new Error("word search needs the commentary text");
      const terms = parsed.terms.map(normalize);
      results = index.map((item, order) => {
        const title = normalize(item.title + " " + item.book_name + " " + item.passage);
        const metadata = normalize(item.description + " " + item.keywords.join(" "));
        const body = normalize((text[item.id] || []).join(" "));
        if (!terms.every((term) => (title + metadata + body).includes(term))) return null;
        const score = terms.reduce((value, term) => value + (title.includes(term) ? 6 : 0) + (metadata.includes(term) ? 3 : 0) + (body.includes(term) ? 1 : 0), 0);
        return { item, order, score };
      }).filter(Boolean).sort((a, b) => b.score - a.score || a.order - b.order).map((result) => result.item);
    }
    return { ...parsed, results };
  }

  global.ExegesisSearch = { parseQuery, search };
  if (typeof document === "undefined") return;

  const root = document.body.dataset.root || "";
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  // Hebrew runs get <bdi lang="he" dir="rtl"> and Greek runs lang="grc", as in the built pages; no control characters.
  const HEBREW = "[\\u034f\\u0591-\\u05c7\\u05d0-\\u05ea\\u05ef-\\u05f4\\ufb1d-\\ufb4f]";
  const GREEK = "[\\u0370-\\u03ff\\u1f00-\\u1fff][\\u0300-\\u036f\\u0370-\\u03ff\\u1f00-\\u1fff]*";
  const scriptRun = new RegExp("(" + HEBREW + "+(?:[ \\u00a0]+" + HEBREW + "+)*)|(" + GREEK + "(?:[ \\u00a0]+" + GREEK + ")*)", "g");
  const appendRich = (parent, text) => {
    let last = 0;
    scriptRun.lastIndex = 0;
    for (let match = scriptRun.exec(text); match; match = scriptRun.exec(text)) {
      if (match.index > last) parent.append(text.slice(last, match.index));
      let run;
      if (match[1]) { run = element("bdi", "", match[0]); run.lang = "he"; run.dir = "rtl"; } else { run = element("span", "", match[0]); run.lang = "grc"; }
      parent.append(run);
      last = match.index + match[0].length;
    }
    if (last < text.length) parent.append(text.slice(last));
    return parent;
  };

  /* Search page. The list loads for any search; the commentary text only for a submitted word search. */
  const searchForm = document.querySelector("form[data-list]");
  const resultArea = document.getElementById("search-results");
  if (searchForm && resultArea) {
    const input = searchForm.querySelector("input[name='q']");
    const status = document.getElementById("search-status");
    const browse = document.getElementById("search-browse");
    const message = document.getElementById(input.id + "-message");
    const hintId = input.id + "-hint";
    const pending = {};
    let token = 0;
    // Each data file is inserted once; a failed request is removed so a retry requests it again.
    const load = (key, globalName) => {
      if (global[globalName]) return Promise.resolve(global[globalName]);
      if (!pending[key]) {
        pending[key] = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = searchForm.dataset[key];
          script.async = true;
          script.onload = () => (global[globalName] ? resolve(global[globalName]) : reject(new Error(key)));
          script.onerror = () => { script.remove(); reject(new Error(key)); };
          document.head.append(script);
        }).catch((error) => { pending[key] = null; throw error; });
      }
      return pending[key];
    };
    const loadList = () => load("list", "EXEGESIS_SEARCH_LIST");
    const loadText = () => load("text", "EXEGESIS_SEARCH_TEXT");
    const showMessage = (text) => {
      message.textContent = text;
      message.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", message.id + " " + hintId);
    };
    const clearMessage = () => {
      message.textContent = "";
      message.hidden = true;
      input.removeAttribute("aria-invalid");
      input.setAttribute("aria-describedby", hintId);
    };
    const excerpt = (paragraphs, terms) => {
      const hit = paragraphs.find((paragraph) => terms.some((term) => paragraph.toLocaleLowerCase().includes(term)));
      if (!hit) return null;
      const lower = hit.toLocaleLowerCase();
      const positions = terms.map((term) => lower.indexOf(term)).filter((position) => position >= 0);
      if (!positions.length) return null;
      const first = Math.max(0, Math.min(...positions) - 35);
      const last = Math.min(hit.length, first + 150);
      const paragraph = element("p", "search-excerpt");
      if (first) paragraph.append("…");
      const slice = hit.slice(first, last);
      const sliceLower = lower.slice(first, last);
      // Mark every occurrence of a term; lowercase and original text have the same length for Korean and Latin.
      let cursor = 0;
      if (sliceLower.length === slice.length) {
        while (cursor < slice.length) {
          let next = -1, length = 0;
          for (const term of terms) {
            const at = sliceLower.indexOf(term, cursor);
            if (at >= 0 && (next < 0 || at < next || (at === next && term.length > length))) { next = at; length = term.length; }
          }
          if (next < 0) break;
          if (next > cursor) appendRich(paragraph, slice.slice(cursor, next));
          paragraph.append(appendRich(element("mark"), slice.slice(next, next + length)));
          cursor = next + length;
        }
      }
      if (cursor < slice.length) appendRich(paragraph, slice.slice(cursor));
      if (last < hit.length) paragraph.append("…");
      return paragraph;
    };
    const panel = (text, error) => {
      const box = element("div", "search-panel" + (error ? " is-error" : ""));
      box.append(element("p", "", text));
      return box;
    };
    const destination = (href, label) => {
      const anchor = element("a", "search-panel-link", label);
      anchor.href = href;
      return anchor;
    };
    // The panel after a passage or book search names the place to read next: the book's list, or the full list.
    const emptyPanel = (outcome, list) => {
      if (outcome.kind === "text") return panel("검색어에 맞는 주해가 없습니다. 다른 단어로 찾아보세요.");
      const box = panel(outcome.kind === "book" ? outcome.label + "의 주해가 아직 없습니다." : outcome.display + "의 주해가 아직 없습니다.");
      const hasBook = list.items.some((item) => item.book === outcome.book);
      box.append(hasBook ? destination(root + "books/" + outcome.book.toLowerCase() + "/index.html", outcome.label + " 주해 보기") : destination(root + "index.html", "성경별 목록"));
      return box;
    };
    const fail = (current) => {
      if (current !== token) return;
      resultArea.removeAttribute("aria-busy");
      const box = panel("검색 자료를 불러오지 못했습니다.", true);
      const retry = element("button", "", "다시 시도");
      retry.type = "button";
      retry.addEventListener("click", () => { render(input.value); });
      box.append(retry);
      status.replaceChildren(box);
      browse.hidden = false;
    };
    const render = async (value) => {
      const current = ++token;
      const query = value.trim();
      clearMessage();
      resultArea.replaceChildren();
      resultArea.removeAttribute("aria-busy");
      status.replaceChildren();
      const first = parseQuery(value);
      if (first.kind === "empty") { browse.hidden = false; return; }
      if (first.kind === "invalid") { showMessage(first.message); browse.hidden = false; return; }
      status.textContent = "검색 중…";
      resultArea.setAttribute("aria-busy", "true");
      let list, text;
      try {
        list = await loadList();
        if (first.kind === "text") text = await loadText();
      } catch (_) { fail(current); return; }
      if (current !== token) return;
      resultArea.removeAttribute("aria-busy");
      status.replaceChildren();
      const outcome = search(value, list, text);
      if (outcome.kind === "invalid") { showMessage(outcome.message); browse.hidden = false; return; }
      if (!outcome.results.length) {
        status.replaceChildren(emptyPanel(outcome, list));
        browse.hidden = false;
        return;
      }
      browse.hidden = true;
      const named = outcome.kind === "passage" ? outcome.display : outcome.kind === "book" ? outcome.label : query;
      status.textContent = "“" + named + "” 검색 결과 " + outcome.results.length + "개 단락";
      const rows = element("ol", "result-list");
      for (const item of outcome.results) {
        const entry = element("li", "result");
        const heading = element("h2");
        const anchor = appendRich(element("a"), item.title);
        anchor.href = root + item.path + "index.html";
        heading.append(anchor);
        entry.append(element("p", "result-ref", item.passage), heading, appendRich(element("p", "result-description"), item.description));
        if (outcome.kind === "text") {
          const snippet = excerpt(text[item.id] || [], outcome.terms);
          if (snippet) entry.append(snippet);
        }
        rows.append(entry);
      }
      resultArea.append(rows);
    };
    const go = (value) => {
      if (!value.trim()) {
        render("");
        showMessage("찾을 말을 입력하세요");
        input.focus();
        return;
      }
      const url = new URL(global.location.href);
      url.searchParams.set("q", value.trim());
      try { global.history.pushState({}, "", url); } catch (_) { global.location.search = url.search; return; }
      render(value);
    };
    input.value = new URLSearchParams(global.location.search).get("q") || "";
    render(input.value);
    searchForm.addEventListener("submit", (event) => { event.preventDefault(); go(input.value); });
    // Typing can only start the small list; the commentary text waits for a submitted word search.
    input.addEventListener("input", () => { if (input.value.trim()) loadList().catch(() => {}); if (input.getAttribute("aria-invalid")) clearMessage(); });
    // Example links in the form run the search in place.
    document.addEventListener("click", (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("[data-example]") : null;
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      input.value = anchor.textContent;
      go(input.value);
    });
    global.addEventListener("popstate", () => {
      input.value = new URLSearchParams(global.location.search).get("q") || "";
      render(input.value);
    });
  }

  const phone = typeof global.matchMedia === "function" ? global.matchMedia("(max-width: 767px)") : { matches: false };

  /* Book page chapter links. From 768px the row is always open; on phones "장 선택" opens a grid and a choice closes it.
     The native disclosure and the anchor links work without this script. */
  const picker = document.querySelector("[data-chapter-picker]");
  if (picker) {
    const sync = () => { if (!phone.matches) picker.open = true; };
    sync();
    if (typeof phone.addEventListener === "function") phone.addEventListener("change", () => { picker.open = !phone.matches; });
    picker.addEventListener("click", (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
      if (anchor && phone.matches) picker.open = false;
    });
  }
  const jumpLinks = Array.from(document.querySelectorAll(".chip-row a[href^='#']"));
  if (jumpLinks.length) {
    const targetOf = (anchor) => document.getElementById(decodeURIComponent(anchor.getAttribute("href").slice(1)));
    const ids = Array.from(new Set(jumpLinks.map((anchor) => anchor.getAttribute("href").slice(1))));
    const targets = ids.map((id) => document.getElementById(decodeURIComponent(id))).filter(Boolean);
    let marked = null;
    let queued = false;
    const spy = () => {
      queued = false;
      const viewport = global.innerHeight || document.documentElement.clientHeight;
      let found = null;
      targets.forEach((target) => { if (target.getBoundingClientRect().top <= Math.min(200, viewport * 0.35)) found = target; });
      if (found === marked) return;
      marked = found;
      jumpLinks.forEach((anchor) => {
        if (found && targetOf(anchor) === found) anchor.setAttribute("aria-current", "location"); else anchor.removeAttribute("aria-current");
      });
    };
    const queue = () => { if (!queued) { queued = true; global.requestAnimationFrame(spy); } };
    if (targets.length === ids.length) {
      global.addEventListener("scroll", queue, { passive: true });
      global.addEventListener("resize", queue);
      spy();
    }
  }

  /* Reading tools (copy and text size). From 768px the panel is always shown: beside the text from 1200px,
     under the Bible links below that. On phones it opens as a sheet from the button in the reading bar.
     Without scripts the button and panel stay hidden; the commentary itself needs neither. */
  const toolsToggle = document.querySelector("[data-tools-toggle]");
  const toolsPanel = toolsToggle ? document.getElementById(toolsToggle.getAttribute("aria-controls")) : null;
  if (toolsToggle && toolsPanel) {
    const closeButton = toolsPanel.querySelector("[data-tools-close]");
    const toolsOpen = () => toolsToggle.getAttribute("aria-expanded") === "true";
    const setTools = (open, returnFocus) => {
      toolsToggle.setAttribute("aria-expanded", open ? "true" : "false");
      toolsPanel.classList.toggle("is-sheet-open", open);
      toolsPanel.hidden = phone.matches ? !open : false;
      if (open && phone.matches) {
        const first = toolsPanel.querySelector("button");
        if (first) first.focus();
      }
      if (!open && returnFocus && phone.matches) toolsToggle.focus();
    };
    const layout = () => {
      toolsToggle.hidden = !phone.matches;
      if (!phone.matches) {
        toolsToggle.setAttribute("aria-expanded", "false");
        toolsPanel.classList.remove("is-sheet-open");
        toolsPanel.hidden = false;
      } else {
        toolsPanel.hidden = !toolsOpen();
      }
    };
    layout();
    if (typeof phone.addEventListener === "function") phone.addEventListener("change", layout);
    toolsToggle.addEventListener("click", () => setTools(!toolsOpen(), false));
    if (closeButton) closeButton.addEventListener("click", () => setTools(false, true));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toolsOpen() && !event.defaultPrevented) { event.preventDefault(); setTools(false, true); }
    });
    document.addEventListener("click", (event) => {
      if (!toolsOpen() || !(event.target instanceof Node)) return;
      if (!toolsPanel.contains(event.target) && !toolsToggle.contains(event.target)) setTools(false, false);
    });
  }

  /* The book's passage list in the wide-screen rail: when opened, bring the current passage into view. */
  const railBook = document.querySelector(".rail-book");
  if (railBook) {
    // Only the rail scrolls; the page stays where it is.
    const rail = railBook.closest(".rail");
    railBook.addEventListener("toggle", () => {
      const currentLink = railBook.open ? railBook.querySelector("a[aria-current]") : null;
      if (!currentLink || !rail || rail.scrollHeight <= rail.clientHeight) return;
      const offset = currentLink.getBoundingClientRect().top - rail.getBoundingClientRect().top;
      if (offset > rail.clientHeight - 64) rail.scrollTop += offset - rail.clientHeight / 2;
    });
  }

  /* Copy the plain commentary text, including pointed Hebrew, exactly as published.
     The fallback panel sits outside the tools panel, so it stays usable after the tools close. */
  const copyButton = document.querySelector("[data-copy-article]");
  const copySource = document.getElementById("article-copy-text");
  if (copyButton && copySource) {
    const status = document.getElementById("copy-status");
    const panel = document.getElementById("copy-fallback");
    const area = document.getElementById("copy-text");
    const closeButton = document.querySelector("[data-close-copy]");
    const idleLabel = copyButton.textContent;
    let copyText = "";
    let timer = null;
    try {
      const parsed = JSON.parse(copySource.textContent || "");
      if (typeof parsed === "string") copyText = parsed;
      else if (parsed && typeof parsed.text === "string") copyText = parsed.text;
    } catch (_) { copyText = ""; }
    const say = (text, error) => {
      if (!status) return;
      status.textContent = text;
      status.classList.toggle("is-error", Boolean(error));
    };
    const legacyCopy = () => {
      const temp = document.createElement("textarea");
      temp.value = copyText;
      temp.setAttribute("readonly", "");
      temp.style.position = "fixed"; temp.style.top = "0"; temp.style.left = "-9999px"; temp.style.opacity = "0";
      document.body.append(temp);
      temp.select();
      let copied = false;
      try { copied = document.execCommand("copy") === true; } catch (_) { copied = false; }
      temp.remove();
      copyButton.focus();
      return copied;
    };
    const closePanel = () => {
      if (!panel || panel.hidden) return;
      panel.hidden = true;
      if (copyButton.offsetParent !== null) copyButton.focus();
      else if (toolsToggle && !toolsToggle.hidden) toolsToggle.focus();
    };
    const openPanel = () => {
      if (!panel || !area) { say("주해를 직접 선택해 복사하세요.", true); return; }
      say("주해를 복사하지 못했습니다. 아래 글을 선택해 복사하세요.", true);
      // On phones the tools sheet would cover the text box, so it closes first.
      if (toolsToggle && toolsToggle.getAttribute("aria-expanded") === "true") toolsToggle.click();
      area.value = copyText;
      panel.hidden = false;
      area.focus();
      area.select();
    };
    copyButton.addEventListener("click", async () => {
      say("");
      global.clearTimeout(timer);
      copyButton.textContent = idleLabel;
      if (!copyText) { say("주해를 직접 선택해 복사하세요.", true); return; }
      let copied = false;
      if (global.navigator.clipboard && typeof global.navigator.clipboard.writeText === "function") {
        try { await global.navigator.clipboard.writeText(copyText); copied = true; } catch (_) { copied = false; }
      }
      if (!copied) copied = legacyCopy();
      if (copied) {
        if (panel) panel.hidden = true;
        copyButton.textContent = "복사했습니다";
        say("주해를 복사했습니다.");
        timer = global.setTimeout(() => { copyButton.textContent = idleLabel; say(""); }, 1500);
      } else {
        openPanel();
      }
    });
    if (closeButton) closeButton.addEventListener("click", closePanel);
    if (panel) panel.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); closePanel(); } });
  }

  const article = document.querySelector(".article-body");
  if (!article) return;

  /* Text size: three steps on <html data-text-size>, kept in this browser only. */
  const sizeKey = "exegesis-text-size";
  const sizeButtons = Array.from(document.querySelectorAll("button[data-text-size]"));
  const applySize = (size) => {
    if (size === "s" || size === "l") document.documentElement.setAttribute("data-text-size", size);
    else document.documentElement.removeAttribute("data-text-size");
    const active = size === "s" || size === "l" ? size : "m";
    sizeButtons.forEach((button) => button.setAttribute("aria-pressed", button.dataset.textSize === active ? "true" : "false"));
  };
  applySize(document.documentElement.getAttribute("data-text-size") || "m");
  sizeButtons.forEach((button) => button.addEventListener("click", () => {
    const size = button.dataset.textSize;
    applySize(size);
    try {
      if (size === "m") global.localStorage.removeItem(sizeKey); else global.localStorage.setItem(sizeKey, size);
    } catch (_) { /* The size still applies to this page. */ }
  }));

  /* Narrow-screen outline: a panel under the bar. Escape closes it and returns focus to the button. */
  const bar = document.querySelector("[data-reading-bar]");
  const toggle = bar ? bar.querySelector(".bar-toggle") : null;
  const outline = toggle ? document.getElementById(toggle.getAttribute("aria-controls")) : null;
  const isOpen = () => toggle && toggle.getAttribute("aria-expanded") === "true";
  const setOpen = (open, returnFocus) => {
    if (!toggle || !outline) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    outline.classList.toggle("is-open", open);
    if (!open && returnFocus) toggle.focus();
  };
  if (toggle && outline) {
    toggle.hidden = false;
    toggle.addEventListener("click", () => setOpen(!isOpen(), false));
    outline.querySelectorAll("a").forEach((anchor) => anchor.addEventListener("click", () => setOpen(false, false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !event.defaultPrevented && isOpen()) { event.preventDefault(); setOpen(false, true); }
    });
    document.addEventListener("click", (event) => { if (isOpen() && !bar.contains(event.target)) setOpen(false, false); });
    global.addEventListener("resize", () => { if (isOpen() && bar.offsetParent === null) setOpen(false, false); });
  }

  /* Reading position: the rail outline and the bar name the part in view; a thin line shows progress. */
  const sections = Array.from(document.querySelectorAll(".reading-section[id], .article-related[id], .article-sources[id]"));
  const tocLinks = Array.from(document.querySelectorAll("[data-toc]"));
  const label = document.querySelector("[data-current-label]");
  const titleOf = (id) => {
    const anchor = tocLinks.find((link) => link.dataset.toc === id);
    const title = anchor && anchor.querySelector(".toc-title");
    return title ? title.textContent : "";
  };
  let currentId;
  const mark = (id) => {
    if (id === currentId) return;
    currentId = id;
    tocLinks.forEach((anchor) => {
      if (id && anchor.dataset.toc === id) anchor.setAttribute("aria-current", "location");
      else anchor.removeAttribute("aria-current");
    });
    if (label) label.textContent = titleOf(id || (sections[0] && sections[0].id));
  };
  const visible = new Set();
  const pick = () => {
    const doc = document.documentElement;
    const viewport = global.innerHeight || doc.clientHeight;
    const scrollTop = global.scrollY || doc.scrollTop;
    // At the very end the closing parts may never reach the reading line.
    if (doc.scrollHeight > viewport + 2 && scrollTop + viewport >= doc.scrollHeight - 4) {
      const last = sections.filter((section) => section.getBoundingClientRect().top < viewport).pop();
      if (last) { mark(last.id); return; }
    }
    const first = sections.find((section) => visible.has(section));
    if (first) { mark(first.id); return; }
    if (sections[0] && sections[0].getBoundingClientRect().top > 80) mark(null);
  };
  let scheduled = false;
  const progress = () => {
    scheduled = false;
    pick();
    if (!bar || bar.offsetParent === null) return;
    const viewport = global.innerHeight || document.documentElement.clientHeight;
    const box = article.getBoundingClientRect();
    const height = bar.offsetHeight;
    const span = Math.max(1, box.height - viewport + height);
    const share = Math.max(0, Math.min(1, (height - box.top) / span));
    bar.style.setProperty("--reading-progress", (share * 100).toFixed(1) + "%");
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    if (typeof global.requestAnimationFrame === "function") global.requestAnimationFrame(progress); else global.setTimeout(progress, 50);
  };
  if (sections.length && tocLinks.length) {
    if (typeof global.IntersectionObserver === "function") {
      const observer = new global.IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); });
        schedule();
      }, { rootMargin: "-80px 0px -60% 0px" });
      sections.forEach((section) => observer.observe(section));
    } else {
      // Older browsers: compare section tops with the same reading line.
      const line = () => {
        visible.clear();
        const viewport = global.innerHeight || document.documentElement.clientHeight;
        sections.forEach((section) => {
          const box = section.getBoundingClientRect();
          if (box.top < viewport * 0.4 && box.bottom > 80) visible.add(section);
        });
      };
      global.addEventListener("scroll", line, { passive: true });
      line();
    }
    global.addEventListener("scroll", schedule, { passive: true });
    global.addEventListener("resize", schedule);
    global.addEventListener("hashchange", schedule);
    global.addEventListener("load", schedule);
    schedule();
  }
})(typeof window === "undefined" ? globalThis : window);
