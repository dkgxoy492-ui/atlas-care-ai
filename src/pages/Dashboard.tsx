import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Stethoscope, User as UserIcon, Calendar } from "lucide-react";
import AnatomyViewer from "@/components/AnatomyViewer";
import ChatInterface from "@/components/ChatInterface";
import LocationMap from "@/components/LocationMap";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              I Am Doctor
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/profile")} variant="outline" size="sm">
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button onClick={() => navigate("/daily-routine")} variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Daily Routine
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-8">
          {/* Left: Anatomy Viewer */}
          <AnatomyViewer 
            selectedBodyPart={selectedBodyPart}
            onBodyPartSelect={setSelectedBodyPart}
          />

          {/* Right: Chat Interface */}
          <ChatInterface selectedBodyPart={selectedBodyPart} />
        </div>

        {/* Location Map */}
        <div className="max-w-7xl mx-auto">
          <LocationMap />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
