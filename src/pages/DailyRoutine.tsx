import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Dumbbell, Utensils, Droplets, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface YogaExercise {
  id: string;
  name: string;
  duration: string;
  instructions: string;
  completed?: boolean;
}

interface DailyRoutine {
  id: string;
  yoga_exercises: YogaExercise[];
  diet_plan: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  hydration_goal_ml: number;
}

const DailyRoutine = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [routine, setRoutine] = useState<DailyRoutine | null>(null);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [hydrationProgress, setHydrationProgress] = useState(0);

  useEffect(() => {
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Fetch or create today's routine
    const today = new Date().toISOString().split('T')[0];
    let { data, error } = await supabase
      .from("daily_routines")
      .select("*")
      .eq("user_id", user.id)
      .eq("routine_date", today)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create default routine
      const defaultRoutine = {
        user_id: user.id,
        routine_date: today,
        yoga_exercises: [
          {
            id: "yoga_1",
            name: "Sun Salutation (Surya Namaskar)",
            duration: "10 minutes",
            instructions: "12 rounds, focus on breath coordination"
          },
          {
            id: "yoga_2",
            name: "Cat-Cow Pose (Marjaryasana-Bitilasana)",
            duration: "5 minutes",
            instructions: "Gentle spinal flexion, 10-15 repetitions"
          },
          {
            id: "yoga_3",
            name: "Child's Pose (Balasana)",
            duration: "3 minutes",
            instructions: "Relaxation and gentle stretch"
          }
        ],
        diet_plan: {
          breakfast: ["Oatmeal with fruits and nuts", "Green tea"],
          lunch: ["Grilled chicken salad", "Brown rice", "Steamed vegetables"],
          dinner: ["Lentil soup", "Whole grain bread", "Mixed greens"],
          snacks: ["Apple slices with almond butter", "Greek yogurt"]
        },
        hydration_goal_ml: 2000
      };

      const { data: newData, error: createError } = await supabase
        .from("daily_routines")
        .insert(defaultRoutine)
        .select()
        .single();

      if (!createError && newData) {
        data = newData;
      }
    }

    if (data) {
      // Type assertion for JSONB fields
      const typedRoutine: DailyRoutine = {
        ...data,
        yoga_exercises: (data.yoga_exercises as any) || [],
        diet_plan: (data.diet_plan as any) || { breakfast: [], lunch: [], dinner: [], snacks: [] }
      };
      setRoutine(typedRoutine);
      
      // Fetch completions
      const { data: completionData } = await supabase
        .from("routine_completions")
        .select("task_id")
        .eq("user_id", user.id)
        .eq("routine_id", data.id);

      if (completionData) {
        setCompletions(new Set(completionData.map(c => c.task_id)));
      }
    }
  };

  const handleTaskToggle = async (taskId: string, taskType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !routine) return;

    if (completions.has(taskId)) {
      // Remove completion
      const { error } = await supabase
        .from("routine_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("task_id", taskId);

      if (!error) {
        setCompletions(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
    } else {
      // Add completion
      const { error } = await supabase
        .from("routine_completions")
        .insert({
          user_id: user.id,
          routine_id: routine.id,
          task_type: taskType,
          task_id: taskId,
        });

      if (!error) {
        setCompletions(prev => new Set(prev).add(taskId));
        toast({
          title: "Great job!",
          description: "Task completed!",
        });
      }
    }
  };

  const calculateProgress = () => {
    if (!routine) return 0;
    const totalTasks = routine.yoga_exercises.length + 
      Object.values(routine.diet_plan).flat().length;
    return Math.round((completions.size / totalTasks) * 100);
  };

  if (!routine) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="container max-w-6xl mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Progress Overview */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion</span>
                <span className="font-semibold">{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Yoga Exercises */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                Yoga & Exercise
              </CardTitle>
              <CardDescription>Complete your daily yoga routine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {routine.yoga_exercises.map((exercise) => (
                <div key={exercise.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={completions.has(exercise.id)}
                    onCheckedChange={() => handleTaskToggle(exercise.id, 'yoga')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{exercise.name}</h4>
                    <p className="text-sm text-muted-foreground">{exercise.duration}</p>
                    <p className="text-sm mt-2">{exercise.instructions}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Diet Plan */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Diet Plan
              </CardTitle>
              <CardDescription>Track your meals for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(routine.diet_plan).map(([mealType, items]) => (
                <div key={mealType} className="space-y-2">
                  <h4 className="font-semibold capitalize">{mealType}</h4>
                  {items.map((item, idx) => {
                    const taskId = `${mealType}_${idx}`;
                    return (
                      <div key={taskId} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={completions.has(taskId)}
                          onCheckedChange={() => handleTaskToggle(taskId, 'meal')}
                          className="mt-0.5"
                        />
                        <span className="text-sm">{item}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Hydration Tracker */}
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              Hydration Goal
            </CardTitle>
            <CardDescription>
              Target: {routine.hydration_goal_ml}ml daily
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{hydrationProgress}ml / {routine.hydration_goal_ml}ml</span>
              </div>
              <Progress value={(hydrationProgress / routine.hydration_goal_ml) * 100} className="h-3" />
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => setHydrationProgress(prev => Math.min(prev + 250, routine.hydration_goal_ml))}
                >
                  +250ml
                </Button>
                <Button
                  size="sm"
                  onClick={() => setHydrationProgress(prev => Math.min(prev + 500, routine.hydration_goal_ml))}
                >
                  +500ml
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHydrationProgress(0)}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Disclaimer:</strong> This routine is for general wellness guidance only. Consult a licensed healthcare professional or certified trainer before starting any new exercise or diet program.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyRoutine;
