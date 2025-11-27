"use client";

import { useState } from "react";

type QueryOption = {
  description: string;
  sqlQuery: string;
};

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [schema, setSchema] = useState(
    `Table: transactions
Columns:
- id (bigint, PK)
- account_id (bigint, FK to accounts.id)
- amount (numeric)
- txn_type (text) -- 'credit' or 'debit'
- created_at (timestamp)`
  );
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<QueryOption[]>([]);
  const [error, setError] = useState("");
  const [ghostCompletion, setGhostCompletion] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOptions([]);

    if (!userInput.trim() || !schema.trim()) {
      setError("Please provide both a partially typed question and a schema.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "https://quill-sql-autocomplete.onrender.com/autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userInput,
            schemaDescription: schema,
            conversationHistory: [],
          }),
        }
      );

      if (!res.ok) {
        setError("Backend returned an error. Check server logs.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // --- INLINE AUTOCOMPLETE TEXT ---
      // We accept either:
      // { autocomplete: "..." }  OR  { completions: ["...", ...] }
      const fromAutocomplete =
        typeof data.autocomplete === "string" ? data.autocomplete : "";
      const fromCompletions =
        Array.isArray(data.completions) && data.completions.length > 0
          ? String(data.completions[0])
          : "";

      const rawSuggestion = fromAutocomplete || fromCompletions || "";

      let suffix = "";
      if (
        rawSuggestion &&
        rawSuggestion.toLowerCase().startsWith(userInput.toLowerCase())
      ) {
        suffix = rawSuggestion.slice(userInput.length);
      }

      setGhostCompletion(suffix);

      // --- SQL OPTIONS CARDS ---
     // --- SQL OPTIONS CARDS ---
const sqlOptionsRaw = Array.isArray(data.options) ? data.options : [];

const normalized: QueryOption[] = sqlOptionsRaw
  .map((opt: any): QueryOption => ({
    description: String(opt.description ?? ""),
    sqlQuery: String(
      opt.sqlQuery ?? opt.sql_query ?? opt.sql ?? ""
    ),
  }))
  .filter((o: QueryOption) => Boolean(o.description && o.sqlQuery));

setOptions(normalized);


      setOptions(normalized);
    } catch (err) {
      console.error(err);
      setError(
        "Could not reach backend. Make sure the Render service is awake."
      );
    } finally {
      setLoading(false);
    }
  };

  const copySql = async (sql: string) => {
    try {
      await navigator.clipboard.writeText(sql);
      alert("SQL copied to clipboard");
    } catch {
      alert("Could not copy SQL");
    }
  };

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="title">Natural Language SQL Autocomplete</h1>
          <p className="subtitle">
            Start typing a question in plain English. We autocomplete your
            thought and generate multiple SQL options you can review and copy.
          </p>
        </header>

        {/* FORM PANEL */}
        <section className="panel">
          <form onSubmit={submit} className="form">
            {/* INLINE AUTOCOMPLETE INPUT */}
            <div className="field">
              <label className="label">Your partially typed question</label>
              <div className="queryWrapper">
                {/* Base ghost layer */}
                <div className="queryBase">
                  <span>{userInput}</span>
                  <span className="queryGhost">{ghostCompletion}</span>
                </div>
                {/* Real input on top */}
                <textarea
                  className="queryInputLayer"
                  rows={1}
                  placeholder="Example: total debit amount in the last 30 days"
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    // Clear ghost when user edits, will be refilled on next request
                    setGhostCompletion("");
                  }}
                />
              </div>
            </div>

            {/* SCHEMA TEXTAREA */}
            <div className="field">
              <label className="label">Schema description</label>
              <textarea
                className="input"
                rows={8}
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="button" disabled={loading}>
              {loading
                ? "Generating autocomplete + SQL..."
                : "Generate autocomplete suggestions"}
            </button>
          </form>
        </section>

        {/* RESULTS */}
        <section className="results">
          <h2 className="resultsTitle">Suggestions</h2>
          {options.length === 0 && !loading && (
            <p className="empty">
              No suggestions yet. Type a question and generate autocomplete
              suggestions.
            </p>
          )}
          <div className="resultsGrid">
            {options.map((opt, index) => (
              <div key={index} className="card">
                <div className="cardHeader">
                  <span className="badge">Option {index + 1}</span>
                </div>
                <p className="cardDescription">{opt.description}</p>
                <pre className="codeBlock">
                  <code>{opt.sqlQuery}</code>
                </pre>
                <button
                  type="button"
                  className="copyButton"
                  onClick={() => copySql(opt.sqlQuery)}
                >
                  Copy SQL
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
