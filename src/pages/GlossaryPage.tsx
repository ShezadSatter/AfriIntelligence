import { useSearchParams } from "react-router-dom";
import GlossaryExplorer from "../components/GlossaryExplorer";
import "./glossary.css"; 



const GlossaryPage: React.FC = () => {
  const [params] = useSearchParams();

  const { subject = "", grade = "", topic = "" } = Object.fromEntries(params.entries());

  return (
    <GlossaryExplorer
      initialSubject={subject}
      initialGrade={grade}
      initialTopic={topic}
    />
  );
};


export default GlossaryPage;
