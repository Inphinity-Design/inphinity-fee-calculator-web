import { ReactNode } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface CalculatorLayoutProps {
  sidebar: ReactNode;
  mainContent: ReactNode;
  summaryPanel: ReactNode;
}

const CalculatorLayout = ({ sidebar, mainContent, summaryPanel }: CalculatorLayoutProps) => {
  return (
    <div className="h-[calc(100vh-120px)] w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border bg-card/50 backdrop-blur-sm">
        {/* Left Sidebar */}
        <ResizablePanel defaultSize={5} minSize={4} maxSize={8} className="bg-card/80">
          <div className="h-full p-2">
            {sidebar}
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main Content Area */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full overflow-y-auto p-4">
            {mainContent}
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Summary Panel */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={45} className="bg-primary/5">
          <div className="h-full overflow-y-auto p-4">
            {summaryPanel}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default CalculatorLayout;
