"use client";
import { useState, useRef, useEffect, useCallback } from "react";
// ══════════════════════════════════════════════════════════════════════════════
// MONACO LOADER — singleton pattern
// ══════════════════════════════════════════════════════════════════════════════
let _monaco = null, _monacoLoading = false;
const _monacoCbs = [];
const VS = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs";
function loadMonaco() {
  return new Promise((res, rej) => {
    if (_monaco) return res(_monaco);
    _monacoCbs.push({ res, rej });
    if (_monacoLoading) return;
    _monacoLoading = true;
    const s = document.createElement("script");
    s.src = `${VS}/loader.min.js`;
    s.onload = () => {
      window.require.config({ paths: { vs: VS } });
      window.require(["vs/editor/editor.main"], m => {
        _monaco = m;
        _monacoCbs.forEach(c => c.res(m));
      });
    };
    s.onerror = () => _monacoCbs.forEach(c => c.rej(new Error("Monaco load failed")));
    document.head.appendChild(s);
  });
}
// ══════════════════════════════════════════════════════════════════════════════
// LANGUAGE CONFIG  (key = what admin puts in language:[])
// ══════════════════════════════════════════════════════════════════════════════
const LANG = {
  c: { j0: 50, label: "C", monaco: "c", color: "#0077b6", ver: "GCC 10.2" },
  cpp: { j0: 54, label: "C++", monaco: "cpp", color: "#00b4d8", ver: "GCC 10.2" },
  java: { j0: 62, label: "Java", monaco: "java", color: "#f4a261", ver: "JDK 13" },
  java7: { j0: 62, label: "Java 7", monaco: "java", color: "#f4a261", ver: "JDK 7" },
  java15: { j0: 62, label: "Java 15", monaco: "java", color: "#e76f51", ver: "JDK 15" },
  java18: { j0: 62, label: "Java 18", monaco: "java", color: "#e9c46a", ver: "JDK 18" },
  python: { j0: 71, label: "Python 3", monaco: "python", color: "#4ade80", ver: "CPython 3.8" },
  python3: { j0: 71, label: "Python 3", monaco: "python", color: "#4ade80", ver: "CPython 3.11" },
  javascript: { j0: 63, label: "JavaScript", monaco: "javascript", color: "#fbbf24", ver: "Node 12.x" },
  csharp: { j0: 51, label: "C#", monaco: "csharp", color: "#a855f7", ver: "Mono 6.6" },
};
// ══════════════════════════════════════════════════════════════════════════════
// DEFAULT PROPS  (shown when no questions prop is passed)
// ══════════════════════════════════════════════════════════════════════════════
 
