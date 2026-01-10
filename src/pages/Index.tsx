import PublicCalculator from "@/components/PublicCalculator/PublicCalculator";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute('href', '/lovable-uploads/41b00d8c-ab4e-4fc4-83af-e29dc46e871f.png');
    }
    document.title = "Inphinity Design Fee Calculator";
  }, []);

  return <PublicCalculator />;
};

export default Index;
