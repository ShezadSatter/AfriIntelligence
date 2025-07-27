import { useSearchParams } from "react-router-dom";
import GlossaryExplorer from "../components/GlossaryExplorer";

const GlossaryPage: React.FC = () => {
  const [params] = useSearchParams();
  const subject = params.get("subject") || "";
  const grade = params.get("grade") || "";
  const topic = params.get("topic") || "";

  return (
    <GlossaryExplorer
      initialSubject={subject}
      initialGrade={grade}
      initialTopic={topic}
    />
  );
};

export default GlossaryPage;
