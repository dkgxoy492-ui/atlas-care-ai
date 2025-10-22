import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User as UserIcon } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    emergency_contact_1_name: "",
    emergency_contact_1_phone: "",
    emergency_contact_1_relation: "",
    emergency_contact_2_name: "",
    emergency_contact_2_phone: "",
    emergency_contact_2_relation: "",
    allergies: "",
    chronic_conditions: "",
    medications: "",
    fitness_level: "",
    preferred_language: "en",
    data_collection_consent: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const medicalHistory = (data.medical_history as any) || { allergies: [], chronic_conditions: [], medications: [] };
        setProfile({
          name: data.name || "",
          age: data.age?.toString() || "",
          gender: data.gender || "",
          emergency_contact_1_name: data.emergency_contact_1_name || "",
          emergency_contact_1_phone: data.emergency_contact_1_phone || "",
          emergency_contact_1_relation: data.emergency_contact_1_relation || "",
          emergency_contact_2_name: data.emergency_contact_2_name || "",
          emergency_contact_2_phone: data.emergency_contact_2_phone || "",
          emergency_contact_2_relation: data.emergency_contact_2_relation || "",
          allergies: medicalHistory.allergies?.join(", ") || "",
          chronic_conditions: medicalHistory.chronic_conditions?.join(", ") || "",
          medications: medicalHistory.medications?.join(", ") || "",
          fitness_level: data.fitness_level || "",
          preferred_language: data.preferred_language || "en",
          data_collection_consent: data.data_collection_consent || false,
        });
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    if (!userId) return;
    
    setLoading(true);

    const medicalHistory = {
      allergies: profile.allergies.split(",").map(s => s.trim()).filter(Boolean),
      chronic_conditions: profile.chronic_conditions.split(",").map(s => s.trim()).filter(Boolean),
      medications: profile.medications.split(",").map(s => s.trim()).filter(Boolean),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        name: profile.name,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender,
        emergency_contact_1_name: profile.emergency_contact_1_name,
        emergency_contact_1_phone: profile.emergency_contact_1_phone,
        emergency_contact_1_relation: profile.emergency_contact_1_relation,
        emergency_contact_2_name: profile.emergency_contact_2_name,
        emergency_contact_2_phone: profile.emergency_contact_2_phone,
        emergency_contact_2_relation: profile.emergency_contact_2_relation,
        medical_history: medicalHistory,
        fitness_level: profile.fitness_level,
        preferred_language: profile.preferred_language,
        data_collection_consent: profile.data_collection_consent,
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile saved successfully!",
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'health_profile_export.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Export Complete",
      description: "Your profile data has been exported.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-primary" />
              Health Profile
            </CardTitle>
            <CardDescription>
              Manage your personal health information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    placeholder="Enter your age"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fitness">Fitness Level</Label>
                  <Select value={profile.fitness_level} onValueChange={(v) => setProfile({ ...profile, fitness_level: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fitness level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Emergency Contacts</h3>
              <div className="space-y-4 border p-4 rounded-lg">
                <p className="text-sm font-medium">Contact 1</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Name"
                    value={profile.emergency_contact_1_name}
                    onChange={(e) => setProfile({ ...profile, emergency_contact_1_name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone"
                    value={profile.emergency_contact_1_phone}
                    onChange={(e) => setProfile({ ...profile, emergency_contact_1_phone: e.target.value })}
                  />
                  <Input
                    placeholder="Relation"
                    value={profile.emergency_contact_1_relation}
                    onChange={(e) => setProfile({ ...profile, emergency_contact_1_relation: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4 border p-4 rounded-lg">
                <p className="text-sm font-medium">Contact 2</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Name"
                    value={profile.emergency_contact_2_name}
                    onChange={(e) => setProfile({ ...profile, emergency_contact_2_name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone"
                    value={profile.emergency_contact_2_phone}
                    onChange={(e) => setProfile({ ...profile, emergency_contact_2_phone: e.target.value })}
                  />
                  <Input
                    placeholder="Relation"
                    value={profile.emergency_contact_2_relation}
                    onChange={(e) => setProfile({ ...profile, emergency_contact_2_relation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medical History</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <Textarea
                    id="allergies"
                    value={profile.allergies}
                    onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                    placeholder="e.g., Penicillin, Peanuts"
                  />
                </div>
                <div>
                  <Label htmlFor="conditions">Chronic Conditions (comma-separated)</Label>
                  <Textarea
                    id="conditions"
                    value={profile.chronic_conditions}
                    onChange={(e) => setProfile({ ...profile, chronic_conditions: e.target.value })}
                    placeholder="e.g., Diabetes, Hypertension"
                  />
                </div>
                <div>
                  <Label htmlFor="medications">Current Medications (comma-separated)</Label>
                  <Textarea
                    id="medications"
                    value={profile.medications}
                    onChange={(e) => setProfile({ ...profile, medications: e.target.value })}
                    placeholder="e.g., Metformin 500mg, Aspirin 81mg"
                  />
                </div>
              </div>
            </div>

            {/* Privacy & Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Privacy & Preferences</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Collection Consent</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow us to collect and analyze your health data to improve AI recommendations
                  </p>
                </div>
                <Switch
                  checked={profile.data_collection_consent}
                  onCheckedChange={(checked) => setProfile({ ...profile, data_collection_consent: checked })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Profile"}
              </Button>
              <Button onClick={handleExport} variant="outline">
                Export Data
              </Button>
            </div>

            {/* Medical Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Privacy Notice:</strong> Your health data is encrypted and stored securely. We follow HIPAA-like best practices. You can export or delete your data at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
