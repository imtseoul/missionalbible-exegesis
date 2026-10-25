/* Static search and reading controls. No network or account is required. */
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
  const verseCounts = {
    "2Cor": [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 13],
    "Phlm": [25], "Amos": [15, 16, 15, 13, 27, 14, 17, 14, 15], "Mic": [16, 13, 12, 13, 15, 16, 20]
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
      if (/^[\d\s:장절.-]+$/.test(trimmed)) return { kind: "invalid", message: "책 이름과 장절을 함께 입력하세요. 예: 고후 1:3" };
      return { kind: "text", terms: trimmed.toLocaleLowerCase().split(/\s+/).filter(Boolean) };
    }
    const book = found.book;
    let rest = compact.slice(found.alias.length);
    if (!rest) return { kind: "book", book: book[0], label: book[1] };
    if (book[2] === 1 && /^\d+(?:-\d+)?절$/.test(rest)) rest = "1:" + rest;
    // Korean chapter and verse notation shares the same parser as colon notation.
    rest = rest.replace(/장(?=\d)/g, ":").replace(/장$/g, "").replace(/절/g, "");
    const match = rest.match(/^(\d+)(?::(\d+))?(?:-(?:(\d+):)?(\d+))?$/);
    if (!match) return { kind: "invalid", message: "장절 형식을 확인하세요. 예: 고후 1:3 또는 고린도후서 3장" };
    const chapter = Number(match[1]);
    const verse = match[2] ? Number(match[2]) : null;
    let start, end;
    if (verse === null) {
      if (match[3]) return { kind: "invalid", message: "장 범위나 장절 범위를 입력하세요. 예: 고후 3장 또는 고후 3:1-18" };
      start = [chapter, 1];
      const endChapter = match[4] ? Number(match[4]) : chapter;
      end = [endChapter, (verseCounts[book[0]] || [])[endChapter - 1] || 176];
    } else {
      start = [chapter, verse];
      end = [match[3] ? Number(match[3]) : chapter, match[4] ? Number(match[4]) : verse];
    }
    const invalid = [start, end].some(([c, v]) => c < 1 || c > book[2] || v < 1 || v > ((verseCounts[book[0]] || [])[c - 1] || 176));
    if (invalid || compare(start, end) > 0) return { kind: "invalid", message: "장과 절의 범위를 확인하세요. " + book[1] + "는 " + book[2] + "장까지 있습니다." };
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

  const input = document.getElementById("bible-search");
  const resultArea = document.getElementById("search-results");
  const query = new URLSearchParams(global.location.search).get("q") || "";
  if (input) input.value = query;

  function renderSearch(value) {
    const index = global.EXEGESIS_SEARCH_INDEX;
    const status = document.getElementById("search-status");
    const browse = document.getElementById("search-browse");
    resultArea.replaceChildren();
    if (!Array.isArray(index)) {
      status.textContent = "검색 자료를 열 수 없습니다. 아래 수록 목록에서 주해를 선택하세요.";
      browse.hidden = false;
      return;
    }
    const outcome = search(value, index);
    browse.hidden = outcome.kind !== "empty";
    if (outcome.kind === "empty") { status.textContent = "구절이나 단어를 입력하세요."; return; }
    if (outcome.kind === "invalid") { status.textContent = outcome.message; return; }
    if (!outcome.results.length) {
      status.textContent = outcome.kind === "text" ? "“" + value + "”을 포함한 주해가 없습니다. 다른 단어로 찾아보세요." : "“" + value + "”에 해당하는 주해가 아직 수록되지 않았습니다.";
      const back = document.createElement("a");
      back.href = document.body.dataset.root + "index.html";
      back.textContent = "성경별 수록 목록 보기";
      resultArea.append(back);
      return;
    }
    status.textContent = "“" + value + "” 검색 결과 " + outcome.results.length + "편";
    const list = document.createElement("ol");
    list.className = "entry-list";
    for (const item of outcome.results) {
      const entry = document.createElement("li");
      entry.className = "entry";
      const range = document.createElement("p");
      range.className = "entry-passage"; range.textContent = item.passage;
      const heading = document.createElement("h2");
      const anchor = document.createElement("a");
      anchor.href = document.body.dataset.root + item.path + "index.html"; anchor.textContent = item.title;
      heading.append(anchor);
      const description = document.createElement("p");
      description.className = "entry-description"; description.textContent = item.description;
      entry.append(range, heading, description);
      if (outcome.kind === "text") {
        const paragraphs = item.sections.flatMap((section) => section.paragraphs);
        const hit = paragraphs.find((paragraph) => outcome.terms.some((term) => paragraph.toLocaleLowerCase().includes(term)));
        if (hit) {
          const clean = hit.replace(/\[[A-Za-z][A-Za-z0-9_-]*\]/g, "");
          const first = Math.max(0, Math.min(...outcome.terms.map((term) => clean.toLocaleLowerCase().indexOf(term)).filter((position) => position >= 0)) - 35);
          const snippet = document.createElement("p");
          snippet.className = "search-excerpt";
          snippet.textContent = (first ? "…" : "") + clean.slice(first, first + 150) + (first + 150 < clean.length ? "…" : "");
          entry.append(snippet);
        }
      }
      list.append(entry);
    }
    resultArea.append(list);
  }

  if (resultArea) {
    renderSearch(query);
    input.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value.trim();
      const url = new URL(global.location.href);
      if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
      try { global.history.pushState({}, "", url); } catch (_) { global.location.search = url.search; return; }
      renderSearch(value);
    });
    global.addEventListener("popstate", () => {
      input.value = new URLSearchParams(global.location.search).get("q") || "";
      renderSearch(input.value);
    });
  }

  document.querySelectorAll("[data-print]").forEach((button) => button.addEventListener("click", () => global.print()));
  const copyButton = document.querySelector("[data-copy-citation]");
  if (copyButton) copyButton.addEventListener("click", async () => {
    const citation = document.getElementById("citation-text");
    const details = document.getElementById("citation-details");
    const status = document.getElementById("copy-status");
    details.open = true;
    try {
      if (!global.navigator.clipboard) throw new Error("Clipboard unavailable");
      await global.navigator.clipboard.writeText(citation.value);
      status.textContent = "인용 정보를 복사했습니다.";
      copyButton.textContent = "복사 완료";
    } catch (_) {
      citation.focus(); citation.select();
      status.textContent = "선택된 인용 정보를 복사하세요.";
      details.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
  const article = document.querySelector(".article-body");
  if (article) {
    let adjustment = 0;
    try { adjustment = Math.max(-2, Math.min(4, Number(global.localStorage.getItem("exegesis-font-adjustment")) || 0)); } catch (_) { /* Reading also works without storage. */ }
    const applyFont = () => document.documentElement.style.setProperty("--font-adjustment", adjustment + "px");
    applyFont();
    document.querySelectorAll("[data-font]").forEach((button) => button.addEventListener("click", () => {
      adjustment = button.dataset.font === "reset" ? 0 : Math.max(-2, Math.min(4, adjustment + (button.dataset.font === "larger" ? 1 : -1)));
      applyFont();
      try { global.localStorage.setItem("exegesis-font-adjustment", String(adjustment)); } catch (_) { /* Font size remains adjustable. */ }
    }));
    if ("IntersectionObserver" in global) {
      const headings = Array.from(document.querySelectorAll(".reading-section, .article-sources, .article-related"));
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        const active = "#" + visible[0].target.id;
        document.querySelectorAll(".reading-sidebar a[href^='#'], .mobile-toc a[href^='#']").forEach((anchor) => {
          if (anchor.getAttribute("href") === active) anchor.setAttribute("aria-current", "location"); else anchor.removeAttribute("aria-current");
        });
      }, { rootMargin: "-12% 0px -65% 0px", threshold: 0 });
      headings.forEach((heading) => observer.observe(heading));
    }
    document.querySelectorAll(".mobile-toc a").forEach((anchor) => anchor.addEventListener("click", () => { document.querySelector(".mobile-toc").open = false; }));
  }
})(typeof window === "undefined" ? globalThis : window);
