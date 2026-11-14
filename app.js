(function () {
  'use strict';

  var KEY = 'laporan-les-draft-v1';
  var SUBJ = [
    { id: 'mtk', name: 'Matematika', cls: 'mtk' },
    { id: 'ing', name: 'Bahasa Inggris', cls: 'ing' },
    { id: 'ipa', name: 'IPA', cls: 'ipa' }
  ];
  var LEVELS = ['Perlu latihan', 'Cukup', 'Baik', 'Sangat baik'];

  // Mode pemilik: tambahkan ?edit di belakang alamat halaman, atau buka file langsung dari komputer.
  var OWNER = /(^|[?&])edit(=|&|$)/.test(location.search) || location.protocol === 'file:';

  var root = document.getElementById('root');
  var base = JSON.parse(JSON.stringify(window.LAPORAN_DATA));
  var draft = null;
  if (OWNER) {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.months && parsed.months.length) draft = parsed;
    } catch (e) { draft = null; }
  }
  var S = draft || base;
  var hasDraft = !!draft;
  var cur = S.months.length - 1;
  var editing = false, msg = '', snapshot = null;

  function M() { return S.months[cur]; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function subj(id) { return SUBJ.filter(function (j) { return j.id === id; })[0] || SUBJ[0]; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function dateParts(iso) {
    if (!iso) return null;
    var d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return null;
    var f = function (o) { o.timeZone = 'UTC'; return new Intl.DateTimeFormat('id-ID', o).format(d); };
    return { day: d.getUTCDate(), wd: cap(f({ weekday: 'long' })), mon: f({ month: 'short' }), monLong: f({ month: 'long' }), year: d.getUTCFullYear() };
  }
  function toMin(t) {
    var m = /^(\d\d):(\d\d)$/.exec(t || '');
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }
  function minutes(s) {
    var a = toMin(s.start), b = toMin(s.end);
    return (a != null && b != null && b > a) ? b - a : 0;
  }
  function fmtDur(m) {
    var h = Math.floor(m / 60), r = m % 60;
    if (h && r) return h + ' jam ' + r + ' menit';
    if (h) return h + ' jam';
    return r + ' menit';
  }
  function weekRange(w) {
    var ps = w.sessions.map(function (s) { return s.date; }).filter(Boolean).sort();
    if (!ps.length) return '';
    var a = dateParts(ps[0]), b = dateParts(ps[ps.length - 1]);
    if (!a || !b) return '';
    if (ps[0] === ps[ps.length - 1]) return a.day + ' ' + a.mon;
    if (a.mon === b.mon) return a.day + '–' + b.day + ' ' + a.mon;
    return a.day + ' ' + a.mon + ' – ' + b.day + ' ' + b.mon;
  }
  function today() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function statsHTML() {
    var all = [], tot = 0, per = { mtk: 0, ing: 0, ipa: 0 }, grand = 0;
    M().weeks.forEach(function (w) { w.sessions.forEach(function (s) { all.push(s); }); });
    S.months.forEach(function (m) { m.weeks.forEach(function (w) { grand += w.sessions.length; }); });
    all.forEach(function (s) { tot += minutes(s); if (per[s.subject] != null) per[s.subject]++; });
    return '<div class="stat"><b>' + all.length + '</b> pertemuan bulan ini</div>' +
      '<div class="stat"><b>' + fmtDur(tot) + '</b> total belajar</div>' +
      SUBJ.map(function (j) {
        return '<div class="stat"><span class="chip ' + j.cls + '">' + j.name + '</span> <b>' + per[j.id] + '</b>×</div>';
      }).join('') +
      (S.months.length > 1 ? '<div class="stat"><b>' + grand + '</b> pertemuan sejak bulan ke-1</div>' : '');
  }

  function nextLabel() {
    var ds = [];
    M().weeks.forEach(function (w) { w.sessions.forEach(function (s) { if (s.date) ds.push(s.date); }); });
    ds.sort();
    if (!ds.length) return 'Bulan ke-' + (S.months.length + 1);
    var p = ds[ds.length - 1].split('-'), d = new Date(Date.UTC(+p[0], +p[1], 1));
    return cap(new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d));
  }

  function navHTML() {
    var n = S.months.length;
    if (n < 2 && !editing) return '';
    return '<nav class="months" aria-label="Pilih bulan">' + S.months.map(function (m, i) {
      return '<button class="tab' + (i === cur ? ' on' : '') + '" data-act="goto" data-m="' + i + '"' + (i === cur ? ' aria-current="true"' : '') + '>Bulan ke-' + (i + 1) + '<span>' + esc(m.label) + '</span></button>';
    }).join('') + (editing ? '<button class="btn ghost sm" data-act="add-month">+ Mulai bulan ke-' + (n + 1) + '</button>' : '') + '</nav>';
  }

  function headerHTML() {
    if (editing) {
      return '<header><div class="eyebrow">Mode edit</div>' +
        '<div class="head-edit">' +
        '<label class="lab">Nama siswa<input class="in" type="text" data-p="student" value="' + esc(S.student) + '"></label>' +
        '<label class="lab">Kelas<input class="in" type="text" data-p="grade" value="' + esc(S.grade) + '"></label>' +
        '<label class="lab">Pengajar<input class="in" type="text" data-p="tutor" value="' + esc(S.tutor) + '"></label>' +
        '<label class="lab">Nama bulan (bulan ke-' + (cur + 1) + ')<input class="in" type="text" data-p="months.' + cur + '.label" value="' + esc(M().label) + '"></label>' +
        '</div></header>';
    }
    return '<header class="top"><div><div class="eyebrow">Laporan les privat · Bulan ke-' + (cur + 1) + ' · ' + esc(M().label) + '</div>' +
      '<h1>' + esc(S.student) + '</h1>' +
      '<div class="sub">' + esc(S.grade) + ' · Pengajar: ' + esc(S.tutor) + '</div></div>' +
      (OWNER ? '<button class="btn" data-act="edit">Edit laporan</button>' : '') + '</header>';
  }

  function sessView(s) {
    var p = dateParts(s.date), j = subj(s.subject), dur = minutes(s);
    var when = [];
    if (p) when.push(p.wd);
    if (s.start && s.end) when.push(s.start.replace(':', '.') + '–' + s.end.replace(':', '.') + (dur ? ' (' + dur + ' menit)' : ''));
    return '<div class="sess"><div class="date">' +
      (p ? '<div class="n">' + p.day + '</div><div class="m">' + esc(p.mon) + '</div>' : '<div class="n">–</div>') +
      '</div><div><span class="chip ' + j.cls + '">' + j.name + '</span>' +
      '<div class="topic">' + (esc(s.topic) || '<span class="muted">Materi belum diisi</span>') + '</div>' +
      '<div class="when">' + esc(when.join(' · ')) + '</div></div></div>';
  }
  function sessEdit(s, wi, si) {
    var b = 'months.' + cur + '.weeks.' + wi + '.sessions.' + si + '.';
    return '<div class="sess-edit">' +
      '<div class="g2">' +
      '<label class="lab">Tanggal<input class="in" type="date" data-p="' + b + 'date" value="' + esc(s.date) + '"></label>' +
      '<label class="lab">Mata pelajaran<select class="in" data-p="' + b + 'subject">' +
      SUBJ.map(function (j) { return '<option value="' + j.id + '"' + (j.id === s.subject ? ' selected' : '') + '>' + j.name + '</option>'; }).join('') +
      '</select></label></div>' +
      '<div class="g2">' +
      '<label class="lab">Mulai<input class="in" type="time" data-p="' + b + 'start" value="' + esc(s.start) + '"></label>' +
      '<label class="lab">Selesai<input class="in" type="time" data-p="' + b + 'end" value="' + esc(s.end) + '"></label></div>' +
      '<label class="lab">Materi yang dibahas<input class="in" type="text" data-p="' + b + 'topic" value="' + esc(s.topic) + '" placeholder="Contoh: Persamaan linear"></label>' +
      '<div><button class="btn ghost sm danger" data-act="del-session" data-w="' + wi + '" data-i="' + si + '">Hapus pertemuan</button></div></div>';
  }
  function weeksHTML() {
    return '<div class="weeks">' + M().weeks.map(function (w, wi) {
      var n = w.sessions.length;
      var body = n
        ? w.sessions.map(function (s, si) { return editing ? sessEdit(s, wi, si) : sessView(s); }).join('')
        : '<div class="empty">Belum ada pertemuan di minggu ini.</div>';
      var add = (editing && n < 3)
        ? '<div class="add-row"><button class="btn ghost sm" data-act="add-session" data-w="' + wi + '">+ Tambah pertemuan</button></div>' : '';
      return '<article class="week"><div class="week-h"><h3>Minggu ' + (wi + 1) + '</h3><span>' +
        (editing ? '' : esc(weekRange(w)) + (weekRange(w) ? ' · ' : '')) + n + ' pertemuan</span></div>' + body + add + '</article>';
    }).join('') + '</div>';
  }

  function abilitiesHTML() {
    return '<div class="subjects">' + SUBJ.map(function (j) {
      var list = M().abilities[j.id] || [];
      var body;
      if (editing) {
        body = '<ul class="abs">' + list.map(function (a, i) {
          var b = 'months.' + cur + '.abilities.' + j.id + '.' + i + '.';
          return '<li class="ab-edit"><input class="in" type="text" data-p="' + b + 'text" value="' + esc(a.text) + '" placeholder="Mampu …">' +
            '<div class="row"><select class="in" data-p="' + b + 'level" aria-label="Tingkat penguasaan">' +
            LEVELS.map(function (l, k) { return '<option value="' + (k + 1) + '"' + ((a.level || 1) === k + 1 ? ' selected' : '') + '>' + l + '</option>'; }).join('') +
            '</select><button class="btn ghost sm danger" data-act="del-ab" data-s="' + j.id + '" data-i="' + i + '">Hapus</button></div></li>';
        }).join('') + '</ul><div style="margin-top:12px"><button class="btn ghost sm" data-act="add-ab" data-s="' + j.id + '">+ Tambah keterangan</button></div>';
      } else if (!list.length) {
        body = '<div class="muted">Belum ada keterangan.</div>';
      } else {
        body = '<ul class="abs">' + list.map(function (a) {
          var lv = Math.min(4, Math.max(1, a.level || 1));
          return '<li><div class="atxt">' + esc(a.text) + '</div><div class="lvl"><span class="dots" role="img" aria-label="Tingkat: ' + LEVELS[lv - 1] + '">' +
            [1, 2, 3, 4].map(function (n) { return '<i class="' + (n <= lv ? 'on' : '') + '"></i>'; }).join('') + '</span>' + LEVELS[lv - 1] + '</div></li>';
        }).join('') + '</ul>';
      }
      return '<article class="subj ' + j.cls + '"><h3><span class="chip ' + j.cls + '">' + j.name + '</span></h3>' + body + '</article>';
    }).join('') + '</div>';
  }

  function noteHTML(key, title) {
    var f = M().feedback[key];
    if (editing) {
      return '<article class="note"><h3>' + title + '</h3>' +
        '<textarea class="paper" rows="6" data-p="months.' + cur + '.feedback.' + key + '.text" aria-label="' + title + '">' + esc(f.text) + '</textarea>' +
        '<label class="lab" style="margin-top:12px">Nama<input class="in" type="text" data-p="months.' + cur + '.feedback.' + key + '.name" value="' + esc(f.name) + '"></label></article>';
    }
    return '<article class="note"><h3>' + title + '</h3>' +
      '<div class="paper">' + (esc(f.text) || '<span class="muted">Belum ada tanggapan.</span>') + '</div>' +
      (f.name ? '<div class="byline">— ' + esc(f.name) + '</div>' : '') + '</article>';
  }

  function updatedHTML() {
    var p = dateParts(S.updated);
    return p ? '<div class="foot">Terakhir diperbarui ' + p.day + ' ' + p.monLong + ' ' + p.year + '</div>' : '';
  }

  function renderBar() {
    var bar = document.getElementById('bar');
    if (!bar) return;
    if (editing) {
      bar.innerHTML = '<div class="msg">' + esc(msg || 'Ubah isi, lalu tekan "Unduh data.js" dan unggah file itu ke GitHub supaya tampil untuk semua orang.') + '</div>' +
        '<button class="btn ghost" data-act="cancel">Batal</button>' +
        '<button class="btn ghost" data-act="save-draft">Simpan draft</button>' +
        '<button class="btn" data-act="download">Unduh data.js</button>';
    } else if (OWNER && (hasDraft || msg)) {
      bar.innerHTML = '<div class="msg">' + esc(msg || 'Ini draft di browser ini. Pengunjung masih melihat versi lama sampai data.js di GitHub diganti.') + '</div>' +
        (hasDraft ? '<button class="btn ghost" data-act="discard-draft">Buang draft</button><button class="btn" data-act="download">Unduh data.js</button>' : '');
    } else {
      bar.innerHTML = '';
    }
  }

  function render() {
    root.innerHTML = '<div class="wrap">' + headerHTML() + navHTML() +
      '<div class="stats" id="stats">' + statsHTML() + '</div>' +
      '<section><h2>Jadwal Les</h2><p class="sec-note">Empat minggu dalam sebulan, dua sampai tiga pertemuan setiap minggu.</p>' + weeksHTML() + '</section>' +
      '<section><h2>Kemampuan per Mata Pelajaran</h2><p class="sec-note">Materi yang sudah dikuasai siswa bulan ini.</p>' + abilitiesHTML() + '</section>' +
      '<section><h2>Tanggapan</h2><p class="sec-note">Kesan dari siswa dan catatan dari pengajar.</p><div class="fb">' +
      noteHTML('student', 'Tanggapan Siswa') + noteHTML('tutor', 'Tanggapan Pengajar') + '</div></section>' +
      updatedHTML() + '<div class="bar" id="bar"></div></div>';
    renderBar();
  }

  function setPath(p, v) {
    var k = p.split('.'), o = S, i;
    for (i = 0; i < k.length - 1; i++) o = o[k[i]];
    o[k[k.length - 1]] = v;
  }

  function onField(e) {
    var t = e.target, p = t.dataset && t.dataset.p;
    if (!p || !editing) return;
    var v = t.value;
    if (/\.level$/.test(p)) v = +v;
    setPath(p, v);
    var st = document.getElementById('stats');
    if (st) st.innerHTML = statsHTML();
  }
  root.addEventListener('input', onField);
  root.addEventListener('change', onField);

  function storeDraft() {
    S.updated = today();
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
      hasDraft = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  function downloadData() {
    var text = '// Data laporan les privat. Unggah file ini ke GitHub untuk mengganti data.js yang lama.\n' +
      '// level kemampuan: 1 = Perlu latihan, 2 = Cukup, 3 = Baik, 4 = Sangat baik\n' +
      '// subject: "mtk" (Matematika), "ing" (Bahasa Inggris), "ipa" (IPA)\n' +
      'window.LAPORAN_DATA = ' + JSON.stringify(S, null, 2) + ';\n';
    var blob = new Blob([text], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'data.js';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b) return;
    var act = b.dataset.act, w = +b.dataset.w, i = +b.dataset.i, s = b.dataset.s;
    if (act === 'edit') {
      snapshot = JSON.stringify(S); editing = true; msg = ''; render();
    } else if (act === 'cancel') {
      S = JSON.parse(snapshot); cur = Math.min(cur, S.months.length - 1); editing = false; msg = ''; render();
    } else if (act === 'goto') {
      cur = +b.dataset.m; render();
    } else if (act === 'add-month') {
      var prev = M();
      S.months.push({
        label: nextLabel(),
        weeks: [{ sessions: [] }, { sessions: [] }, { sessions: [] }, { sessions: [] }],
        abilities: JSON.parse(JSON.stringify(prev.abilities)),
        feedback: { student: { name: prev.feedback.student.name, text: '' }, tutor: { name: prev.feedback.tutor.name, text: '' } }
      });
      cur = S.months.length - 1; render();
    } else if (act === 'add-session') {
      if (M().weeks[w].sessions.length < 3) M().weeks[w].sessions.push({ date: '', start: '16:00', end: '17:30', subject: 'mtk', topic: '' });
      render();
    } else if (act === 'del-session') {
      M().weeks[w].sessions.splice(i, 1); render();
    } else if (act === 'add-ab') {
      M().abilities[s].push({ text: '', level: 3 }); render();
    } else if (act === 'del-ab') {
      M().abilities[s].splice(i, 1); render();
    } else if (act === 'save-draft') {
      var ok = storeDraft();
      editing = false;
      msg = ok ? 'Draft tersimpan di browser ini. Tekan "Unduh data.js" lalu unggah ke GitHub supaya tampil untuk semua orang.'
               : 'Draft tidak bisa disimpan di browser ini. Pakai "Unduh data.js" supaya perubahanmu tidak hilang.';
      render();
    } else if (act === 'download') {
      storeDraft();
      downloadData();
      msg = 'data.js sudah diunduh. Unggah file itu ke repositori GitHub untuk mengganti data.js yang lama.';
      if (editing) editing = false;
      render();
    } else if (act === 'discard-draft') {
      try { localStorage.removeItem(KEY); } catch (err) { /* abaikan */ }
      S = JSON.parse(JSON.stringify(window.LAPORAN_DATA));
      hasDraft = false; msg = ''; cur = S.months.length - 1; render();
    }
  });

  render();
})();
