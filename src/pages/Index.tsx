import Calculator from "@/components/Calculator/Calculator";
import { useEffect } from "react";
import MainNavigation from "@/components/Navigation/MainNavigation";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  /* useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]); */

  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute('href', '/lovable-uploads/41b00d8c-ab4e-4fc4-83af-e29dc46e871f.png');
    }
    document.title = "Inphinity Design Fee Calculator";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('/lovable-uploads/803cb05d-3aed-444e-8e0d-182ccc143f72.png')] bg-fixed bg-cover">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[url('/lovable-uploads/803cb05d-3aed-444e-8e0d-182ccc143f72.png')] bg-fixed bg-cover overflow-hidden">
      {/* Compact Header */}
      <header className="bg-inphinity-950/90 backdrop-blur-sm text-white py-2 px-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/41b00d8c-ab4e-4fc4-83af-e29dc46e871f.png"
              alt="Inphinity Design Logo"
              className="h-8 w-8"
            />
            <h1 className="text-lg font-bold">
              <span className="text-gold">Inphinity</span> Fee Calculator
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <MainNavigation />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white hover:text-gold h-8 px-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Height */}
      <main className="flex-1 p-2 overflow-hidden">
        <Calculator />
      </main>
    </div>
  );
};

export default Index;
