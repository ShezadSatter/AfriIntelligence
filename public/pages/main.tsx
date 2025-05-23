import { createRoot } from 'react-dom/client'
import '/pages/index.css'
import App from '/pages/App.tsx'

const domNode = document.getElementById('root');
if (!domNode) {
  throw new Error("Root element not found");
}
const root = createRoot(domNode);
root.render(<App />);
