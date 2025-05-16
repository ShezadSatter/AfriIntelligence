import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('zu'); // Default to Zulu
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('...');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTranslate = async () => {
    if (!selectedLanguage || !inputText.trim()) {
      alert('Please select a language and enter text to translate.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: inputText, target: selectedLanguage }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      if (!data.data || !data.data.translations || !data.data.translations[0]) {
        throw new Error('Malformed response from backend');
      }

      setTranslatedText(data.data.translations[0].translatedText);
    } catch (error: any) {
      console.error('Translation failed:', error.message);
      setTranslatedText('Translation failed. Check console or server logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (window as any).handleTranslate = handleTranslate;
  }, []);


 const translatePage = async (targetLang: string) => {
  const elements = document.querySelectorAll('[data-i18n]');

  for (const el of elements) {
    const originalText = el.getAttribute('data-original') || el.textContent?.trim();
    if (!originalText) continue;

    // Save the original text once
    el.setAttribute('data-original', originalText);

    try {
      const response = await fetch('http://localhost:3000/translate', {
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
      const res = await fetch('http://localhost:3000/translate-file', {
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
