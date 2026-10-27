/* Search, copy, text size, outline and reading position for current pages. Static; no account or external request. */
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
  const reduceMotion = () => typeof global.matchMedia === "function" && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  /* Search page: the offline index is inserted only when a query needs it. */
  const searchForm = document.querySelector("form[data-index]");
  const resultArea = document.getElementById("search-results");
  if (searchForm && resultArea) {
    const input = searchForm.querySelector("input[name='q']");
    const status = document.getElementById("search-status");
    const browse = document.getElementById("search-browse");
    const message = document.getElementById(input.id + "-message");
    const hintId = input.id + "-hint";
    const exampleItems = Array.from(searchForm.querySelectorAll(".search-examples li"));
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
          if (next > cursor) appendRich(paragraph, slice.slice(cursor, next));
          paragraph.append(appendRich(element("mark"), slice.slice(next, next + length)));
          cursor = next + length;
        }
      }
      if (cursor < slice.length) appendRich(paragraph, slice.slice(cursor));
      if (last < clean.length) paragraph.append("…");
      return paragraph;
    };
    const examples = () => {
      const row = element("div", "search-examples");
      const list = element("ul");
      exampleItems.forEach((item) => list.append(item.cloneNode(true)));
      row.append(element("span", "search-examples-label", "예"), list);
      return row;
    };
    const panel = (text, error) => {
      const box = element("div", "search-panel" + (error ? " is-error" : ""));
      box.append(element("p", "", text));
      return box;
    };
    const render = async (value) => {
      const current = ++token;
      const parsed = parseQuery(value);
      const query = value.trim();
      clearMessage();
      resultArea.replaceChildren();
      resultArea.removeAttribute("aria-busy");
      status.replaceChildren();
      if (parsed.kind === "empty") { browse.hidden = false; return; }
      if (parsed.kind === "invalid") { showMessage(parsed.message); browse.hidden = false; return; }
      status.textContent = "검색 중…";
      resultArea.setAttribute("aria-busy", "true");
      let index;
      try { index = await loadIndex(); } catch (_) {
        if (current !== token) return;
        resultArea.removeAttribute("aria-busy");
        const box = panel("검색을 처리하지 못했습니다. 잠시 후 다시 시도하세요.", true);
        const retry = element("button", "", "다시 시도");
        retry.type = "button";
        retry.addEventListener("click", () => { render(input.value); });
        box.append(retry);
        status.replaceChildren(box);
        browse.hidden = false;
        return;
      }
      if (current !== token) return;
      resultArea.removeAttribute("aria-busy");
      const outcome = search(value, index);
      if (!outcome.results.length) {
        const box = panel("“" + query + "”에 맞는 단락이 없습니다. 책 이름·장절(예: 시 23:1)이나 다른 단어로 찾아보세요.");
        box.append(examples());
        status.replaceChildren(box);
        browse.hidden = false;
        return;
      }
      browse.hidden = true;
      status.textContent = "“" + query + "” 검색 결과 " + outcome.results.length + "개 단락";
      const list = element("ol", "result-list");
      for (const item of outcome.results) {
        const entry = element("li", "result");
        const heading = element("h2");
        const anchor = appendRich(element("a"), item.title);
        anchor.href = root + item.path + "index.html";
        heading.append(anchor);
        entry.append(element("p", "result-ref", item.passage), heading, appendRich(element("p", "result-description"), item.description));
        if (outcome.kind === "text") {
          const snippet = excerpt(item, outcome.terms);
          if (snippet) entry.append(snippet);
        }
        list.append(entry);
      }
      resultArea.append(list);
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
    input.addEventListener("input", () => { if (input.value.trim()) loadIndex().catch(() => {}); if (input.getAttribute("aria-invalid")) clearMessage(); });
    // Example links (in the form and in the no-result panel) run the search in place.
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

  /* Home on phones: each book list folds under its name; all lists start open. */
  document.querySelectorAll(".shelf-book").forEach((book) => {
    const head = book.querySelector(".shelf-head");
    const list = book.querySelector(".passage-list");
    const name = book.querySelector("h3");
    if (!head || !list || !list.id || !name) return;
    const toggle = element("button", "shelf-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-controls", list.id);
    toggle.setAttribute("aria-label", name.textContent + " 단락 목록");
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      book.classList.toggle("is-collapsed", !open);
    });
    head.append(toggle);
  });

  /* Home and book rails and chapter chips: mark the book or chapter group in view. */
  const jumpLinks = Array.from(document.querySelectorAll(".rail .rail-list a[href^='#'], .chip-row a[href^='#']"));
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
    // A chapter opened by address starts centred in the chip row without moving the page.
    const row = document.querySelector(".chip-row");
    const centre = () => {
      if (!row || row.scrollWidth <= row.clientWidth) return;
      const id = decodeURIComponent(global.location.hash.slice(1));
      const chip = id && Array.from(row.querySelectorAll("a")).find((anchor) => anchor.getAttribute("href") === "#" + id);
      if (!chip) return;
      const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
      row.scrollTo({ left: Math.max(0, left), behavior: reduceMotion() ? "auto" : "smooth" });
    };
    centre();
    global.addEventListener("hashchange", centre);
  }

  /* Copy the plain commentary text, including pointed Hebrew, exactly as published. */
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
      copyButton.focus();
    };
    const openPanel = () => {
      say("복사할 수 없습니다. 본문을 직접 선택하세요", true);
      if (!panel || !area) return;
      area.value = copyText;
      panel.hidden = false;
      area.focus();
      area.select();
    };
    copyButton.addEventListener("click", async () => {
      say("");
      global.clearTimeout(timer);
      copyButton.textContent = idleLabel;
      if (!copyText) { say("복사할 수 없습니다. 본문을 직접 선택하세요", true); return; }
      let copied = false;
      if (global.navigator.clipboard && typeof global.navigator.clipboard.writeText === "function") {
        try { await global.navigator.clipboard.writeText(copyText); copied = true; } catch (_) { copied = false; }
      }
      if (!copied) copied = legacyCopy();
      if (copied) {
        if (panel) panel.hidden = true;
        copyButton.textContent = "복사됨";
        say("복사됨");
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
      if (event.key === "Escape" && isOpen()) { event.preventDefault(); setOpen(false, true); }
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
