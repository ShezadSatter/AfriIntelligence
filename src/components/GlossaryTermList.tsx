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
    <div style={{ marginTop: "2rem" }}>
      <h2>{selectedTopic}</h2>

      <label style={{ fontWeight: "bold", marginRight: "1rem" }} htmlFor="language-select">
        Select Language:
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={handleLanguageChange}
        aria-label="Select language for translation"
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      <hr style={{ margin: "1rem 0" }} />

      {terms.map((term, idx) => (
        <div key={term.term || idx} style={{ marginBottom: "1.5rem" }}>
          <strong>{term.term}</strong>: {term.definition}
          <div>
            <strong>Context:</strong> {term.context}
          </div>
          <div>
            <strong>Example:</strong> {term.example}
          </div>
          <br />
          <button
            style={{ marginTop: "0.5rem" }}
            onClick={() =>
              handleTranslate(term.definition, term.context, term.example, idx)
            }
            disabled={loadingIndexes.has(idx)}
            aria-label={`Translate term ${term.term}`}
          >
            {loadingIndexes.has(idx) ? "Translating..." : "Translate"}
          </button>
          {translatedTerms[idx] && (
            <div style={{ marginTop: "0.5rem", color: "#007bff" }}>
              <div>
                <strong>Translated Definition:</strong>{" "}
                {translatedTerms[idx].definition || "(no translation)"}
              </div>
              <div>
                <strong>Translated Context:</strong>{" "}
                {translatedTerms[idx].context || "(no translation)"}
              </div>
              <div>
                <strong>Translated Example:</strong>{" "}
                {translatedTerms[idx].example || "(no translation)"}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GlossaryTermList;
