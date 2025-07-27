import React, { useState } from "react";
import { handleMultiTranslate } from "../utils/handleMultipleTranslate";
import type { Term } from "../utils/glossaryApi";


// Term type
// (Removed local Term type definition, using imported Term type instead)

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
  }
};


  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>{selectedTopic}</h2>

      <label style={{ fontWeight: "bold", marginRight: "1rem" }}>
        Select Language:
      </label>
      <select value={selectedLanguage} onChange={handleLanguageChange}>
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      <hr style={{ margin: "1rem 0" }} />

      {terms.map((term, idx) => (
        <div key={idx} style={{ marginBottom: "1.5rem" }}>
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
          >
            Translate
          </button>
          {translatedTerms[idx] && (
  <div style={{ marginTop: "0.5rem", color: "#007bff" }}>
    <div><strong>Translated Definition:</strong> {translatedTerms[idx].definition}</div>
    <div><strong>Translated Context:</strong> {translatedTerms[idx].context}</div>
    <div><strong>Translated Example:</strong> {translatedTerms[idx].example}</div>
  </div>
)}

        </div>
      ))}
    </div>
  );
};

export default GlossaryTermList;
