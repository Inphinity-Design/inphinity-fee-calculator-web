

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import MainNavigation from "@/components/Navigation/MainNavigation";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useCalculateFees } from "@/hooks/use-fee-calculator";
import { Dwelling, Task } from "@/types/calculator";

interface StoredDwelling {
  id: string;
  size: any;
  complexity: any;
  description: any;
  fee: any;
  timeEstimate?: any;
  cappedHours?: any;
  hourlyRate?: any;
}

interface StoredProjectData {
  projectName?: string;
  clientName?: string;
  dwellings?: StoredDwelling[];
  tasks?: Task[];
  location?: string;
}

interface StoredProject {
  id: string;
  name: string;
  clientName: string;
  data: StoredProjectData;
}

const ClickupBuild = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<StoredProjectData | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  
  // Calculate fees for dwellings using the fee calculator hook
  const dwellings = (projectData?.dwellings || []) as Dwelling[];
  const tasks = (projectData?.tasks || []) as Task[];
  const { dwellingsWithFees } = useCalculateFees(dwellings, tasks);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const loadProjectData = () => {
    console.log("=== LOADING PROJECT DATA FROM LOCALSTORAGE ===");
    
    try {
      // Get current project ID directly from localStorage
      const currentProjectId = localStorage.getItem('inphinity-current-project');
      console.log("Current project ID:", currentProjectId);
      
      if (!currentProjectId) {
        console.log("No current project ID found");
        setProjectData(null);
        return;
      }

      // Get saved projects directly from localStorage
      const savedProjectsJson = localStorage.getItem('inphinity-saved-projects');
      console.log("Raw saved projects JSON:", savedProjectsJson);
      
      if (!savedProjectsJson) {
        console.log("No saved projects found");
        setProjectData(null);
        return;
      }

      // Parse the projects
      const savedProjectsData = JSON.parse(savedProjectsJson);
      console.log("Parsed saved projects:", savedProjectsData);
      
      const projects = savedProjectsData.projects || [];
      const currentProject = projects.find((p: StoredProject) => p.id === currentProjectId);
      
      console.log("Found current project:", currentProject);
      
      if (currentProject) {
        console.log("Setting project data:", currentProject.data);
        console.log("Dwelling data found:", currentProject.data?.dwellings);
        
        setProjectData(currentProject.data);
        setProjectName(currentProject.name || "Untitled Project");
        setClientName(currentProject.clientName || "No Client");
        setLocation(currentProject.data?.location || "");
        
        // Enhanced logging for dwelling data
        if (currentProject.data?.dwellings) {
          currentProject.data.dwellings.forEach((dwelling: StoredDwelling, index: number) => {
            console.log(`Dwelling ${index + 1} data:`, {
              size: dwelling.size,
              complexity: dwelling.complexity,
              description: dwelling.description,
              fee: dwelling.fee
            });
          });
        } else {
          console.log("No dwellings found in project data");
        }
      } else {
        console.log("Current project not found in saved projects");
        setProjectData(null);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
      setProjectData(null);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, []);

  // Enhanced storage event listeners with immediate refresh
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("Storage changed detected, refreshing...");
      loadProjectData();
    };

    const handleFocus = () => {
      console.log("Page focused, refreshing data...");
      loadProjectData();
    };

    // Listen for storage events (from other tabs/components)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for focus events (when returning to this tab)
    window.addEventListener('focus', handleFocus);

    // More frequent refresh to catch all updates
    const interval = setInterval(() => {
      loadProjectData();
    }, 1000); // Every 1 second for immediate updates

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleRefreshData = () => {
    console.log("Manual refresh triggered");
    loadProjectData();
    toast({
      description: "Project data refreshed",
    });
  };

  const handleWebhookSubmit = async () => {
    if (!projectData || !projectData.dwellings) {
      toast({
        variant: "destructive",
        title: "No Project Data",
        description: "Please create a project on the Project Input page first.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the new webhook payload structure - single dwelling
      const dwelling = projectData.dwellings[0];
      
      const payload = {
        projectName: projectName,
        projectSize: dwelling?.size || 0,
        projectDescription: dwelling?.description || "",
        projectType: "Generic",
        additionalInfo: {
          location: location || "Not specified",
          client: clientName
        },
        customNotes: customNotes,
        timestamp: new Date().toISOString()
      };
      
      console.log("Sending new payload structure to webhook:", payload);
      
      const response = await fetch(
        "https://n8n.srv872613.hstgr.cloud/webhook/project-scaler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (response.ok) {
        const responseData = await response.json().catch(() => null);
        console.log("Webhook response:", responseData);
        toast({
          title: "Success!",
          description: "Data was successfully sent to Clickup.",
        });
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Webhook failed with status:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Webhook error details:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: "Webhook Failed",
        description: `Failed to send data to Clickup: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[url('/lovable-uploads/803cb05d-3aed-444e-8e0d-182ccc143f72.png')] bg-fixed bg-cover">
      <header className="bg-inphinity-950/90 backdrop-blur-sm text-white py-6 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/41b00d8c-ab4e-4fc4-83af-e29dc46e871f.png" 
              alt="Inphinity Design Logo" 
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center">
                <span className="text-gold">Inphinity</span> Clickup Build
              </h1>
              <p className="text-inphinity-100 text-lg">Send project data to Clickup</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MainNavigation />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-white hover:text-gold"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-inphinity-900/95 backdrop-blur-sm border-inphinity-700 text-white shadow-2xl">
          <CardHeader className="border-b border-inphinity-700">
            <CardTitle className="text-gold text-xl flex items-center justify-between">
              Project Summary
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                className="border-gold hover:bg-gold/20 hover:text-gold"
              >
                Refresh Data
              </Button>
            </CardTitle>
            <CardDescription className="text-inphinity-200">
              Review the project data before sending it to Clickup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {projectData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-gold">Project Name:</h3>
                    <p className="bg-inphinity-800/60 p-3 rounded-md border border-inphinity-600 text-inphinity-100">
                      {projectName}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-gold">Client Name:</h3>
                    <p className="bg-inphinity-800/60 p-3 rounded-md border border-inphinity-600 text-inphinity-100">
                      {clientName}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-gold">Location:</h3>
                    <p className="bg-inphinity-800/60 p-3 rounded-md border border-inphinity-600 text-inphinity-100">
                      {location || "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-gold">Project Type:</h3>
                    <p className="bg-inphinity-800/60 p-3 rounded-md border border-inphinity-600 text-inphinity-100">
                      Generic
                    </p>
                  </div>
                </div>
                
                {projectData.dwellings && projectData.dwellings.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-4 text-gold">Project Details:</h3>
                    <div className="bg-inphinity-800/40 p-4 rounded-md border border-inphinity-600">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-inphinity-300">Project Size:</span>
                          <p className="font-semibold text-gold">{projectData.dwellings[0]?.size || 0} sqm</p>
                        </div>
                        <div>
                          <span className="text-inphinity-300">Complexity:</span>
                          <p className="font-semibold text-inphinity-100">{projectData.dwellings[0]?.complexity || 'Not specified'}/5</p>
                        </div>
                        <div>
                          <span className="text-inphinity-300">Project Fee:</span>
                          <p className="font-semibold text-gold">
                            ${dwellingsWithFees[0]?.fee ? Math.round(dwellingsWithFees[0].fee).toLocaleString() : '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-inphinity-300 text-center py-6">No project data available.</p>
                )}
                
                <div>
                  <h3 className="font-semibold mb-2 text-gold">Additional Notes:</h3>
                  <Textarea 
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Add any additional notes for the Clickup task..."
                    className="min-h-[100px] bg-inphinity-800/60 border-inphinity-600 text-inphinity-100 placeholder:text-inphinity-400 focus:border-gold"
                  />
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <p className="text-lg font-medium text-inphinity-300">
                  No project data found. Please create a project on the Project Input page first.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-inphinity-700 pt-6">
            <Button 
              onClick={handleWebhookSubmit} 
              disabled={isLoading || !projectData}
              className="ml-auto bg-gold hover:bg-gold-dark text-inphinity-950 font-semibold px-6"
            >
              {isLoading ? "Sending..." : "Send to Clickup"}
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      <footer className="bg-inphinity-950/90 backdrop-blur-sm text-white py-4 px-6 md:px-12 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Inphinity Design. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ClickupBuild;
