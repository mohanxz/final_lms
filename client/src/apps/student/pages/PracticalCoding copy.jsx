import { useState, useEffect, useRef, useCallback } from "react";

const LANGUAGES = [
  { id: 54, name: "C++ (GCC 9.2.0)", monacoLang: "cpp" },
  { id: 50, name: "C (GCC 9.2.0)", monacoLang: "c" },
  { id: 62, name: "Java (OpenJDK 13.0.1)", monacoLang: "java" },
  { id: 71, name: "Python (3.8.1)", monacoLang: "python" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)", monacoLang: "javascript" },
  { id: 72, name: "Ruby (2.7.0)", monacoLang: "ruby" },
  { id: 73, name: "Rust (1.40.0)", monacoLang: "rust" },
  { id: 60, name: "Go (1.13.5)", monacoLang: "go" },
  { id: 78, name: "Kotlin (1.3.70)", monacoLang: "kotlin" },
  { id: 74, name: "TypeScript (3.7.4)", monacoLang: "typescript" },
];

const DEFAULT_CODE = {
  cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  python: `print("Hello, World!")`,
  javascript: `console.log("Hello, World!");`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  c: `#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
};

const MONACO_CDN = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs";

function LoadMonaco(callback) {
  if (window.monaco) { callback(); return; }
  if (window._monacoLoading) {
    window._monacoCallbacks = window._monacoCallbacks || [];
    window._monacoCallbacks.push(callback);
    return;
  }
  window._monacoLoading = true;
  window._monacoCallbacks = [callback];
  const script = document.createElement("script");
  script.src = `${MONACO_CDN}/loader.min.js`;
  script.onload = () => {
    window.require.config({ paths: { vs: MONACO_CDN } });
    window.require(["vs/editor/editor.main"], () => {
      window._monacoCallbacks.forEach(cb => cb());
      window._monacoLoading = false;
    });
  };
  document.head.appendChild(script);
}

// Line-by-line comparison helper
function compareOutputs(executed, expected) {
  const execLines = executed.trimEnd().split("\n");
  const expLines = expected.trimEnd().split("\n");
  const maxLen = Math.max(execLines.length, expLines.length);
  return Array.from({ length: maxLen }, (_, i) => ({
    line: execLines[i] ?? null,
    expectedLine: expLines[i] ?? null,
    matched: execLines[i] !== undefined && expLines[i] !== undefined && execLines[i] === expLines[i],
  }));
}

// ─── Props ───────────────────────────────────────────────────────────────────
// testInput  : string  – pre-filled stdin to pass to the program
// testOutput : string  – expected output; compared line-by-line after execution
// testCases  : array   - array of testcase objects { input, expectedOutput, hidden }
// ─────────────────────────────────────────────────────────────────────────────
export default function CodeEditor({ testInput = "", testOutput = "", testCases = [], onChange }) {
  const monacoInstanceRef = useRef(null);
  const containerRef = useRef(null);

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState(testInput);
  const [activeTab, setActiveTab] = useState("output");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [execTime, setExecTime] = useState(null);
  const [execMemory, setExecMemory] = useState(null);
  const [lineCount, setLineCount] = useState(1);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [verdict, setVerdict] = useState(null);       // 'accepted' | 'wrong' | null
  const [comparedLines, setComparedLines] = useState([]);
  const [testCaseResults, setTestCaseResults] = useState(null); 
  const [hiddenFailed, setHiddenFailed] = useState(false);

  // Keep stdin synced with testInput prop
  useEffect(() => { 
     if (testCases && testCases.length > 0 && Array.isArray(testCases[0].input)) {
        setInput(testCases[0].input.join('\n'));
     } else {
        setInput(testInput); 
     }
  }, [testInput, testCases]);

  const initEditor = useCallback(() => {
    if (!containerRef.current || monacoInstanceRef.current) return;
    const editor = window.monaco.editor.create(containerRef.current, {
      value: DEFAULT_CODE[selectedLang.monacoLang] || DEFAULT_CODE.cpp,
      language: selectedLang.monacoLang,
      theme: "vs-dark",
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      minimap: { enabled: true, scale: 0.8 },
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      wordWrap: "off",
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      renderLineHighlight: "all",
      bracketPairColorization: { enabled: true },
      padding: { top: 12, bottom: 12 },
      scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    });
    monacoInstanceRef.current = editor;
    editor.onDidChangeCursorPosition(e =>
      setCursorPos({ line: e.position.lineNumber, col: e.position.column })
    );
    editor.onDidChangeModelContent(() => {
      setLineCount(editor.getModel().getLineCount());
      if (onChange) onChange(editor.getValue(), selectedLang.monacoLang, verdict === "accepted");
    });
    setLineCount(editor.getModel().getLineCount());
    setEditorReady(true);
  }, []);

  useEffect(() => {
    LoadMonaco(initEditor);
    return () => {
      if (monacoInstanceRef.current) {
        monacoInstanceRef.current.dispose();
        monacoInstanceRef.current = null;
      }
    };
  }, []);

  const switchLanguage = (lang) => {
    setSelectedLang(lang);
    setLangDropOpen(false);
    if (monacoInstanceRef.current && window.monaco) {
      const model = monacoInstanceRef.current.getModel();
      window.monaco.editor.setModelLanguage(model, lang.monacoLang);
      const def = DEFAULT_CODE[lang.monacoLang];
      if (def) monacoInstanceRef.current.setValue(def);
    }
  };

  const btoa_utf8 = (str) => btoa(unescape(encodeURIComponent(str)));
  const atob_utf8 = (str) => {
    try { return decodeURIComponent(escape(atob(str))); } catch { return atob(str); }
  };

  // Called once execution finishes — handles comparison logic
  const handleOutputReady = (executedOutput) => {
    setOutput(executedOutput);
    if (!testOutput) {
      setVerdict(null);
      setComparedLines([]);
      return;
    }
    const lines = compareOutputs(executedOutput, testOutput);
    setComparedLines(lines);
    const execLineCount = executedOutput.trimEnd().split("\n").length;
    const expLineCount = testOutput.trimEnd().split("\n").length;
    const allMatch = lines.length > 0 && lines.every(l => l.matched) && execLineCount === expLineCount;
    if (allMatch) {
      console.log(10); // Full match → score 10
      setVerdict("accepted");
    } else {
      setVerdict("wrong");
    }
  };

  const executeSingle = async (code, stdinStr) => {
    const tryJudge0 = async () => {
      const baseUrl = "https://ce.judge0.com/submissions";
      const submitRes = await fetch(`${baseUrl}?base64_encoded=true&wait=false`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          source_code: btoa_utf8(code),
          language_id: selectedLang.id,
          stdin: btoa_utf8(stdinStr || ""),
        }),
      });
      if (!submitRes.ok) {
        const txt = await submitRes.text().catch(() => "");
        throw new Error(`Submit ${submitRes.status}: ${txt.slice(0, 120)}`);
      }
      const { token } = await submitRes.json();
      if (!token) throw new Error("No token returned");
      const pollUrl = `${baseUrl}/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,status,time,memory`;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 800));
        const pollRes = await fetch(pollUrl, { headers: { "Accept": "application/json" } });
        if (!pollRes.ok) continue;
        const data = await pollRes.json();
        if (!data.status || data.status.id <= 2) continue;
        const out = data.stdout ? atob_utf8(data.stdout) : "";
        const err = data.stderr ? atob_utf8(data.stderr) : "";
        const compErr = data.compile_output ? atob_utf8(data.compile_output) : "";
        const combined = [out, compErr ? "[compile]\n" + compErr : "", err ? "[stderr]\n" + err : ""]
          .filter(Boolean).join("\n").trim();
        return { combined: combined || "(no output)", data, exitCode: data.status.id === 3 ? 0 : 1 };
      }
      throw new Error("Timed out");
    };

    const tryPiston = async () => {
      const langMap = {
        cpp: { language: "c++", version: "10.2.0" },
        c: { language: "c", version: "10.2.0" },
        python: { language: "python", version: "3.10.0" },
        javascript: { language: "javascript", version: "18.15.0" },
        java: { language: "java", version: "15.0.2" },
        go: { language: "go", version: "1.16.2" },
        rust: { language: "rust", version: "1.50.0" },
        ruby: { language: "ruby", version: "3.0.1" },
        kotlin: { language: "kotlin", version: "1.6.20" },
        typescript: { language: "typescript", version: "5.0.3" },
      };
      const lang = langMap[selectedLang.monacoLang] || { language: selectedLang.monacoLang, version: "*" };
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.language,
          version: lang.version,
          files: [{ name: `main.${selectedLang.monacoLang}`, content: code }],
          stdin: stdinStr || "",
        }),
      });
      if (!res.ok) throw new Error(`Piston ${res.status}`);
      const piston = await res.json();
      const out = (piston.run?.output || piston.compile?.output || "(no output)").trim();
      return { combined: out, exitCode: piston.run?.code ?? piston.compile?.code, data: { time: null, memory: null, status: { description: piston.run?.code === 0 ? "Accepted" : "Error" } } };
    };

    try {
      return await tryJudge0();
    } catch (e) {
      console.warn("[Judge0] failed:", e.message, "→ trying Piston");
      return await tryPiston();
    }
  };

  const checkMatch = (executedOutput, expectedOutput) => {
    const execLines = executedOutput.trimEnd().split("\n");
    const expLines = expectedOutput.trimEnd().split("\n");
    const lines = compareOutputs(executedOutput, expectedOutput);
    return lines.length > 0 && lines.every(l => l.matched) && execLines.length === expLines.length;
  };

  const runCode = async () => {
    if (!monacoInstanceRef.current || running) return;
    const code = monacoInstanceRef.current.getValue();
    if (!code.trim()) return;

    setRunning(true);
    setOutput("");
    setComparedLines([]);
    setVerdict(null);
    setExecTime(null);
    setExecMemory(null);
    setTestCaseResults(null);
    setHiddenFailed(false);
    setActiveTab("output");
    setStatus({ type: "info", text: "Executing..." });

    const casesToRun = (testCases && testCases.length > 0) 
      ? testCases 
      : [{ input: typeof testInput === 'string' ? testInput.split('\n') : testInput, expectedOutput: typeof testOutput === 'string' ? testOutput.split('\n') : testOutput, hidden: false }];

    let passedCount = 0;
    let anyHiddenFail = false;
    let firstOutput = "";
    let dataOut = null;
    let lines = [];

    try {
      // For manual custom input execution
      if (input !== casesToRun[0]?.input?.join('\n') && input !== casesToRun[0]?.input) {
        setStatus({ type: "info", text: "Running custom input..." });
        const { combined, data, exitCode } = await executeSingle(code, input);
        setOutput(combined);
        setExecTime(data?.time ? `${(parseFloat(data.time) * 1000).toFixed(0)}ms` : null);
        setExecMemory(data?.memory ? `${data.memory}KB` : null);
        setStatus({ type: exitCode === 0 ? "success" : "error", text: exitCode === 0 ? "Execution Finished" : "Execution Failed" });
        setRunning(false);
        return;
      }

      setStatus({ type: "info", text: `Running ${casesToRun.length} test cases...` });
      const results = [];

      for (let i = 0; i < casesToRun.length; i++) {
        const tc = casesToRun[i];
        const tcInputStr = Array.isArray(tc.input) ? tc.input.join('\n') : String(tc.input || "");
        const tcExpStr = Array.isArray(tc.expectedOutput) ? tc.expectedOutput.join('\n') : String(tc.expectedOutput || "");
        
        const { combined, data, exitCode } = await executeSingle(code, tcInputStr);
        if (i === 0) {
          firstOutput = combined;
          dataOut = data;
          lines = compareOutputs(combined, tcExpStr);
        }

        const isMatch = checkMatch(combined, tcExpStr);
        if (isMatch) {
          passedCount++;
        } else if (tc.hidden) {
          anyHiddenFail = true;
        }

        results.push({ passed: isMatch, hidden: tc.hidden });
      }

      setOutput(firstOutput);
      setComparedLines(lines);
      setTestCaseResults({ passedCount, total: casesToRun.length });
      setHiddenFailed(anyHiddenFail);

      const allMatch = passedCount === casesToRun.length;
      if (allMatch) {
        setVerdict("accepted");
        setStatus({ type: "success", text: `All Test Cases Passed! · ${dataOut?.time ? (parseFloat(dataOut.time)*1000).toFixed(0)+'ms' : '–'}` });
      } else {
        setVerdict("wrong");
        setStatus({ type: "error", text: "Wrong Answer" });
      }

      if (dataOut) {
         setExecTime(dataOut.time ? `${(parseFloat(dataOut.time) * 1000).toFixed(0)}ms` : null);
         setExecMemory(dataOut.memory ? `${dataOut.memory}KB` : null);
      }

    } catch (e) {
      setOutput(`Execution failed: ${e.message}`);
      setStatus({ type: "error", text: "Execution Failed" });
      setVerdict("wrong");
    }

    setRunning(false);
  };

  // Sync with parent whenever important state changes
  useEffect(() => {
    if (onChange && monacoInstanceRef.current && editorReady) {
      onChange(monacoInstanceRef.current.getValue(), selectedLang.monacoLang, verdict === "accepted");
    }
  }, [verdict, selectedLang, editorReady]);

  const statusColor = status?.type === "success" ? "#4ade80" : status?.type === "error" ? "#f87171" : "#94a3b8";
  const fileExt = { python:"py", javascript:"js", java:"java", c:"c", typescript:"ts", ruby:"rb", rust:"rs", go:"go", kotlin:"kt" }[selectedLang.monacoLang] || "cpp";

  // ── Output renderer ────────────────────────────────────────────────────────
  const renderOutput = () => {
    if (running) {
      return (
        <div style={{ color: "#58a6ff", display: "flex", alignItems: "center", gap: 8, padding: 16 }}>
          <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
          Executing code...
        </div>
      );
    }
    if (!output) {
      return <div style={{ color: "#484f58", fontSize: 13, padding: 16 }}>Output will appear here after running code.</div>;
    }

    // Line-by-line diff view (when testOutput is provided)
    if (testOutput && comparedLines.length > 0) {
      const verdictColor = verdict === "accepted" ? "#4ade80" : "#f87171";
      return (
        <div style={{ height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
          {/* Verdict banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", flexShrink: 0, flexWrap: "wrap",
            background: verdict === "accepted" ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)",
            borderBottom: `1px solid ${verdictColor}22`,
            borderLeft: `3px solid ${verdictColor}`,
          }}>
            <span style={{ fontSize: 16, color: verdictColor }}>{verdict === "accepted" ? "✓" : "✗"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: verdictColor }}>
              {verdict === "accepted" ? "Output Matched — Score: 10" : "Wrong Answer"}
            </span>

            {testCaseResults && (
               <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: testCaseResults.passedCount === testCaseResults.total ? "#4ade80" : "#f87171", background: "rgba(0,0,0,0.2)", padding: "3px 8px", borderRadius: 4 }}>
                   Test Cases Passed: {testCaseResults.passedCount}/{testCaseResults.total}
               </span>
            )}
          </div>

          {hiddenFailed && (
             <div style={{ background: "rgba(234,88,12,0.15)", borderLeft: "3px solid #ea580c", padding: "8px 16px", margin: "8px 16px 0", borderRadius: "0 4px 4px 0", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#ea580c", fontSize: 13 }}>⚠️</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fb923c" }}>One or more Hidden Test Cases did not pass. Try refining your logic.</span>
             </div>
          )}

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #21262d", flexShrink: 0 }}>
            <div style={{ padding: "5px 14px", fontSize: 10, color: "#7d8590", borderRight: "1px solid #21262d", letterSpacing: "0.08em" }}>
              YOUR OUTPUT
            </div>
            <div style={{ padding: "5px 14px", fontSize: 10, color: "#7d8590", letterSpacing: "0.08em" }}>
              EXPECTED OUTPUT
            </div>
          </div>

          {/* Lines */}
          {comparedLines.map((item, i) => {
            const matched = item.matched;
            const rowBg = matched ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)";
            const execColor = matched ? "#e6edf3" : "#fca5a5";
            const expColor = matched ? "#86efac" : "#94a3b8"; // green if match, gray if mismatch

            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: rowBg, borderBottom: "1px solid #161b22" }}>
                {/* Your output */}
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 10, padding: "3px 12px",
                  borderRight: "1px solid #21262d",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.75,
                }}>
                  <span style={{ color: "#30363d", userSelect: "none", minWidth: 18, textAlign: "right", flexShrink: 0, fontSize: 11 }}>{i + 1}</span>
                  <span style={{ color: item.line === null ? "#484f58" : execColor, fontStyle: item.line === null ? "italic" : "normal" }}>
                    {item.line ?? "—"}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: matched ? "#4ade80" : "#f87171" }}>
                    {matched ? "✓" : "✗"}
                  </span>
                </div>

                {/* Expected output */}
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 10, padding: "3px 12px",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.75,
                }}>
                  <span style={{ color: "#30363d", userSelect: "none", minWidth: 18, textAlign: "right", flexShrink: 0, fontSize: 11 }}>{i + 1}</span>
                  <span style={{ color: item.expectedLine === null ? "#484f58" : expColor, fontStyle: item.expectedLine === null ? "italic" : "normal" }}>
                    {item.expectedLine ?? "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Plain output (no testOutput)
    return (
      <div style={{ height: "100%", overflow: "auto", padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {output.split("\n").map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 16 }}>
            <span style={{ color: "#30363d", userSelect: "none", minWidth: 24, textAlign: "right" }}>{i + 1}</span>
            <span style={{ color: line.startsWith("[stderr]") || line.startsWith("[compile]") ? "#f87171" : "#e6edf3" }}>{line}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0d1117", fontFamily: "'JetBrains Mono', monospace", color: "#e6edf3", overflow: "hidden" }}>

      {/* ── Top Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, background: "#161b22", borderBottom: "1px solid #21262d", flexShrink: 0, gap: 16 }}>

        {/* File tab */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d1117", border: "1px solid #30363d", borderBottom: "1px solid #0d1117", padding: "6px 14px", borderRadius: "6px 6px 0 0", fontSize: 13 }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>⬡</span>
          main.{fileExt}
        </div>

        {/* Language selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setLangDropOpen(p => !p)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#21262d", border: "1px solid #30363d", borderRadius: 6, padding: "7px 14px", color: "#e6edf3", cursor: "pointer", fontSize: 13, minWidth: 200, justifyContent: "space-between" }}>
            <span>{selectedLang.name}</span>
            <span style={{ opacity: 0.6, fontSize: 10 }}>{langDropOpen ? "▲" : "▼"}</span>
          </button>
          {langDropOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1c2128", border: "1px solid #30363d", borderRadius: 6, zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", maxHeight: 320, overflowY: "auto" }}>
              {LANGUAGES.map(lang => (
                <button key={lang.id} onClick={() => switchLanguage(lang)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: lang.id === selectedLang.id ? "#21262d" : "transparent", color: lang.id === selectedLang.id ? "#58a6ff" : "#e6edf3", border: "none", cursor: "pointer", fontSize: 13, borderLeft: lang.id === selectedLang.id ? "2px solid #58a6ff" : "2px solid transparent" }}>
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Run button */}
        <button onClick={runCode} disabled={running || !editorReady} style={{ display: "flex", alignItems: "center", gap: 8, background: running ? "#21262d" : "#238636", border: "1px solid " + (running ? "#30363d" : "#2ea043"), borderRadius: 6, padding: "8px 20px", color: running ? "#7d8590" : "#fff", cursor: running ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s", fontFamily: "inherit", boxShadow: running ? "none" : "0 0 12px rgba(35,134,54,0.3)" }}>
          {running
            ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 12 }}>◌</span> Running...</>
            : <>▶ Run Code</>}
        </button>
      </div>

      {/* ── Main ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Editor */}
        <div style={{ flex: "1 1 60%", display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid #21262d" }}>
          <div ref={containerRef} style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px", background: "#1f2937", borderTop: "1px solid #21262d", fontSize: 11, color: "#7d8590", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <span>{selectedLang.monacoLang.toUpperCase()}</span>
              <span>UTF-8</span>
              <span>Spaces: 4</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span>{lineCount} lines</span>
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            </div>
          </div>
        </div>

        {/* Output / Input panel */}
        <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", minWidth: 300 }}>

          {/* Panel header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 40, background: "#161b22", borderBottom: "1px solid #21262d", flexShrink: 0 }}>
            <div style={{ display: "flex" }}>
              {["output", "input"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #58a6ff" : "2px solid transparent", padding: "0 16px", height: 40, color: activeTab === tab ? "#58a6ff" : "#7d8590", cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "color 0.15s" }}>
                  {tab === "input" ? "Input" : "Output"}
                  {tab === "input" && testInput && (
                    <span style={{ marginLeft: 6, fontSize: 9, background: "#58a6ff22", color: "#58a6ff", borderRadius: 3, padding: "1px 5px" }}>TEST</span>
                  )}
                </button>
              ))}
            </div>
            {status && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, display: "inline-block", boxShadow: `0 0 6px ${statusColor}` }} />
                <span style={{ color: statusColor }}>{status.text}</span>
                {execTime && <span style={{ color: "#7d8590" }}>· {execTime}</span>}
                {execMemory && <span style={{ color: "#7d8590" }}>· {execMemory}</span>}
              </div>
            )}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative", background: "#0d1117" }}>
            {activeTab === "output"
              ? renderOutput()
              : (
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter program input (stdin)..."
                  style={{ width: "100%", height: "100%", background: "#0d1117", color: "#e6edf3", border: "none", outline: "none", padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7, resize: "none", boxSizing: "border-box" }}
                />
              )}
          </div>

          {/* Bottom bar */}
          <div style={{ padding: "4px 16px", background: "#161b22", borderTop: "1px solid #21262d", fontSize: 11, color: "#484f58", flexShrink: 0, display: "flex", justifyContent: "space-between" }}>
            <span>Judge0 CE · Piston Fallback</span>
            {testOutput && (
              <span style={{ color: verdict === "accepted" ? "#4ade80" : verdict === "wrong" ? "#f87171" : "#484f58" }}>
                {verdict === "accepted" ? "✓ Score: 10" : verdict === "wrong" ? "✗ Wrong Answer" : "Expected output loaded"}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        button:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}