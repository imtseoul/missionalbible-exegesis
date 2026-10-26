/* Search, copy, text size and reading position for current pages. Static; no account or external request. */
(function (global) {
  "use strict";
  const books = [
    ["Gen", "창세기", 50, "창 genesis gen"], ["Exod", "출애굽기", 40, "출 exodus exod"],
    ["Lev", "레위기", 27, "레 leviticus lev"], ["Num", "민수기", 36, "민 numbers num"],
    ["Deut", "신명기", 34, "신 deuteronomy deut"], ["Josh", "여호수아", 24, "수 joshua josh"],
    ["Judg", "사사기", 21, "삿 judges judg"], ["Ruth", "룻기", 4, "룻 ruth"],
    ["1Sam", "사무엘상", 31, "삼상 1samuel 1sam"], ["2Sam", "사무엘하", 24, "삼하 2samuel 2sam"],
    ["1Kgs", "열왕기상", 22, "왕상 1kings 1kgs"], ["2Kgs", "열왕기하", 25, "왕하 2kings 2kgs"],
    ["1Chr", "역대상", 29, "대상 1chronicles 1chr"], ["2Chr", "역대하", 36, "대하 2chronicles 2chr"],
    ["Ezra", "에스라", 10, "스 ezra"], ["Neh", "느헤미야", 13, "느 nehemiah neh"],
    ["Esth", "에스더", 10, "에 esther esth"], ["Job", "욥기", 42, "욥 job"],
    ["Ps", "시편", 150, "시 psalm psalms ps"], ["Prov", "잠언", 31, "잠 proverbs prov"],
    ["Eccl", "전도서", 12, "전 ecclesiastes eccl"], ["Song", "아가", 8, "아 songofsolomon songofsongs song"],
    ["Isa", "이사야", 66, "사 isaiah isa"], ["Jer", "예레미야", 52, "렘 jeremiah jer"],
    ["Lam", "예레미야애가", 5, "애 lamentations lam"], ["Ezek", "에스겔", 48, "겔 ezekiel ezek"],
    ["Dan", "다니엘", 12, "단 daniel dan"], ["Hos", "호세아", 14, "호 hosea hos"],
    ["Joel", "요엘", 3, "욜 joel"], ["Amos", "아모스", 9, "암 amos"],
    ["Obad", "오바댜", 1, "옵 obadiah obad"], ["Jonah", "요나", 4, "욘 jonah"],
    ["Mic", "미가", 7, "미 micah mic"], ["Nah", "나훔", 3, "나 nahum nah"],
    ["Hab", "하박국", 3, "합 habakkuk hab"], ["Zeph", "스바냐", 3, "습 zephaniah zeph"],
    ["Hag", "학개", 2, "학 haggai hag"], ["Zech", "스가랴", 14, "슥 zechariah zech"],
    ["Mal", "말라기", 4, "말 malachi mal"], ["Matt", "마태복음", 28, "마 matthew matt"],
    ["Mark", "마가복음", 16, "막 mark"], ["Luke", "누가복음", 24, "눅 luke"],
    ["John", "요한복음", 21, "요 john"], ["Acts", "사도행전", 28, "행 acts"],
    ["Rom", "로마서", 16, "롬 romans rom"], ["1Cor", "고린도전서", 16, "고전 1corinthians 1cor"],
    ["2Cor", "고린도후서", 13, "고후 2corinthians 2cor"], ["Gal", "갈라디아서", 6, "갈 galatians gal"],
    ["Eph", "에베소서", 6, "엡 ephesians eph"], ["Phil", "빌립보서", 4, "빌 philippians phil"],
    ["Col", "골로새서", 4, "골 colossians col"], ["1Thess", "데살로니가전서", 5, "살전 1thessalonians 1thess"],
    ["2Thess", "데살로니가후서", 3, "살후 2thessalonians 2thess"], ["1Tim", "디모데전서", 6, "딤전 1timothy 1tim"],
    ["2Tim", "디모데후서", 4, "딤후 2timothy 2tim"], ["Titus", "디도서", 3, "딛 titus"],
    ["Phlm", "빌레몬서", 1, "몬 philemon phlm"], ["Heb", "히브리서", 13, "히 hebrews heb"],
    ["Jas", "야고보서", 5, "약 james jas"], ["1Pet", "베드로전서", 5, "벧전 1peter 1pet"],
    ["2Pet", "베드로후서", 3, "벧후 2peter 2pet"], ["1John", "요한일서", 5, "요일 1john"],
    ["2John", "요한이서", 1, "요이 2john"], ["3John", "요한삼서", 1, "요삼 3john"],
    ["Jude", "유다서", 1, "유 jude"], ["Rev", "요한계시록", 22, "계 revelation rev"]
  ];
  // Verse totals follow 개역개정 numbering (Psalm titles are not numbered as verses).
  const chaptersFrom = (first, counts) => Object.fromEntries(counts.map((count, index) => [first + index, count]));
  const verseCounts = {
    "2Cor": chaptersFrom(1, [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 13]),
    "Phlm": chaptersFrom(1, [25]),
    "Amos": chaptersFrom(1, [15, 16, 15, 13, 27, 14, 17, 14, 15]),
    "Mic": chaptersFrom(1, [16, 13, 12, 13, 15, 16, 20]),
    "Isa": chaptersFrom(40, [31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24]),
    "Ps": chaptersFrom(20, [9, 13, 31, 6, 10, 22])
  };
  const versesIn = (book, chapter) => (verseCounts[book] || {})[chapter] || 176;
  const unitOf = (book) => (book === "Ps" ? "편" : "장");
  // Topic particle 은/는 chosen by the final syllable of the book name.
  const topic = (name) => {
    const code = name.charCodeAt(name.length - 1) - 0xac00;
    return name + (code >= 0 && code <= 11171 && code % 28 ? "은" : "는");
  };
  const normalize = (value) => value.toLocaleLowerCase().replace(/\s+/g, "");
  const aliases = books.flatMap((book) => [book[1], ...book[3].split(" ")].map((alias) => ({ alias, book }))).sort((a, b) => b.alias.length - a.alias.length);
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1];

  function parseQuery(query) {
    const trimmed = query.trim();
    if (!trimmed) return { kind: "empty" };
    const compact = normalize(trimmed);
    // Book abbreviations only introduce a passage when followed by a number.
    const found = aliases.find(({ alias }) => compact === alias || (compact.startsWith(alias) && /^[\d:]/.test(compact.slice(alias.length))));
    if (!found) {
      if (/^[\d\s:장편절.-]+$/.test(trimmed)) return { kind: "invalid", message: "책 이름과 장절을 함께 입력하세요. 예: 시 23:1, 고후 1:3" };
      return { kind: "text", terms: trimmed.toLocaleLowerCase().split(/\s+/).filter(Boolean) };
    }
    const book = found.book;
    let rest = compact.slice(found.alias.length);
    if (!rest) return { kind: "book", book: book[0], label: book[1] };
    if (book[2] === 1 && /^\d+(?:-\d+)?절$/.test(rest)) rest = "1:" + rest;
    // Korean chapter (장, or 편 for Psalms) and verse notation shares the colon parser.
    rest = rest.replace(/[장편](?=\d)/g, ":").replace(/[장편]$/g, "").replace(/절/g, "");
    const match = rest.match(/^(\d+)(?::(\d+))?(?:-(?:(\d+):)?(\d+))?$/);
    if (!match) return { kind: "invalid", message: "장절 형식을 확인하세요. 예: 시 23:1, 시편 23편, 고린도후서 3장" };
    const chapter = Number(match[1]);
    const verse = match[2] ? Number(match[2]) : null;
    let start, end;
    if (verse === null) {
      if (match[3]) return { kind: "invalid", message: "장 범위나 장절 범위를 입력하세요. 예: 사 40장 또는 사 40:1-11" };
      start = [chapter, 1];
      const endChapter = match[4] ? Number(match[4]) : chapter;
      end = [endChapter, versesIn(book[0], endChapter)];
    } else {
      start = [chapter, verse];
      end = [match[3] ? Number(match[3]) : chapter, match[4] ? Number(match[4]) : verse];
    }
    const invalid = [start, end].some(([c, v]) => c < 1 || c > book[2] || v < 1 || v > versesIn(book[0], c));
    if (invalid || compare(start, end) > 0) return { kind: "invalid", message: "장과 절의 범위를 확인하세요. " + topic(book[1]) + " " + book[2] + unitOf(book[0]) + "까지 있습니다." };
    return { kind: "passage", book: book[0], label: book[1], start, end };
  }

  function search(query, index) {
    const parsed = parseQuery(query);
    let results = [];
    if (parsed.kind === "book") results = index.filter((item) => item.book === parsed.book);
    if (parsed.kind === "passage") results = index.filter((item) => item.book === parsed.book && compare(item.start, parsed.end) <= 0 && compare(item.end, parsed.start) >= 0);
    if (parsed.kind === "text") {
      const terms = parsed.terms.map(normalize);
      results = index.map((item, order) => {
        const title = normalize(item.title + " " + item.book_name + " " + item.passage);
        const metadata = normalize(item.description + " " + item.keywords.join(" "));
        const text = normalize(item.text);
        if (!terms.every((term) => (title + metadata + text).includes(term))) return null;
        const score = terms.reduce((value, term) => value + (title.includes(term) ? 6 : 0) + (metadata.includes(term) ? 3 : 0) + (text.includes(term) ? 1 : 0), 0);
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

  /* Search page: the offline index is inserted only when a query needs it. */
  const searchForm = document.querySelector("form[data-index]");
  const resultArea = document.getElementById("search-results");
  if (searchForm && resultArea) {
    const input = searchForm.querySelector("input[name='q']");
    const status = document.getElementById("search-status");
    const browse = document.getElementById("search-browse");
    let pending = null;
    let token = 0;
    const loadIndex = () => {
      if (Array.isArray(global.EXEGESIS_SEARCH_INDEX)) return Promise.resolve(global.EXEGESIS_SEARCH_INDEX);
      if (!pending) {
        pending = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = searchForm.dataset.index;
          script.async = true;
          script.onload = () => (Array.isArray(global.EXEGESIS_SEARCH_INDEX) ? resolve(global.EXEGESIS_SEARCH_INDEX) : reject(new Error("index")));
          script.onerror = () => { script.remove(); reject(new Error("index")); };
          document.head.append(script);
        }).catch((error) => { pending = null; throw error; });
      }
      return pending;
    };
    const excerpt = (item, terms) => {
      const paragraphs = item.sections.flatMap((section) => section.paragraphs);
      const hit = paragraphs.find((paragraph) => terms.some((term) => paragraph.toLocaleLowerCase().includes(term)));
      if (!hit) return null;
      const clean = hit.replace(/\[[A-Za-z][A-Za-z0-9_-]*\]/g, "");
      const lower = clean.toLocaleLowerCase();
      const positions = terms.map((term) => lower.indexOf(term)).filter((position) => position >= 0);
      if (!positions.length) return null;
      const first = Math.max(0, Math.min(...positions) - 35);
      const last = Math.min(clean.length, first + 150);
      const paragraph = element("p", "search-excerpt");
      if (first) paragraph.append("…");
      const slice = clean.slice(first, last);
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
          if (next > cursor) paragraph.append(slice.slice(cursor, next));
          paragraph.append(element("mark", "", slice.slice(next, next + length)));
          cursor = next + length;
        }
      }
      if (cursor < slice.length) paragraph.append(slice.slice(cursor));
      if (last < clean.length) paragraph.append("…");
      return paragraph;
    };
    const recover = () => {
      const note = element("p", "search-recover");
      const anchor = element("a", "", "성경별 목록에서 찾기");
      anchor.href = root + "index.html";
      note.append(anchor);
      return note;
    };
    const render = async (value) => {
      const current = ++token;
      const parsed = parseQuery(value);
      resultArea.replaceChildren();
      resultArea.removeAttribute("aria-busy");
      if (parsed.kind === "empty") { status.textContent = "구절이나 단어를 입력하세요."; browse.hidden = false; return; }
      if (parsed.kind === "invalid") { status.textContent = parsed.message; browse.hidden = false; return; }
      status.textContent = "검색 자료를 불러오는 중입니다.";
      resultArea.setAttribute("aria-busy", "true");
      let index;
      try { index = await loadIndex(); } catch (_) {
        if (current !== token) return;
        resultArea.removeAttribute("aria-busy");
        status.textContent = "검색 자료를 열 수 없습니다. 아래 수록된 주해에서 선택하세요.";
        browse.hidden = false;
        return;
      }
      if (current !== token) return;
      resultArea.removeAttribute("aria-busy");
      const outcome = search(value, index);
      if (!outcome.results.length) {
        status.textContent = outcome.kind === "text"
          ? "“" + value.trim() + "”을 포함한 주해가 없습니다. 다른 단어로 찾아보세요."
          : "“" + value.trim() + "”에 해당하는 주해가 없습니다. 아래 수록된 주해에서 찾아보세요.";
        browse.hidden = false;
        resultArea.append(recover());
        return;
      }
      browse.hidden = true;
      status.textContent = "“" + value.trim() + "” 검색 결과 " + outcome.results.length + "개 단락";
      const list = element("ol", "result-list");
      for (const item of outcome.results) {
        const entry = element("li", "result");
        const heading = element("h2");
        const anchor = element("a", "", item.title);
        anchor.href = root + item.path + "index.html";
        heading.append(anchor);
        entry.append(element("p", "result-ref", item.passage), heading, element("p", "result-description", item.description));
        if (outcome.kind === "text") {
          const snippet = excerpt(item, outcome.terms);
          if (snippet) entry.append(snippet);
        }
        list.append(entry);
      }
      resultArea.append(list);
    };
    const go = (value) => {
      const url = new URL(global.location.href);
      if (value.trim()) url.searchParams.set("q", value.trim()); else url.searchParams.delete("q");
      try { global.history.pushState({}, "", url); } catch (_) { global.location.search = url.search; return; }
      render(value);
    };
    input.value = new URLSearchParams(global.location.search).get("q") || "";
    render(input.value);
    searchForm.addEventListener("submit", (event) => { event.preventDefault(); go(input.value); });
    input.addEventListener("input", () => { if (input.value.trim()) loadIndex().catch(() => {}); }, { once: true });
    searchForm.querySelectorAll("[data-example]").forEach((anchor) => anchor.addEventListener("click", (event) => {
      event.preventDefault();
      input.value = anchor.textContent;
      go(input.value);
    }));
    global.addEventListener("popstate", () => {
      input.value = new URLSearchParams(global.location.search).get("q") || "";
      render(input.value);
    });
  }

  /* Copy the plain commentary text, including pointed Hebrew, exactly as published. */
  const copyButton = document.querySelector("[data-copy-article]");
  const copySource = document.getElementById("article-copy-text");
  if (copyButton && copySource) {
    const status = document.getElementById("copy-status");
    const panel = document.getElementById("copy-fallback");
    const area = document.getElementById("copy-text");
    const closeButton = document.querySelector("[data-close-copy]");
    let copyText = "";
    try {
      const parsed = JSON.parse(copySource.textContent || "");
      if (typeof parsed === "string") copyText = parsed;
      else if (parsed && typeof parsed.text === "string") copyText = parsed.text;
    } catch (_) { copyText = ""; }
    const say = (message) => { if (status) status.textContent = message; };
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
      copyButton.focus();
    };
    const openPanel = () => {
      if (!panel || !area) { say("이 브라우저에서는 자동 복사를 할 수 없습니다. 본문을 직접 선택해 복사하세요."); return; }
      area.value = copyText;
      panel.hidden = false;
      area.focus();
      area.select();
      say("자동 복사가 되지 않았습니다. 선택된 글을 Ctrl+C 또는 Cmd+C로 복사하세요.");
    };
    copyButton.addEventListener("click", async () => {
      say("");
      if (!copyText) { say("복사할 본문을 불러오지 못했습니다."); return; }
      let copied = false;
      if (global.navigator.clipboard && typeof global.navigator.clipboard.writeText === "function") {
        try { await global.navigator.clipboard.writeText(copyText); copied = true; } catch (_) { copied = false; }
      }
      if (!copied) copied = legacyCopy();
      if (copied) {
        if (panel) panel.hidden = true;
        say("해설 본문을 복사했습니다.");
      } else {
        openPanel();
      }
    });
    if (closeButton) closeButton.addEventListener("click", closePanel);
    if (panel) panel.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); closePanel(); } });
  }

  /* Home and book rails: mark the book or chapter group in view. */
  const railLinks = Array.from(document.querySelectorAll(".rail .rail-list a[href^='#']"));
  if (railLinks.length) {
    const targets = railLinks.map((anchor) => document.getElementById(decodeURIComponent(anchor.getAttribute("href").slice(1)))).filter(Boolean);
    let marked = null;
    let queued = false;
    const spy = () => {
      queued = false;
      const viewport = global.innerHeight || document.documentElement.clientHeight;
      let index = -1;
      targets.forEach((target, position) => { if (target.getBoundingClientRect().top <= Math.min(200, viewport * 0.35)) index = position; });
      const next = index >= 0 ? railLinks[index] : null;
      if (next === marked) return;
      if (marked) marked.removeAttribute("aria-current");
      if (next) next.setAttribute("aria-current", "location");
      marked = next;
    };
    const queue = () => { if (!queued) { queued = true; global.requestAnimationFrame(spy); } };
    if (targets.length === railLinks.length) {
      global.addEventListener("scroll", queue, { passive: true });
      global.addEventListener("resize", queue);
      spy();
    }
  }

  const article = document.querySelector(".article-body");
  if (!article) return;

  /* Text size: -2px to +4px around the default, kept between visits. */
  const clampFont = (value) => Math.max(-2, Math.min(4, Math.round(Number(value) || 0)));
  let adjustment = 0;
  try { adjustment = clampFont(global.localStorage.getItem("exegesis-font-adjustment")); } catch (_) { adjustment = 0; }
  const fontButtons = Array.from(document.querySelectorAll("[data-font]"));
  const applyFont = () => {
    document.documentElement.style.setProperty("--font-adjustment", adjustment + "px");
    fontButtons.forEach((button) => {
      const action = button.dataset.font;
      const limit = (action === "smaller" && adjustment <= -2) || (action === "larger" && adjustment >= 4);
      button.setAttribute("aria-disabled", limit ? "true" : "false");
      if (action === "reset") button.setAttribute("aria-pressed", adjustment === 0 ? "true" : "false");
    });
  };
  applyFont();
  fontButtons.forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.font;
    if (action !== "smaller" && action !== "reset" && action !== "larger") return;
    adjustment = action === "reset" ? 0 : clampFont(adjustment + (action === "larger" ? 1 : -1));
    applyFont();
    try { global.localStorage.setItem("exegesis-font-adjustment", String(adjustment)); } catch (_) { /* The size still applies to this page. */ }
  }));

  /* Reading position: the rail and the reading bar mark the part in view. */
  const sections = Array.from(document.querySelectorAll(".reading-section[id], .article-sources[id], .article-related[id]"));
  const tocLinks = Array.from(document.querySelectorAll("[data-toc]"));
  const bar = document.querySelector("[data-reading-bar]");
  const label = document.querySelector("[data-current-label]");
  const details = bar ? bar.querySelector("details") : null;
  const titleOf = (id) => {
    const anchor = tocLinks.find((link) => link.dataset.toc === id);
    const title = anchor && anchor.querySelector(".toc-title");
    return title ? title.textContent : "";
  };
  let currentId;
  let scheduled = false;
  const mark = (id) => {
    if (id === currentId) return;
    currentId = id;
    tocLinks.forEach((anchor) => {
      if (id && anchor.dataset.toc === id) anchor.setAttribute("aria-current", "location");
      else anchor.removeAttribute("aria-current");
    });
    if (label) label.textContent = titleOf(id || (sections[0] && sections[0].id));
  };
  const update = () => {
    scheduled = false;
    const doc = document.documentElement;
    const viewport = global.innerHeight || doc.clientHeight;
    const barHeight = bar && bar.offsetParent !== null ? bar.offsetHeight : 0;
    const line = barHeight ? barHeight + 24 : Math.min(160, viewport * 0.3);
    const scrollTop = global.scrollY || doc.scrollTop;
    // Near the end of the page the short closing parts (sources, related passages) never reach the top line.
    const nearEnd = doc.scrollHeight > viewport + 2 && scrollTop + viewport >= doc.scrollHeight - viewport * 0.25;
    const reach = nearEnd ? viewport * 0.75 : line;
    let id = null;
    for (const section of sections) { if (section.getBoundingClientRect().top <= reach) id = section.id; else break; }
    mark(id);
    if (bar && barHeight) {
      const box = article.getBoundingClientRect();
      const span = Math.max(1, box.height - viewport + barHeight);
      const progress = Math.max(0, Math.min(1, (barHeight - box.top) / span));
      bar.style.setProperty("--reading-progress", (progress * 100).toFixed(1) + "%");
    }
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    if (typeof global.requestAnimationFrame === "function") global.requestAnimationFrame(update); else global.setTimeout(update, 50);
  };
  if (sections.length && tocLinks.length) {
    global.addEventListener("scroll", schedule, { passive: true });
    global.addEventListener("resize", schedule);
    global.addEventListener("hashchange", schedule);
    global.addEventListener("load", schedule);
    update();
  }

  /* The reading bar outline closes after a choice, on Escape and on an outside tap. */
  if (details) {
    const summary = details.querySelector("summary");
    details.querySelectorAll("a").forEach((anchor) => anchor.addEventListener("click", () => { details.open = false; }));
    details.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && details.open) {
        event.preventDefault();
        details.open = false;
        summary.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
  }
})(typeof window === "undefined" ? globalThis : window);