// ══════════════════════════════════════════════════════════════════════════════
// JUDGE0 RUNNER
// ══════════════════════════════════════════════════════════════════════════════
async function runJudge0(source, languageId, stdin = "") {
  const t0 = performance.now();
  try {
    const res = await fetch(
      "https://ce.judge0.com/submissions?wait=true&base64_encoded=false",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: source, language_id: languageId, stdin }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const d = await res.json();
    return {
      stdout: (d.stdout || "").trim(),
      stderr: (d.stderr || d.compile_output || "").trim(),
      statusId: d.status?.id,
      status: d.status?.description || "Unknown",
      time: d.time || "0.00",
      memory: d.memory || 0,
      ms: Math.round(performance.now() - t0),
      isOk: d.status?.id === 3,
      isCE: d.status?.id === 6,
      isRE: [7, 8, 9, 10, 11, 12].includes(d.status?.id),
    };
  } catch (e) {
    return { stdout: "", stderr: e.message, statusId: -1, status: "Network Error", time: "0", memory: 0, ms: Math.round(performance.now() - t0), isOk: false, isCE: false, isRE: false };
  }
}
const norm = (s = "") => String(s).trim().replace(/\r\n/g, "\n").trimEnd();
// Normalize admin-supplied testCases into { input, expectedOutput }
function normTestCases(tcs, sampleInput = "") {
  if (!Array.isArray(tcs) || tcs.length === 0) return [];
  return tcs.map(tc => {
    if (typeof tc === "string" || typeof tc === "number")
      return { input: sampleInput, expectedOutput: String(tc) };
    
    // Join arrays if present
    const inp = Array.isArray(tc.input) ? tc.input.join('\n') : (tc.input ?? sampleInput);
    const out = Array.isArray(tc.expectedOutput) ? tc.expectedOutput.join('\n') : (tc.expectedOutput ?? tc.output ?? tc.expected ?? "");
    
    return {
      input: inp,
      expectedOutput: String(out),
    };
  });
}
// ══════════════════════════════════════════════════════════════════════════════
// MONACO EDITOR COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
function MonacoEditor({ value, language, onChange, readOnly = false }) {
  const elRef = useRef(null);
  const edRef = useRef(null);
  const moRef = useRef(null);
  const valRef = useRef(value);
  const cbRef = useRef(onChange);
  useEffect(() => { valRef.current = value; });
  useEffect(() => { cbRef.current = onChange; });
  // Mount / unmount
  useEffect(() => {
    let dead = false;
    loadMonaco().then(m => {
      if (dead || !elRef.current) return;
      moRef.current = m;
      if (!window.__caTheme) {
        window.__caTheme = true;
        m.editor.defineTheme("ca-dark", {
          base: "vs-dark", inherit: true,
          rules: [
            { token: "keyword", foreground: "F97583" },
            { token: "string", foreground: "9ECBFF" },
            { token: "number", foreground: "79B8FF" },
            { token: "comment", foreground: "6A737D", fontStyle: "italic" },
            { token: "type", foreground: "B392F0" },
            { token: "function.declaration", foreground: "B392F0" },
          ],
          colors: {
            "editor.background": "#0a0e17",
            "editor.foreground": "#c9d1d9",
            "editorLineNumber.foreground": "#2a3040",
            "editorLineNumber.activeForeground": "#8b949e",
            "editor.lineHighlightBackground": "#161b2266",
            "editor.selectionBackground": "#2ec86638",
            "editorCursor.foreground": "#2ec866",
            "editorWidget.background": "#161b22",
            "editorSuggestWidget.background": "#161b22",
            "editorSuggestWidget.border": "#30363d",
            "editorSuggestWidget.selectedBackground": "#1c2128",
            "editorHoverWidget.background": "#161b22",
            "editorHoverWidget.border": "#30363d",
            "scrollbarSlider.background": "#1c212880",
            "scrollbarSlider.hoverBackground": "#30363d",
          },
        });
      }
      edRef.current = m.editor.create(elRef.current, {
        value: valRef.current || "",
        language: language || "python",
        theme: "ca-dark",
        readOnly,
        minimap: { enabled: false },
        fontSize: 13.5,
        fontFamily: "'DM Mono', 'Cascadia Code', 'Fira Code', monospace",
        fontLigatures: true,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        overviewRulerLanes: 0,
        padding: { top: 14, bottom: 14 },
        scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
        quickSuggestions: true,
        wordBasedSuggestions: true,
        bracketPairColorization: { enabled: true },
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorBlinking: "expand",
        cursorSmoothCaretAnimation: "on",
      });
      edRef.current.onDidChangeModelContent(() => cbRef.current?.(edRef.current.getValue()));
    }).catch(() => { });
    return () => {
      dead = true;
      edRef.current?.dispose();
      edRef.current = null;
    };
  }, []); // eslint-disable-line
  // Sync value externally (question switch, lang switch)
  useEffect(() => {
    if (!edRef.current) return;
    if (edRef.current.getValue() !== value) edRef.current.setValue(value ?? "");
  }, [value]);
  // Sync language
  useEffect(() => {
    if (!edRef.current || !moRef.current) return;
    const model = edRef.current.getModel();
    if (model) moRef.current.editor.setModelLanguage(model, language || "python");
  }, [language]);
  return (
    <div ref={elRef} style={{ width: "100%", height: "100%", background: "#0a0e17" }} />
  );
}
// ══════════════════════════════════════════════════════════════════════════════
// SCORE RING
// ══════════════════════════════════════════════════════════════════════════════
function ScoreRing({ score, max, size = 110 }) {
  const stroke = 9, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, score / max) : 0;
  const color = pct >= 1 ? "#2ec866" : pct > 0 ? "#f4a261" : "#f85149";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1c2128" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - pct * circ}
        style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.34,1.56,.64,1)", strokeLinecap: "round" }} />
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central"
        style={{ fill: color, fontSize: size * 0.24, fontWeight: 800, fontFamily: "'DM Mono',monospace", transform: "rotate(90deg)", transformOrigin: "center" }}>
        {score}
      </text>
      <text x="50%" y="65%" textAnchor="middle" dominantBaseline="central"
        style={{ fill: "#484f58", fontSize: size * 0.12, fontFamily: "'DM Mono',monospace", transform: "rotate(90deg)", transformOrigin: "center" }}>
        / {max}
      </text>
    </svg>
  );
}
// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function CodeCompiler({
  questions,
  onSave,    // (questionIndex, code, langId) => void  ← save to MongoDB
  onSubmit,  // ({ userId, earnedScore, maxScore, results }) => void
  hideSubmit = false,
  isEmbedded = false,
}) {
  const [qIdx, setQIdx] = useState(0);
  const [langMap, setLangMap] = useState({});    // { qIdx → langId }
  const [codeMap, setCodeMap] = useState({});    // { qIdx → { langId → code } }
  const [savedMap, setSavedMap] = useState({});    // { qIdx → lastRunCode }
  const [passedMap, setPassedMap] = useState({});    // { qIdx → boolean }
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [navWarn, setNavWarn] = useState(false);
  const [pendingQ, setPendingQ] = useState(null);
  const [submitMdl, setSubmitMdl] = useState(false);
  const [langDrop, setLangDrop] = useState(false);
  const [leftW, setLeftW] = useState(38);
  const dragging = useRef(false);
  const ctnRef = useRef(null);
  const langDRef = useRef(null);
  console.log(questions)
  // ── Derived ────────────────────────────────────────────────────────────────
  const q = questions[qIdx] || questions[0];
  const availLangs = (q?.language || ["python3"]).filter(l => !!LANG[l]);
  const langId = langMap[qIdx] ?? availLangs[0] ?? "python3";
  const lCfg = LANG[langId] ?? LANG.python3;
  const testCases = normTestCases(q?.testCases, q?.sampleInput);
  // Score: totalMark ÷ number-of-questions per question
  const maxScore = questions[0]?.defaultScorePerQuestion ?? 10;
  const scorePerQ = maxScore / questions.length;
  const earnedScore = Math.round(
    Object.values(passedMap).filter(Boolean).length * scorePerQ
  );
  // ── Code helpers ───────────────────────────────────────────────────────────
  const getInitCode = useCallback((qi, li) => {
    const rc = questions[qi]?.recentCode;
    if (!rc) return "";
    if (typeof rc === "string") return rc;
    if (typeof rc === "object") return rc[li] ?? "";
    return "";
  }, [questions]);
  const getCode = useCallback((qi, li) => {
    return codeMap[qi]?.[li] ?? getInitCode(qi, li);
  }, [codeMap, getInitCode]);
  const currentCode = getCode(qIdx, langId);
  const setCurrentCode = useCallback((code) => {
    setCodeMap(prev => ({ ...prev, [qIdx]: { ...prev[qIdx], [langId]: code } }));
  }, [qIdx, langId]);
  const hasUnsaved = useCallback((qi) => {
    const li = langMap[qi] ?? (questions[qi]?.language ?? ["python3"])[0] ?? "python3";
    const code = getCode(qi, li);
    const saved = savedMap[qi] ?? "";
    return code.trim().length > 0 && code !== saved;
  }, [langMap, questions, getCode, savedMap]);
  // ── Resize drag ────────────────────────────────────────────────────────────
  useEffect(() => {
    const mv = e => {
      if (!dragging.current || !ctnRef.current) return;
      const r = ctnRef.current.getBoundingClientRect();
      setLeftW(Math.min(62, Math.max(22, ((e.clientX - r.left) / r.width) * 100)));
    };
    const up = () => { dragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, []);
  // Close lang dropdown outside click
  useEffect(() => {
    const h = e => { if (langDRef.current && !langDRef.current.contains(e.target)) setLangDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  // ── Navigation ─────────────────────────────────────────────────────────────
  const doGo = useCallback((idx) => {
    setQIdx(idx);
    setRunResult(null);
    setNavWarn(false);
    setPendingQ(null);
  }, []);
  const tryGo = useCallback((idx) => {
    if (idx === qIdx) return;
    if (hasUnsaved(qIdx)) { setPendingQ(idx); setNavWarn(true); }
    else doGo(idx);
  }, [qIdx, hasUnsaved, doGo]);
  // ── Language change ────────────────────────────────────────────────────────
  const changeLang = (li) => {
    setLangMap(prev => ({ ...prev, [qIdx]: li }));
    setRunResult(null);
    setLangDrop(false);
  };
  // ── RUN ───────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    setRunResult({ _loading: true });
    const code = currentCode;
    // Save = mark code as "run"
    setSavedMap(prev => ({ ...prev, [qIdx]: code }));
    onSave?.(qIdx, code, langId);
    try {
      if (testCases.length === 0) {
        // No test cases: just run with sampleInput
        const out = await runJudge0(code, lCfg.j0, q?.sampleInput || "");
        setRunResult({ _t: "single", ...out });
      } else {
        const results = [];
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const out = await runJudge0(code, lCfg.j0, tc.input);
          const exp = norm(tc.expectedOutput);
          const got = norm(out.stdout);
          results.push({
            id: i + 1,
            input: tc.input,
            expectedOutput: exp,
            ...out,
            got,
            passed: got === exp && out.isOk,
          });
        }
        const allPassed = results.every(r => r.passed);
        // Only award points once; never remove them
        if (allPassed && !passedMap[qIdx]) {
          setPassedMap(prev => ({ ...prev, [qIdx]: true }));
        }
        setRunResult({ _t: "tc", results, allPassed });
      }
    } catch (e) {
      setRunResult({ _t: "err", message: e.message });
    }
    setRunning(false);
  };
  // ── SUBMIT ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const results = questions.map((_, i) => {
      const li = langMap[i] ?? (questions[i]?.language ?? ["python3"])[0] ?? "python3";
      return { questionIndex: i, passed: passedMap[i] || false, score: passedMap[i] ? scorePerQ : 0, code: getCode(i, li), lang: li };
    });
    onSubmit?.({ userId: q?.userId, earnedScore, maxScore, results });
    setSubmitMdl(true);
  };
  // ── Render ─────────────────────────────────────────────────────────────────
  const tcPassed = runResult?._t === "tc" ? runResult.results?.filter(r => r.passed).length : 0;
  const tcTotal = runResult?._t === "tc" ? runResult.results?.length : 0;
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#0a0e17", color: "#c9d1d9", height: isEmbedded ? "100%" : "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#0a0e17}::-webkit-scrollbar-thumb{background:#1c2128;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#30363d}
        .btn{font-family:'DM Sans',sans-serif;cursor:pointer;border-radius:5px;font-size:12.5px;font-weight:600;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px;border:none}
        .btn:disabled{opacity:.4;cursor:not-allowed}
        .btn-ghost{background:#1c2128;border:1px solid #30363d !important;color:#c9d1d9;padding:6px 14px}
        .btn-ghost:hover:not(:disabled){background:#21262d;border-color:#484f58 !important}
        .btn-green{background:#2ec866;color:#0a0e17;padding:7px 18px}
        .btn-green:hover:not(:disabled){background:#3dda72;box-shadow:0 4px 18px #2ec86640;transform:translateY(-1px)}
        .btn-red{background:#f85149;color:#fff;padding:7px 16px}
        .btn-red:hover:not(:disabled){background:#ff6b6b}
        .qnum{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;transition:all .15s;border:1px solid transparent;flex-shrink:0;user-select:none}
        .qn-active{background:#2ec86622;border-color:#2ec86655;color:#2ec866}
        .qn-passed{background:#0a2218;border-color:#2ec86640;color:#2ec866}
        .qn-idle{background:#1c2128;color:#8b949e;border-color:#30363d}
        .qn-idle:hover{background:#21262d;color:#c9d1d9;border-color:#484f58}
        .litem:hover{background:#0f1419 !important}
        .bdg{padding:2px 9px;border-radius:20px;font-size:9.5px;font-weight:700;letter-spacing:.5px}
        .bp{background:#0a2218;color:#2ec866;border:1px solid #2ec86630}
        .bf{background:#2d1111;color:#f85149;border:1px solid #f8514930}
        .bce{background:#2d1131;color:#c084fc;border:1px solid #c084fc30}
        .btle{background:#1a1200;color:#e3b341;border:1px solid #e3b34130}
        .note-box{background:#1e3a1e;border-left:3px solid #2ec866;padding:10px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#a8d5a2;margin:12px 0}
        .code-block{background:#0f1419;border:1px solid #1c2128;border-radius:6px;padding:10px 14px;font-family:'DM Mono',monospace;font-size:12.5px;color:#c9d1d9;white-space:pre;overflow-x:auto;margin:6px 0}
        h3{color:#2ec866;font-size:12px;margin:16px 0 7px;font-family:'DM Mono',monospace;letter-spacing:.3px;text-transform:uppercase}
        p,li{font-size:13.5px;line-height:1.75;color:#8b949e}ul{margin-left:18px}
        strong,em{color:#c9d1d9}code{background:#1c2128;padding:1px 6px;border-radius:3px;font-family:'DM Mono',monospace;font-size:12px;color:#79c0ff}
        .spin{display:inline-block;animation:_spin .85s linear infinite;width:11px;height:11px;border-radius:50%;border:1.5px solid #30363d;border-top-color:#2ec866;flex-shrink:0}
        @keyframes _spin{to{transform:rotate(360deg)}}
        .fade{animation:_fade .22s ease}
        @keyframes _fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .pop{animation:_pop .42s cubic-bezier(.34,1.56,.64,1)}
        @keyframes _pop{from{transform:scale(.55);opacity:0}to{transform:scale(1);opacity:1}}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
        .modal{background:#161b22;border:1px solid #30363d;border-radius:14px;padding:28px;max-width:460px;width:92%;box-shadow:0 28px 72px rgba(0,0,0,.75)}
        .tc-row{padding:9px 14px;border-bottom:1px solid #0a0e17;display:flex;align-items:center;gap:10px;font-size:11.5px;flex-wrap:wrap;transition:background .1s}
        .tc-row:hover{background:#0d1117}
        .out-chip{background:#0f1419;border:1px solid #1c2128;border-radius:20px;padding:2px 10px;font-size:10px;font-family:'DM Mono',monospace}
        .ptab{background:none;border:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;padding:9px 16px;border-bottom:2px solid transparent;transition:all .15s;color:#8b949e}
        .ptab.on{color:#e6edf3;border-bottom-color:#2ec866}
        .ptab:hover{color:#c9d1d9}
      `}</style>
      {/* ─── NAV WARNING MODAL ───────────────────────────────────────────────── */}
      {navWarn && (
        <div className="overlay" onClick={() => { setNavWarn(false); setPendingQ(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "#1a1200", border: "1px solid #e3b34145", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⚠️</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#e6edf3", marginBottom: 2 }}>Unsaved Code Detected</div>
                <div style={{ fontSize: 12, color: "#8b949e" }}>You haven't run your code yet</div>
              </div>
            </div>
            <div style={{ background: "#0f1419", borderLeft: "3px solid #e3b34150", borderRadius: "0 8px 8px 0", padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#8b949e", lineHeight: 1.7 }}>
              Click <strong style={{ color: "#c9d1d9" }}>▶ Run Code</strong> first to save your work automatically. If you leave now, your current code for this question <strong style={{ color: "#f85149" }}>will not be saved</strong>.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => doGo(pendingQ)}>Leave anyway</button>
              <button className="btn btn-green" style={{ flex: 1 }} onClick={() => { setNavWarn(false); setPendingQ(null); }}>Stay & Run First</button>
            </div>
          </div>
        </div>
      )}
      {/* ─── SUBMIT MODAL ────────────────────────────────────────────────────── */}
      {submitMdl && (
        <div className="overlay" onClick={() => setSubmitMdl(false)}>
          <div className="modal" style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div className="pop" style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <ScoreRing score={earnedScore} max={maxScore} />
            </div>
            <div style={{
              fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6,
              color: earnedScore === maxScore ? "#2ec866" : earnedScore > 0 ? "#f4a261" : "#f85149"
            }}>
              {earnedScore === maxScore ? "🎉 Perfect Score!" : earnedScore > 0 ? "✓ Submission Complete" : "Submission Complete"}
            </div>
            <div style={{ fontSize: 14, color: "#8b949e", marginBottom: 20 }}>
              You scored <strong style={{ color: "#c9d1d9" }}>{earnedScore}</strong> out of <strong style={{ color: "#c9d1d9" }}>{maxScore}</strong> marks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
              {questions.map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "#0f1419", borderRadius: 7, border: "1px solid #1c2128" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: passedMap[i] ? "#0a2218" : "#2d1111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      {passedMap[i] ? "✓" : "✕"}
                    </div>
                    <span style={{ fontSize: 13, color: "#8b949e" }}>Question {i + 1}</span>
                  </div>
                  <span className={`bdg ${passedMap[i] ? "bp" : "bf"}`}>
                    {passedMap[i] ? `+${scorePerQ} pts` : "0 pts"}
                  </span>
                </div>
              ))}
            </div>
            <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setSubmitMdl(false)}>Close</button>
          </div>
        </div>
      )}
      {/* ─── TOP NAVBAR ──────────────────────────────────────────────────────── */}
      {/* ─── BODY ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── QUESTION SIDEBAR ─────────────────────────────────────────────── */}
        <div style={{ width: 54, background: "#0d1117", borderRight: "1px solid #1c2128", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 8, flexShrink: 0, overflowY: "auto" }}>
          {questions.map((_, i) => {
            const isPassed = passedMap[i];
            const isActive = i === qIdx;
            const cls = isActive ? "qnum qn-active" : isPassed ? "qnum qn-passed" : "qnum qn-idle";
            return (
              <div key={i} className={cls} onClick={() => tryGo(i)} title={`Question ${i + 1}${isPassed ? " ✓" : ""}`}>
                {isPassed ? "✓" : i + 1}
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: earnedScore > 0 ? "#2ec866" : "#30363d", fontFamily: "'DM Mono',monospace" }}>{earnedScore}</div>
            <div style={{ fontSize: 8, color: "#30363d", fontFamily: "'DM Mono',monospace" }}>/{maxScore}</div>
          </div>
        </div>
        {/* ── SPLIT PANE ───────────────────────────────────────────────────── */}
        <div ref={ctnRef} style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* ── LEFT: Question panel ─────────────────────────────────────── */}
          <div style={{ width: `${leftW}%`, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0d1117", borderRight: "1px solid #1c2128" }}>
            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1c2128", background: "#0a0e17", flexShrink: 0, padding: "0 4px" }}>
              <button className="ptab on">Problem {qIdx + 1}</button>
              {passedMap[qIdx] && (
                <span style={{ marginLeft: "auto", padding: "0 14px", fontSize: 11, color: "#2ec866", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>✓ Solved</span>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
              <div dangerouslySetInnerHTML={{ __html: q?.questionHtml || "" }} />
            </div>
          </div>
          {/* DRAG HANDLE */}
          <div
            onMouseDown={() => { dragging.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
            style={{ width: 4, background: "#1c2128", cursor: "col-resize", flexShrink: 0, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#2ec86655"}
            onMouseLeave={e => e.currentTarget.style.background = "#1c2128"}
          />
          {/* ── RIGHT: Editor ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {/* TOOLBAR */}
            <div style={{ background: "#0d1117", borderBottom: "1px solid #1c2128", padding: "7px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {/* Language selector */}
              <div ref={langDRef} style={{ position: "relative" }}>
                <button onClick={() => setLangDrop(v => !v)}
                  style={{ background: "#1c2128", border: "1px solid #30363d", color: "#c9d1d9", cursor: "pointer", padding: "5px 12px", borderRadius: 5, fontSize: 12, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 7, fontWeight: 500 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: lCfg.color, flexShrink: 0 }} />
                  {lCfg.label}
                  <span style={{ color: "#484f58", fontSize: 9 }}>▾</span>
                </button>
                {langDrop && (
                  <div style={{ position: "absolute", top: "110%", left: 0, background: "#0d1117", border: "1px solid #21262d", borderRadius: 7, zIndex: 50, minWidth: 210, boxShadow: "0 16px 40px rgba(0,0,0,.75)" }}>
                    <div style={{ padding: "5px 12px 3px", fontSize: 9, color: "#484f58", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Mono',monospace" }}>Select Language</div>
                    {availLangs.map(li => {
                      const lc = LANG[li];
                      return (
                        <div key={li} className="litem" onClick={() => changeLang(li)}
                          style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: li === langId ? "#0f1419" : "transparent" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: lc.color }} />
                            <span style={{ fontSize: 13, color: li === langId ? "#e6edf3" : "#8b949e", fontWeight: li === langId ? 600 : 400 }}>{lc.label}</span>
                          </span>
                          <span style={{ fontSize: 10, color: "#484f58", fontFamily: "'DM Mono',monospace" }}>{lc.ver}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 9.5, color: "#30363d", fontFamily: "'DM Mono',monospace" }}>via Judge0 CE</span>
              <div style={{ width: 1, height: 18, background: "#1c2128" }} />
              <span style={{ fontSize: 12, color: "#8b949e" }}>
                Question <strong style={{ color: "#e6edf3" }}>{qIdx + 1}</strong> of {questions.length}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: "#484f58", fontFamily: "'DM Mono',monospace" }}>
                  SCORE <strong style={{ color: earnedScore > 0 ? "#2ec866" : "#484f58" }}>{earnedScore}</strong>/{maxScore}
                </span>
                {!hideSubmit && (
                  <button className="btn btn-green" onClick={handleSubmit} style={{ padding: "5px 16px", fontSize: 12 }}>
                    Submit All
                  </button>
                )}
                {/* <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#2ec866,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0a0e17", flexShrink: 0 }}>
                  {(q?.userId || "U")[0].toUpperCase()}
                </div> */}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                {/* Next question button shown when current Q passed and not last Q */}
                {!running && runResult?._t === "tc" && runResult.allPassed && qIdx < questions.length - 1 && (
                  <button className="btn" onClick={() => doGo(qIdx + 1)}
                    style={{ background: "#0a2218", border: "1px solid #2ec86645", color: "#2ec866", padding: "6px 14px", fontSize: 12 }}>
                    Next →
                  </button>
                )}
                <button className="btn btn-ghost" onClick={handleRun} disabled={running} style={{ minWidth: 120 }}>
                  {running ? <><span className="spin" /> Running…</> : "▶  Run Code"}
                </button>
              </div>
            </div>
            {/* MONACO EDITOR */}
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
              <MonacoEditor
                key={`${qIdx}-${langId}`}   // remount only when question OR lang changes
                value={currentCode}
                language={lCfg.monaco}
                onChange={setCurrentCode}
              />
            </div>
            {/* STATUS BAR */}
            <div style={{ background: "#0d1117", borderTop: "1px solid #1c2128", padding: "3px 13px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "#30363d", fontFamily: "'DM Mono',monospace" }}>{lCfg.ver}</span>
              <span style={{ fontSize: 10, color: "#1c2128", fontFamily: "'DM Mono',monospace" }}>|</span>
              <span style={{ fontSize: 10, color: "#30363d", fontFamily: "'DM Mono',monospace" }}>Judge0 CE</span>
              {hasUnsaved(qIdx) && (
                <span style={{ fontSize: 9.5, color: "#e3b341", fontFamily: "'DM Mono',monospace" }}>● unsaved</span>
              )}
              {passedMap[qIdx] && (
                <span style={{ fontSize: 9.5, color: "#2ec866", fontFamily: "'DM Mono',monospace" }}>✓ solved</span>
              )}
              {running && (
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#2ec866", fontFamily: "'DM Mono',monospace" }}>Running…</span>
              )}
            </div>
            {/* ── OUTPUT PANEL ──────────────────────────────────────────────── */}
            {runResult && (
              <div style={{ borderTop: "2px solid #1c2128", background: "#0d1117", maxHeight: "44%", display: "flex", flexDirection: "column", flexShrink: 0 }} className="fade">
                {/* Panel header */}
                <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2128", background: "#0a0e17", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 9.5, color: "#484f58", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "1px" }}>Output</span>
                  {runResult._t === "tc" && !runResult._loading && (
                    <span className={`bdg ${runResult.allPassed ? "bp" : "bf"}`}>
                      {runResult.allPassed ? `✓ All ${tcTotal} Tests Passed` : `✕ ${tcPassed}/${tcTotal} Tests Passed`}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {/* Loading */}
                  {runResult._loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", color: "#484f58", fontSize: 13, fontFamily: "'DM Mono',monospace" }}>
                      <span className="spin" /> Running test cases…
                    </div>
                  )}
                  {/* Error (network/runtime) */}
                  {runResult._t === "err" && (
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ color: "#f85149", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>⛔ Error</div>
                      <pre style={{ color: "#ffa657", fontFamily: "'DM Mono',monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>{runResult.message}</pre>
                    </div>
                  )}
                  {/* Single run (no test cases) */}
                  {runResult._t === "single" && (
                    <div style={{ padding: "12px 16px" }}>
                      {runResult.isCE ? (
                        <>
                          <div style={{ color: "#c084fc", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>⛔ Compilation Error</div>
                          <pre style={{ background: "#0f1419", border: "1px solid #2d1131", borderRadius: 5, padding: "10px 12px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#ffa657", whiteSpace: "pre-wrap" }}>{runResult.stderr}</pre>
                        </>
                      ) : (
                        <>
                          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                            <span className="out-chip" style={{ color: "#0ea5e9" }}>⏱ {runResult.time}s</span>
                            <span className="out-chip" style={{ color: "#a855f7" }}>💾 {((runResult.memory || 0) / 1024).toFixed(1)}MB</span>
                            <span className="out-chip" style={{ color: runResult.isOk ? "#2ec866" : "#f85149" }}>{runResult.status}</span>
                          </div>
                          {runResult.stdout
                            ? <><div style={{ fontSize: 9, color: "#484f58", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5, fontFamily: "'DM Mono',monospace" }}>stdout</div>
                              <pre style={{ background: "#0f1419", border: "1px solid #1c2128", borderRadius: 5, padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: 13.5, color: "#c9d1d9", whiteSpace: "pre-wrap", marginBottom: 10, lineHeight: 1.7 }}>{runResult.stdout}</pre></>
                            : <div style={{ color: "#484f58", fontSize: 12, fontStyle: "italic" }}>No output produced.</div>
                          }
                          {runResult.stderr && <>
                            <div style={{ fontSize: 9, color: "#e3b341", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5, fontFamily: "'DM Mono',monospace" }}>stderr</div>
                            <pre style={{ background: "#1a1200", border: "1px solid #3d2a00", borderRadius: 5, padding: "10px 12px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#e3b341", whiteSpace: "pre-wrap" }}>{runResult.stderr}</pre>
                          </>}
                        </>
                      )}
                    </div>
                  )}
                  {/* Test cases */}
                  {runResult._t === "tc" && (
                    <>
                      {/* Pass/fail banner */}
                      {runResult.allPassed ? (
                        <div style={{ margin: "12px 14px", background: "#0a2218", border: "1px solid #2ec86640", borderRadius: 9, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }} className="pop">
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#2ec86620", border: "1px solid #2ec86645", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>✓</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#2ec866", marginBottom: 2 }}>All Test Cases Passed!</div>
                            <div style={{ fontSize: 12, color: "#2ec86688" }}>+{scorePerQ} marks added · Code saved automatically</div>
                          </div>
                          {qIdx < questions.length - 1 && (
                            <button className="btn btn-green" onClick={() => doGo(qIdx + 1)} style={{ padding: "7px 16px", fontSize: 12, flexShrink: 0 }}>
                              Next Question →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ margin: "12px 14px", background: "#2d1111", border: "1px solid #f8514940", borderRadius: 9, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 22 }}>✕</span>
                          <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#f85149", marginBottom: 1 }}>Test Cases Failed</div>
                            <div style={{ fontSize: 12, color: "#f8514988" }}>{tcPassed}/{tcTotal} tests passed — fix your code and run again</div>
                          </div>
                        </div>
                      )}
                      {/* Per-test rows */}
                      {runResult.results?.map((tc, i) => (
                        <div key={i} className="tc-row">
                          <span style={{ color: "#484f58", fontFamily: "'DM Mono',monospace", fontSize: 10.5, minWidth: 72 }}>Test {tc.id}</span>
                          <span className={`bdg ${tc.passed ? "bp" : tc.isCE ? "bce" : "bf"}`}>
                            {tc.passed ? "✓ Pass" : tc.isCE ? "CE" : tc.isRE ? "RE" : "✕ Fail"}
                          </span>
                          {!tc.passed && (
                            <>
                              <span style={{ fontSize: 11, color: "#30363d" }}>exp: <code style={{ color: "#2ec866" }}>{tc.expectedOutput || "(empty)"}</code></span>
                              <span style={{ fontSize: 11, color: "#30363d" }}>got: <code style={{ color: "#f85149" }}>{tc.got || (tc.isCE ? "compile error" : "(empty)")}</code></span>
                            </>
                          )}
                          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
                            <span className="out-chip" style={{ color: "#0ea5e9" }}>⏱{tc.time}s</span>
                            <span className="out-chip" style={{ color: "#a855f7" }}>💾{((tc.memory || 0) / 1024).toFixed(1)}MB</span>
                          </div>
                        </div>
                      ))}
                      {/* Stderr if any */}
                      {runResult.results?.some(r => r.stderr) && (
                        <div style={{ padding: "10px 14px" }}>
                          <div style={{ fontSize: 9, color: "#e3b341", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5, fontFamily: "'DM Mono',monospace" }}>stderr / compile output</div>
                          <pre style={{ background: "#1a1200", border: "1px solid #3d2a00", borderRadius: 5, padding: "10px 12px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#e3b341", whiteSpace: "pre-wrap" }}>
                            {runResult.results.map(r => r.stderr).filter(Boolean).join("\n---\n")}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
