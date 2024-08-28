import { t } from "@lingui/macro";
import { RichInput, Button } from "@reactive-resume/ui";
import { useState } from "react";
import { useResumeStore } from "@/client/stores/resume";
import { getSectionIcon } from "../shared/section-icon";
import { tailorResume } from "@/client/services/openai/tailor-resume";
import { useOpenAiStore } from "@/client/stores/openai";
import { toast } from "@/client/hooks/use-toast";

export const NotesSection = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setValue = useResumeStore((state) => state.setValue);
  const resume = useResumeStore((state) => state.resume);
  const aiEnabled = useOpenAiStore((state) => !!state.apiKey);

  const handleTailor = async () => {
    if (!aiEnabled) {
      toast({
        variant: "error",
        title: t`AI features are not enabled`,
        description: t`Please add your OpenAI API key in the settings to use this feature.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const tailoredResume = await tailorResume(resume, jobDescription);
      
      // Update the resume with tailored content
      setValue("basics.headline", tailoredResume.basics.headline);
      setValue("sections.summary.content", tailoredResume.sections.summary.content);
      
      tailoredResume.sections.skills.items.forEach((item: { keywords: string[] }, index: number) => {
        setValue(`sections.skills.items.${index}.keywords`, item.keywords);
      });
      
      tailoredResume.sections.experience.items.forEach((item: { summary: string }, index: number) => {
        setValue(`sections.experience.items.${index}.summary`, item.summary);
      });
      
      setJobDescription(""); // Clear the input after successful tailoring
      toast({
        variant: "success",
        title: t`Resume tailored successfully`,
        description: t`Your resume has been updated to better match the job description.`,
      });
    } catch (error) {
      console.error("Error tailoring resume:", error);
      toast({
        variant: "error",
        title: t`Error tailoring resume`,
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="ai-tailor" className="grid gap-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          {getSectionIcon("notes")}
          <h2 className="line-clamp-1 text-3xl font-bold">{t`AI Resume Tailor`}</h2>
        </div>
      </header>

      <main className="grid gap-y-4">
        <p className="leading-relaxed">
          {t`Paste the job description here, and our AI will tailor your resume to better match the position.`}
        </p>

        <div className="space-y-1.5">
          <RichInput
            content={jobDescription}
            onChange={(content) => setJobDescription(content)}
          />

          <Button
            onClick={handleTailor}
            disabled={isLoading || !jobDescription.trim() || !aiEnabled}
          >
            {isLoading ? t`Tailoring...` : t`Tailor Resume`}
          </Button>

          <p className="text-xs leading-relaxed opacity-75">
            {t`The AI will tailor your headline, skills, summary, and experience descriptions to better match the job description. It will not invent or fabricate information.`}
          </p>
        </div>
      </main>
    </section>
  );
};