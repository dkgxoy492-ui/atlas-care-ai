import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import anatomyMaleFront from "@/assets/anatomy-male-front.png";
import anatomyMaleBack from "@/assets/anatomy-male-back.png";
import anatomyFemaleFront from "@/assets/anatomy-female-front.png";
import anatomyFemaleBack from "@/assets/anatomy-female-back.png";

interface AnatomyViewerProps {
  selectedBodyPart: string | null;
  onBodyPartSelect: (part: string) => void;
}

const bodyParts = [
  { name: "Brain", category: "Head" },
  { name: "Eye", category: "Head" },
  { name: "Ear", category: "Head" },
  { name: "Nose", category: "Head" },
  { name: "Teeth", category: "Head" },
  { name: "Heart", category: "Torso" },
  { name: "Lung", category: "Torso" },
  { name: "Liver", category: "Torso" },
  { name: "Stomach", category: "Torso" },
  { name: "Kidney", category: "Torso" },
  { name: "Intestine", category: "Torso" },
  { name: "Spine", category: "Back" },
  { name: "Arm", category: "Limbs" },
  { name: "Hand", category: "Limbs" },
  { name: "Leg", category: "Limbs" },
  { name: "Foot", category: "Limbs" },
];

const AnatomyViewer = ({ selectedBodyPart, onBodyPartSelect }: AnatomyViewerProps) => {
  const [view, setView] = useState<"front" | "back">("front");
  const [gender, setGender] = useState<"male" | "female">("male");

  return (
    <Card className="shadow-lg border-border h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Human Anatomy</span>
          <div className="flex gap-2">
            <Button
              variant={gender === "male" ? "default" : "outline"}
              size="sm"
              onClick={() => setGender("male")}
            >
              Male
            </Button>
            <Button
              variant={gender === "female" ? "default" : "outline"}
              size="sm"
              onClick={() => setGender("female")}
            >
              Female
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={view} onValueChange={(v) => setView(v as "front" | "back")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="front">Front View</TabsTrigger>
            <TabsTrigger value="back">Back View</TabsTrigger>
          </TabsList>

          <TabsContent value="front" className="mt-4">
            <div className="relative rounded-lg overflow-hidden bg-muted/30 p-4">
              <img
                src={gender === "male" ? anatomyMaleFront : anatomyFemaleFront}
                alt={`${gender === "male" ? "Male" : "Female"} anatomy front view`}
                className="w-full h-auto max-h-[500px] object-contain mx-auto"
              />
            </div>
          </TabsContent>

          <TabsContent value="back" className="mt-4">
            <div className="relative rounded-lg overflow-hidden bg-muted/30 p-4">
              <img
                src={gender === "male" ? anatomyMaleBack : anatomyFemaleBack}
                alt={`${gender === "male" ? "Male" : "Female"} anatomy back view`}
                className="w-full h-auto max-h-[500px] object-contain mx-auto"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Body Parts Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Select Body Part</h3>
          <div className="flex flex-wrap gap-2">
            {bodyParts.map((part) => (
              <Badge
                key={part.name}
                variant={selectedBodyPart === part.name ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => onBodyPartSelect(part.name)}
              >
                {part.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnatomyViewer;
