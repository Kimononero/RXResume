import { useState } from "react";
import { t, Trans } from "@lingui/macro";
import { Translate, Copy } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Button,
} from "@reactive-resume/ui";
import { useResumeStore } from "@/client/stores/resume";
import { translateResume } from "@/client/services/openai/translate-resume";
import { useToast } from "@/client/hooks/use-toast";


import { getSectionIcon } from "../shared/section-icon";

type Language = "en" | "fr";

interface LanguageOption {
  value: Language;
  label: string;
}

const languageOptions: LanguageOption[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
];

export const TranslateCard = () => {
  const { toast } = useToast();
  const resume = useResumeStore((state) => state.resume);
  const [targetLanguage, setTargetLanguage] = useState<Language>("en");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: t`Copied to clipboard`,
        description: t`The text has been copied to your clipboard.`,
        variant: "success",
      });
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast({
        title: t`Copy failed`,
        description: t`Failed to copy text to clipboard.`,
        variant: "error",
      });
    });
  };

  const handleTranslatePrompt = () => {
    const selectedLanguage = targetLanguage === "fr" ? "French" : "English";
    const prompt = `
  You will receive a resume JSON. Your task is to translate it to ${selectedLanguage}. It is CRITICAL to preserve the exact structure, order, and formatting of the original JSON. Translate ONLY the specified fields.
  
  TRANSLATION INSTRUCTIONS:
  1. Translate ONLY the content of the following fields, keeping their exact position and format:
     - data.basics.headline
     - data.sections.summary.content
     - data.sections.skills.items[0].keywords (only if name is "Soft Skills")
     - data.sections.languages.items[].name and description
     - data.sections.education.items[].date
     - data.sections.experience.items[].date, position, and summary
  2. DO NOT translate or modify any other fields, including:
     - data.sections.skills.items[1].keywords (if name is "Hard Skills")
     - Any proper nouns, company names, or technical terms
     - Any field names, IDs, or structural elements
  3. Preserve all HTML tags, especially <p></p> tags in summaries
  4. For dates, translate month names but keep the exact same format (e.g., "March 2020" should become "Mars 2020" in French)
  5. If a field is empty or just contains "<p></p>", leave it exactly as is
  6. Ensure there is a maximum of 5 bullet points per experience item summary, each wrapped in <p></p> tags
  7. CRITICAL: Maintain the exact order of all fields and objects in the JSON structure
  8. DO NOT add, remove, or reorder any fields or objects in the JSON
  9. The final output must be a valid JSON object with the exact same structure, order, and formatting as the input
  
  Once you confirm that you understand these instructions, I will provide you with the JSON to translate.
    `;
    
    copyToClipboard(prompt);
    toast({
      title: t`Prompt copied`,
      description: t`Paste the prompt in ChatGPT, then copy and paste your resume JSON when prompted.`,
      variant: "success",
    });
    window.open('https://chat.openai.com', '_blank');
  };

  const handleCopyJSON = () => {
    const jsonString = JSON.stringify(resume, null, 2);
    copyToClipboard(jsonString);
    toast({
      title: t`Resume JSON copied`,
      description: t`Paste this JSON into ChatGPT after it confirms understanding the translation instructions.`,
      variant: "success",
    });
  };

  return (
    <Card className="space-y-4">
      <CardContent className="space-y-4">
        <CardTitle className="flex items-center gap-x-2">
          <Translate size={20} />
          {t`Translate Your Resume`}
        </CardTitle>
        <CardDescription>
          <Trans>
            Select a language, copy the translation prompt, or the entire resume JSON to translate using ChatGPT.
          </Trans>
        </CardDescription>
        <Select value={targetLanguage} onValueChange={(value) => setTargetLanguage(value as Language)}>
          <SelectTrigger>
            <SelectValue placeholder={t`Select Language`} />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            onClick={handleTranslatePrompt}
          >
            {t`Translate`}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCopyJSON}
          >
            <Copy size={20} className="mr-2" />
            {t`Copy JSON`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const InformationSection = () => {
  return (
    <section id="information" className="grid gap-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          {getSectionIcon("information")}
          <h2 className="line-clamp-1 text-3xl font-bold">{t`Information`}</h2>
        </div>
      </header>

      <main className="grid gap-y-4">
        <TranslateCard />
      </main>
    </section>
  );
};