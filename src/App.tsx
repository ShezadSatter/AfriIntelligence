import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [ setSelectedLanguage] = useState<string>('zu'); // Default to Zulu
 
  useEffect(() => {
  (window as any).handleTranslate = async () => {
    const input = (document.getElementById('inputText') as HTMLTextAreaElement)?.value;
    const target = (document.getElementById('language') as HTMLSelectElement)?.value;

    if (!target || !input) {
      alert('Please select a language and enter text.');
      return;
    }

    try {
      const response = await fetch('https://afri-intelligence.onrender.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: input, target }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const translated = data?.data?.translations?.[0]?.translatedText || '';

      const outputEl = document.getElementById('outputText') as HTMLTextAreaElement;
      if (outputEl) outputEl.value = translated;

    } catch (error: any) {
      console.error('Translation failed:', error.message);
      alert('Translation failed. See console for details.');
    }
  };
}, []);



 const translatePage = async (targetLang: string) => {
  const elements = document.querySelectorAll('[data-i18n]');

  for (const el of elements) {
    const originalText = el.getAttribute('data-original') || el.textContent?.trim();
    if (!originalText) continue;

    // Save the original text once
    el.setAttribute('data-original', originalText);

    try {
      const response = await fetch('https://afri-intelligence.onrender.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: originalText, target: targetLang }),
      });

      const data = await response.json();
      const translated = data?.data?.translations?.[0]?.translatedText;

      if (translated) {
        el.textContent = translated;
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }
};

useEffect(() => {
  const dropdown = document.querySelector('.lang_dropdown') as HTMLSelectElement;
  if (!dropdown) return;

  const handleLangChange = (e: Event) => {
    const lang = (e.target as HTMLSelectElement).value;
    setSelectedLanguage(lang);
    translatePage(lang);
  };

  dropdown.addEventListener('change', handleLangChange);

  return () => {
    dropdown.removeEventListener('change', handleLangChange);
  };
}, []);



const form = document.getElementById('uploadForm');
const loadingOverlay = document.getElementById('loadingOverlay');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (loadingOverlay) {
      loadingOverlay.style.display = 'block'; // Show overlay
    }

    const formData = new FormData(form as HTMLFormElement);
    try {
      const res = await fetch('https://afri-intelligence.onrender.com/translate-file', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translated.docx';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Translation failed');
      }
    } catch (err) {
      alert('Something went wrong. Check console.');
      console.error(err);
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none'; // Hide overlay
      }
    }
  });
}

return(
  <div>test1</div>
)

}


export default App;