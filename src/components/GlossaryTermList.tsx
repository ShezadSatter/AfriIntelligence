import React, { useState } from "react";
import { handleMultiTranslate } from "../utils/handleMultipleTranslate";

type Term = {
  term: string;
  definition: string;
  context: string;
  example: string;
};

const languageOptions = [
  { label: "Afrikaans", code: "af" },
  { label: "isiZulu", code: "zu" },
  { label: "Sesotho", code: "st" },
  { label: "Xhosa", code: "xh" },
];

const GlossaryTermList: React.FC<{ terms: Term[]; selectedTopic: string }> = ({
  terms,
  selectedTopic,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState("af");
  const [translatedTerms, setTranslatedTerms] = useState<{
    [index: number]: {
      definition: string;
      context: string;
      example: string;
    };
  }>({});
  const [loadingIndexes, setLoadingIndexes] = useState<Set<number>>(new Set());

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
    setTranslatedTerms({}); // Reset on language change
  };

  const handleTranslate = async (
    definition: string,
    context: string,
    example: string,
    index: number
  ) => {
    setLoadingIndexes((prev) => new Set(prev).add(index));
    try {
      const [translatedDefinition, translatedContext, translatedExample] =
        await handleMultiTranslate([definition, context, example], selectedLanguage);

      setTranslatedTerms((prev) => ({
        ...prev,
        [index]: {
          definition: translatedDefinition,
          context: translatedContext,
          example: translatedExample,
        },
      }));
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setLoadingIndexes((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  return (
    <div className="term-list">
      <h2 className="topic-heading">{selectedTopic}</h2>

      <div className="language-selector">
        <label htmlFor="language-select">Select Language:</label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={handleLanguageChange}
        >
          {languageOptions.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <hr className="term-divider" />

      {terms.map((term, idx) => {
        const isLoading = loadingIndexes.has(idx);
        const isTranslated = translatedTerms[idx];

        return (
          <div key={term.term || idx} className="term-card">
            <h3 className="term-title">🧠 {term.term}</h3>
            <p><strong>Definition:</strong> {term.definition}</p>
            <p><strong>Context:</strong> {term.context}</p>
            <p><strong>Example:</strong> {term.example}</p>

            <button
              className="translate-button"
              onClick={() =>
                handleTranslate(term.definition, term.context, term.example, idx)
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner" aria-label="Translating" />
              ) : (
                <>🌍 Translate</>
              )}
            </button>

            {isTranslated && (
  <details className="translation">
    <summary>🗣️ View Translation</summary>
    <p><strong>Definition:</strong> {translatedTerms[idx]?.definition ?? ""}</p>
    <p><strong>Context:</strong> {translatedTerms[idx]?.context ?? ""}</p>
    <p><strong>Example:</strong> {translatedTerms[idx]?.example ?? ""}</p>
  </details>
)}

          </div>
        );
      })}
    </div>
  );
};

export default GlossaryTermList;
