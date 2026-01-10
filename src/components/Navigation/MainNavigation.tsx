
import { Link, useLocation } from "react-router-dom";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const MainNavigation = () => {
  const location = useLocation();

  return (
    <div className="flex gap-4">
      <Button
        asChild
        variant={location.pathname === "/" ? "default" : "outline"}
        className="font-medium"
      >
        <Link to="/">Project Input</Link>
      </Button>
      <Button
        asChild
        variant={location.pathname === "/team-distribution" ? "default" : "outline"}
        className="font-medium"
      >
        <Link to="/team-distribution">Team Distribution</Link>
      </Button>
      <Button
        asChild
        variant={location.pathname === "/clickup-build" ? "default" : "outline"}
        className="font-medium"
      >
        <Link to="/clickup-build">Clickup Build</Link>
      </Button>
      <Button
        asChild
        variant={location.pathname === "/settings" ? "default" : "outline"}
        className="font-medium"
        size="icon"
      >
        <Link to="/settings">
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};

export default MainNavigation;
