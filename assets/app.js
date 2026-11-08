(() => {
  const { lessons, exams } = window.BANK;
  const extras = window.EXTRA || [];  // question sets from other committees' exams (site/extra.js, tools/build_extra.py)
  const examBy = Object.fromEntries([...exams, ...extras.flatMap(x => x.exams)].map(e => [e.code, e]));
  const lessonBy = Object.fromEntries(lessons.map(l => [l.num, l]));
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => `<svg class="i"><use href="#i-${id}"/></svg>`;
  const ready = lessons.filter(l => l.questions);
  const allQs = ready.flatMap(l => l.questions.map(q => ({ ...q, lesson: l })));
  const kindAr = { Kurul: 'كورول', Final: 'فاينال', 'Bütünleme': 'بوتونلمه' };
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------- rail ---------- */
  function renderNav() {
    $('#nav').innerHTML =
      `<a class="ni" href="#/" data-k="home">${icon('grid')}<span class="tt" style="direction:rtl">نظرة عامة</span></a>` +
      (extras.length ? `<div class="grp"><span>من كورولات تانية</span><span class="num">${extras.length}</span></div>` : '') +
      extras.map(x => `<a class="ni" href="#/x/${x.slug}" data-k="x:${x.slug}" data-s="${esc([x.title, ...x.exams.map(e => e.code + ' ' + e.name)].join(' ').toLocaleLowerCase('tr'))}">
        <span class="nn">${icon('layers')}</span><span class="tt" lang="tr">${esc(x.title)}</span>
        <span class="cnt">${x.questions.length}</span></a>`).join('') +
      `<div class="grp"><span>الدروس</span><span class="num">${lessons.length}</span></div>` +
      lessons.map(l => `<a class="ni" href="#/l/${l.num}" data-k="${l.num}" data-s="${esc((l.num + ' ' + l.title).toLocaleLowerCase('tr'))}">
        <span class="nn num">${l.num}</span><span class="tt" lang="tr">${esc(l.title)}</span>
        <span class="cnt ${l.questions ? '' : 'none'}">${l.questions ? l.questions.length : '—'}</span></a>`).join('');
  }

  function markNav(key) {
    document.querySelectorAll('.ni').forEach(a => a.classList.toggle('on', a.dataset.k === String(key)));
  }

  /* ---------- overview ---------- */
  function home(query = '') {
    const usedBy = {};
    allQs.forEach(q => { usedBy[q.exam] = (usedBy[q.exam] || 0) + 1; });
    const maxUse = Math.max(1, ...Object.values(usedBy));
    const total = allQs.length;
    const q = query.trim().toLocaleLowerCase('tr');
    const match = x => x.stem.toLocaleLowerCase('tr').includes(q) || x.exam.toLowerCase().includes(q);
    const hits = q ? allQs.filter(match) : [];
    const xhits = q ? extras.flatMap(x => x.questions.filter(match).map(h => ({ ...h, set: x }))) : [];

    $('#crumb').innerHTML = `<b>نظرة عامة</b>`;
    $('#acts').innerHTML = '';
    $('#view').innerHTML = `<div class="view">
      <section class="hero rise">
        <span class="kicker"><i></i><span lang="tr">Dönem III · Farmakoloji</span></span>
        <h1>كل أسئلة السنين اللي فاتت، متقسمة على الدروس.</h1>
        <p>اتقرا ${exams.length} امتحان من ${'2018'} لـ ${'2026'}، سؤال سؤال. كل سؤال اتحط تحت الدرس بتاعه ومعاه إجابته من ملف الشرح نفسه، والجملة اللي فيها الإجابة متعلّم عليها.</p>
      </section>

      <div class="kpis">
        <div class="kpi rise" style="--i:1"><div class="v">${lessons.length}</div><div class="l">درس</div></div>
        <div class="kpi rise" style="--i:2"><div class="v">${exams.length}</div><div class="l">امتحان اتقرا</div></div>
        <div class="kpi rise" style="--i:3"><div class="v">${total}</div><div class="l">سؤال جاهز</div></div>
        <div class="kpi rise" style="--i:4"><div class="v">${ready.length}<small> / ${lessons.length}</small></div><div class="l">درس جاهز</div>
          <div class="meter"><i style="width:${(ready.length / lessons.length) * 100}%"></i></div></div>
      </div>

      ${q ? `<div class="sec-h"><h2>نتايج البحث</h2><span class="num">${hits.length + xhits.length}</span></div>
        <div class="results">${hits.length + xhits.length ? hits.map(h => `<a class="res" href="#/l/${h.lesson.num}/${h.id}">
          <span class="ln num">${h.lesson.num}</span><span class="ex">${esc(h.exam)} · ${h.qno}</span>
          <span class="st" lang="tr">${esc(h.stem)}</span></a>`).join('') + xhits.map(h => `<a class="res" href="#/x/${h.set.slug}/${h.id}">
          <span class="ln num">${h.lesson}</span><span class="ex">${esc(h.exam)} · ${h.qno}</span>
          <span class="st" lang="tr">${esc(h.stem)}</span></a>`).join('') : `<div class="note">مفيش أسئلة فيها الكلام ده في الدروس الجاهزة.</div>`}</div>` : ''}

      ${!q && ready.length && ready.length < lessons.length ? `<div class="sec-h"><h2>جاهز للمذاكرة</h2><span>${ready.length} من ${lessons.length}</span></div>
      <div class="featured">${ready.map((l, i) => {
        const main = l.questions.filter(x => x.section === 'main').length;
        return `<article class="fc rise" style="--i:${i + 5}">
          <a class="fc-link" href="#/l/${l.num}" aria-label="افتح درس ${l.num}"></a>
          <span class="n">${l.num}</span>
          <div class="fc-b"><span class="t" lang="tr">${esc(l.title)}</span>
            <span class="m">${l.questions.length} سؤال · ${main} أساسي · ${l.questions.length - main} للمراجعة · ${l.pages} صفحة</span></div>
          <div class="fc-a"><a class="btn inv" href="#/l/${l.num}">افتح الدرس</a>
            <a class="btn inv ghost" href="${esc(l.pdf)}" download="${esc(pdfName(l))}">${icon('down')}PDF</a></div>
        </article>`;
      }).join('')}</div>` : ''}

      <div class="sec-h"><h2>كل الدروس</h2><span>اختار درس عشان تفتحه</span></div>
      <div class="lessons">${lessons.map((l, i) => {
        const n = l.questions?.length;
        const show = !q || (l.num + ' ' + l.title).toLocaleLowerCase('tr').includes(q) || hits.some(h => h.lesson.num === l.num);
        return `<a class="lc rise ${n ? '' : 'pending'} ${show ? '' : 'hide'}" style="--i:${Math.min(i, 12)}" href="#/l/${l.num}">
          <span class="n">${l.num}</span><span class="t" lang="tr">${esc(l.title)}</span>
          <span class="m">${n
            ? `<span class="st"><i></i>${n} سؤال</span><span>PDF · ${l.pages} صفحة</span>`
            : `<span class="st"><i></i>لسه</span><span class="num">${l.slides} سلايد</span>`}</span></a>`;
      }).join('')}</div>

      ${!q && extras.length ? `<div class="sec-h"><h2>من كورولات تانية</h2><span>أسئلة من امتحانات كورولات تانية ليها علاقة بالدروس</span></div>
      <div class="featured">${extras.map((x, i) => {
        const main = x.questions.filter(y => y.section === 'main').length;
        const touched = new Set(x.questions.map(y => y.lesson)).size;
        return `<article class="fc rise" style="--i:${i + 5}">
          <a class="fc-link" href="#/x/${x.slug}" aria-label="افتح ${esc(x.title)}"></a>
          <span class="n">${x.questions.length}</span>
          <div class="fc-b"><span class="t" lang="tr">${esc(x.title)}</span>
            <span class="m">${x.exams.length} امتحانات · ${main} إجابتها في الشرح · ${x.questions.length - main} للمراجعة · ${touched} درس · ${x.pages} صفحة</span></div>
          <div class="fc-a"><a class="btn inv" href="#/x/${x.slug}">افتح الأسئلة</a>
            <a class="btn inv ghost" href="${esc(x.pdf)}" download="${esc(pdfName(x))}">${icon('down')}PDF</a></div>
        </article>`;
      }).join('')}</div>` : ''}

      <div class="sec-h"><h2>الامتحانات</h2><span>كام سؤال اتاخد من كل امتحان لحد دلوقتي</span></div>
      <div class="panel">${exams.map(e => {
        const c = usedBy[e.code] || 0;
        return `<div class="exrow"><span class="code">${esc(e.code.replace('-', ' '))}</span><span class="k">${kindAr[e.kind] || e.kind}</span>
          <span class="y" lang="tr">${esc(e.year)}${e.date ? ' · ' + esc(e.date) : ''}</span>
          <span class="bar"><i style="width:${(c / maxUse) * 100}%"></i></span><span class="c ${c ? '' : 'zero'}">${c}</span></div>`;
      }).join('')}</div>
    </div>`;
    markNav('home');
  }

  /* ---------- lesson ---------- */
  let filter = 'all';
  let study = store.get('study') === '1';

  /* The hosted copy packs each lesson's pictures into a few script files (a hosted page may hold only
     ~500 files); they set window.BANK_IMG[path] = data URI. Locally `bundle` is absent and paths are used as-is. */
  const imgSrc = path => (window.BANK_IMG && window.BANK_IMG[path]) || path;
  const loaded = new Set();
  function loadBundles(x) {
    const todo = (x.bundle || []).filter(u => !loaded.has(u));
    return todo.reduce((chain, url) => chain.then(() => new Promise(resolve => {
      const s = document.createElement('script');
      s.src = url; s.onload = s.onerror = () => { loaded.add(url); resolve(); };
      document.head.appendChild(s);
    })), Promise.resolve());
  }
  function needsBundles(x) { return (x.bundle || []).some(u => !loaded.has(u)); }
  const loadingView = `<div class="view"><div class="empty rise"><p>بيحمّل صور الأسئلة…</p></div></div>`;

  function questionCard(q, i, total) {
    const e = examBy[q.exam] || {};
    const w = Math.min(760, q.w * 2.1);
    const mark = q.mark ? `<span class="mark" style="left:calc(${q.mark[0] * 100}% - 7px);top:calc(${q.mark[1] * 100}% - 4px);width:calc(${q.mark[2] * 100}% + 14px);height:calc(${q.mark[3] * 100}% + 8px)"></span>` : '';
    const why = q.reason === 'no-answer' ? 'مفيش إجابة في الشرح' : 'من محاضرة تانية';
    const answer = q.answer
      ? `<span class="f-pill"><b>${esc(q.answer.letter)}</b>${esc(q.answer.text)}</span>`
      : `<span class="nopill">مفيش إجابة في ملف الشرح</span>`;
    // questions of an extra set carry their lesson number, and so do their slides
    const evs = q.evidence.map(ev => `<figure class="ev"><figcaption><span>${ev.lesson ? `من درس ${ev.lesson}` : 'من الدرس'}</span><b>سلايد ${ev.slide}</b>
      <span class="t" lang="tr">${esc(ev.title)}</span></figcaption><img src="${esc(imgSrc(ev.img))}" alt="سلايد ${ev.slide}" loading="lazy"></figure>`).join('');
    // the same question, word for word, in other exams
    const also = (q.also || []).map(a => `<span class="badge also">جه كمان في <b dir="ltr">${esc(a.exam)} · ${esc((examBy[a.exam] || {}).year || '')} · Soru ${a.qno}</b></span>`).join('');
    const ln = typeof q.lesson === 'number' && lessonBy[q.lesson];
    return `<article class="qc rise" id="${esc(q.id)}" data-sec="${q.section}" style="--i:${Math.min(i, 8)}">
      <div class="qh"><span class="idx">${String(i).padStart(2, '0')}</span>
        <span class="exam"><b>${esc(q.exam)}</b>${esc(e.name || e.kind)} ${esc(e.year)}<i></i>Soru ${q.qno}</span>
        ${ln ? `<a class="lnk" href="#/l/${ln.num}"><b class="num">${ln.num}</b><span lang="tr">${esc(ln.title)}</span></a>` : ''}
        ${also}<span class="sp"></span>${q.section === 'review' ? `<span class="badge">للمراجعة · ${why}</span>` : ''}</div>
      ${q.note ? `<div class="note"><b>${q.section === 'review' ? 'ليه هنا؟' : 'ملحوظة'}</b>${esc(q.note)}</div>` : ''}
      <div class="paper"><div class="qimg" style="width:${w}px"><img src="${esc(imgSrc(q.img))}" alt="${esc(q.stem)}">${mark}</div></div>
      <button class="btn ghost reveal">${icon('eye')}اظهر الإجابة</button>
      <div class="ansblock"><div class="ansrow"><span class="lbl">الإجابة</span>${answer}</div>${evs ? `<div class="evs">${evs}</div>` : ''}</div>
    </article>`;
  }

  const segIdx = { all: 0, main: 1, review: 2 };

  // a lesson's PDF downloads under the lesson's name; older sets fall back to the file name
  function pdfName(x) { return x.pdfName || x.pdf.split('/').pop(); }

  function pdfActs(x) {
    return `<a class="btn ghost" href="${esc(x.pdf)}" target="_blank" rel="noopener">${icon('open')}<span class="lt">افتح PDF</span></a>
      <a class="btn" href="${esc(x.pdf)}" download="${esc(pdfName(x))}">${icon('down')}<span class="lt">تحميل PDF</span></a>`;
  }

  // filter + study switch + the cards (main first, then review); call bindQuestions() once it's in the page
  function questionList(qs) {
    const main = qs.filter(q => q.section === 'main');
    const review = qs.filter(q => q.section === 'review');
    return `<div class="tools">
        <div class="f-seg" id="flt" style="--n:3;--i:${segIdx[filter]}"><span class="f-seg__thumb"></span>
          <button data-f="all">الكل<b>${qs.length}</b></button><button data-f="main">أساسي<b>${main.length}</b></button><button data-f="review">للمراجعة<b>${review.length}</b></button></div>
        <span class="sp"></span>
        <label class="switch">وضع المذاكرة: الإجابة مستخبية<button class="f-toggle" role="switch" aria-checked="${study}" id="study" aria-label="وضع المذاكرة"></button></label>
      </div>
      <div class="qs">
        ${main.map((q, i) => questionCard(q, i + 1)).join('')}
        ${review.length ? `<div class="qsep" data-sec="review">للمراجعة · آخر الملف</div>` : ''}
        ${review.map((q, i) => questionCard(q, main.length + i + 1)).join('')}
      </div>`;
  }

  // "+N من كورولات تانية" links from a lesson to its questions in the extra sets
  function extraTags(num) {
    return extras.map(x => {
      const qs = x.questions.filter(q => q.lesson === num);
      return qs.length ? `<a class="f-tag more" href="#/x/${x.slug}/${qs[0].id}">+<b class="num">${qs.length}</b>&nbsp;من كورولات تانية</a>` : '';
    }).join('');
  }

  function lesson(num, focus) {
    const l = lessons.find(x => x.num === num);
    if (!l) return home();
    $('#crumb').innerHTML = `<a href="#/">الدروس</a>${icon('back')}<b lang="tr" dir="ltr">${l.num}. ${esc(l.title)}</b>`;
    markNav(l.num);
    const more = extraTags(l.num);

    if (!l.questions) {
      $('#acts').innerHTML = '';
      $('#view').innerHTML = `<div class="view"><div class="empty rise"><div class="n num">${l.num}</div>
        <h2 lang="tr">${esc(l.title)}</h2><p>الدرس ده لسه ما اتعملش.</p>
        <p class="num" style="margin-top:10px;color:var(--f-mute)">${l.slides} سلايد في ملف الشرح</p>
        ${more ? `<div class="tags">${more}</div>` : ''}</div></div>`;
      return;
    }

    if (needsBundles(l)) {
      $('#acts').innerHTML = ''; $('#view').innerHTML = loadingView;
      return void loadBundles(l).then(() => { if (location.hash.startsWith(`#/l/${num}`)) lesson(num, focus); });
    }
    const qs = l.questions;
    const main = qs.filter(q => q.section === 'main');
    const used = [...new Set(qs.map(q => q.exam))];
    $('#acts').innerHTML = pdfActs(l);
    $('#view').innerHTML = `<div class="view ${study ? 'study' : ''}" id="lv">
      <header class="lh rise"><span class="n">${l.num}</span><h1 lang="tr">${esc(l.title)}</h1>
        <div class="who" lang="tr">${esc(l.teacher)}</div>
        <div class="tags"><span class="f-tag"><b class="num">${qs.length}</b>&nbsp;سؤال</span><span class="f-tag"><b class="num">${main.length}</b>&nbsp;أساسي</span>
          <span class="f-tag"><b class="num">${qs.length - main.length}</b>&nbsp;للمراجعة</span><span class="f-tag"><b class="num">${used.length}</b>&nbsp;امتحان</span>
          <span class="f-tag"><b class="num">${l.pages}</b>&nbsp;صفحة PDF</span>${more}</div></header>
      ${questionList(qs)}</div>`;
    bindQuestions(focus);
  }

  /* ---------- extra set (questions from other committees' exams) ---------- */
  function extraSet(slug, focus) {
    const x = extras.find(s => s.slug === slug);
    if (!x) return home();
    $('#crumb').innerHTML = `<a href="#/">الدروس</a>${icon('back')}<span>من كورولات تانية</span>${icon('back')}<b lang="tr" dir="ltr">${esc(x.title)}</b>`;
    markNav('x:' + x.slug);

    if (needsBundles(x)) {
      $('#acts').innerHTML = ''; $('#view').innerHTML = loadingView;
      return void loadBundles(x).then(() => { if (location.hash.startsWith(`#/x/${slug}`)) extraSet(slug, focus); });
    }
    const qs = x.questions;
    const main = qs.filter(q => q.section === 'main').length;
    const touched = [...new Set(qs.map(q => q.lesson))].sort((a, b) => a - b);
    $('#acts').innerHTML = pdfActs(x);
    $('#view').innerHTML = `<div class="view ${study ? 'study' : ''}" id="lv">
      <header class="lh rise"><span class="n">${qs.length}</span><h1 lang="tr">${esc(x.title)}</h1>
        <div class="who" lang="tr">${esc(x.exams.map(e => `${e.code} ${e.name}`).join(' · '))}</div>
        <div class="tags"><span class="f-tag"><b class="num">${qs.length}</b>&nbsp;سؤال</span><span class="f-tag"><b class="num">${main}</b>&nbsp;إجابتها في الشرح</span>
          <span class="f-tag"><b class="num">${qs.length - main}</b>&nbsp;للمراجعة</span><span class="f-tag"><b class="num">${x.exams.length}</b>&nbsp;امتحان</span>
          <span class="f-tag"><b class="num">${x.pages}</b>&nbsp;صفحة PDF</span></div></header>
      <div class="note xnote">أسئلة من امتحانات كورولات تانية ليها علاقة بالدروس، وكل سؤال عليه رقم الدرس بتاعه.
        الدروس: ${touched.map(n => `<a class="num" href="#/l/${n}">${n}</a>`).join('، ')}</div>
      ${questionList(qs)}</div>`;
    bindQuestions(focus);
  }

  function bindQuestions(focus) {
    applyFilter();
    $('#flt').addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      filter = b.dataset.f; $('#flt').style.setProperty('--i', segIdx[filter]); applyFilter();
    });
    $('#study').addEventListener('click', ev => {
      study = !study; ev.currentTarget.setAttribute('aria-checked', study); store.set('study', study ? '1' : null);
      $('#lv').classList.toggle('study', study);
      document.querySelectorAll('.qc.open').forEach(c => c.classList.remove('open'));
    });
    $('#lv').addEventListener('click', ev => {
      const r = ev.target.closest('.reveal'); if (r) r.closest('.qc').classList.add('open');
    });
    if (focus) requestAnimationFrame(() => document.getElementById(focus)?.scrollIntoView({ block: 'start' }));
  }

  function applyFilter() {
    document.querySelectorAll('.qc').forEach(c => c.classList.toggle('hide', filter !== 'all' && c.dataset.sec !== filter));
    document.querySelectorAll('.qsep').forEach(s => { s.style.display = filter === 'all' ? '' : 'none'; });
  }

  /* ---------- routing ---------- */
  function route() {
    document.body.classList.remove('nav-open');
    const m = location.hash.match(/^#\/l\/(\d+)(?:\/(.+))?/);
    const x = location.hash.match(/^#\/x\/([^/]+)(?:\/(.+))?/);
    $('#view').scrollTop = 0; $('.content').scrollTop = 0;
    if (m) lesson(Number(m[1]), m[2] && decodeURIComponent(m[2]));
    else if (x) extraSet(decodeURIComponent(x[1]), x[2] && decodeURIComponent(x[2]));
    else home($('#q').value);
  }

  /* ---------- search ---------- */
  $('#q').addEventListener('input', ev => {
    const q = ev.target.value.trim().toLocaleLowerCase('tr');
    document.querySelectorAll('.ni[data-s]').forEach(a => {
      const set = extras.find(x => 'x:' + x.slug === a.dataset.k);
      const qs = set ? set.questions : allQs.filter(x => x.lesson.num === Number(a.dataset.k));
      const inQs = q && qs.some(x => x.stem.toLocaleLowerCase('tr').includes(q));
      a.classList.toggle('hide', !!q && !a.dataset.s.includes(q) && !inQs);
    });
    if (!/^#\/[lx]\//.test(location.hash)) home(ev.target.value);
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === '/' && document.activeElement !== $('#q')) { ev.preventDefault(); $('#q').focus(); }
    if (ev.key === 'Escape') { $('#q').blur(); document.body.classList.remove('nav-open'); }
  });

  /* ---------- theme ---------- */
  const themeSeg = $('#theme');
  const themes = ['', 'light', 'dark'];
  const setTheme = t => {
    if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
    themeSeg.style.setProperty('--i', themes.indexOf(t));
    themeSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t));
    store.set('theme', t || null);
  };
  setTheme(document.documentElement.dataset.theme || '');
  themeSeg.addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) setTheme(b.dataset.t); });

  /* ---------- small screens ---------- */
  $('#menu').addEventListener('click', () => document.body.classList.add('nav-open'));
  $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));

  renderNav();
  window.addEventListener('hashchange', route);
  route();
})();
