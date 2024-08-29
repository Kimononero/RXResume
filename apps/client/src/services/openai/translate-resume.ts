import { openai } from "./client";
import { useResumeStore } from "@/client/stores/resume";

const MAX_RETRIES = 3;

export const translateResume = async (resume: any, targetLanguage: "en" | "fr") => {
  const initialPrompt = `
    Translate the following resume from ${targetLanguage === "en" ? "French to English" : "English to French"}. 
    Preserve the original structure and formatting. Translate ONLY the specified fields.

    Current resume:
    ${JSON.stringify(resume, null, 2)}

    TRANSLATION INSTRUCTIONS:
    1. Translate the following fields by replacing the original content:
       - data.basics.headline
       - data.sections.summary.content
       - data.sections.skills.items[0].keywords (only if name is "Soft Skills")
       - data.sections.languages.items[].name and description
       - data.sections.education.items[].date
       - data.sections.experience.items[].date, position, and summary
    2. DO NOT translate any other fields, including:
       - data.sections.skills.items[1].keywords (if name is "Hard Skills")
       - Any proper nouns, company names, or technical terms
    3. Preserve all HTML tags, especially <p></p> tags in summaries
    4. For dates, translate month names and format according to the target language conventions
    5. If a field is empty or just contains "<p></p>", leave it as is
    6. Ensure there is a maximum of 5 bullet points per experience item summary, each wrapped in <p></p> tags
    7. IMPORTANT: Replace the content within the existing JSON structure. Do not add new fields or duplicate the structure.
    8. The final output should be a valid JSON object with the same structure as the input, but with translated content in the specified fields.

    Provide the entire resume JSON object with the translated fields, maintaining the original structure.
  `;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const translationResult = await openai().chat.completions.create({
        messages: [{ role: "user", content: initialPrompt }],
        model: "gpt-3.5-turbo-16k",
        max_tokens: 8192,
        temperature: 0.3,
      });

      if (translationResult.choices.length === 0) {
        throw new Error(`OpenAI did not return any choices for translating your resume.`);
      }

      const translatedResume = JSON.parse(translationResult.choices[0].message.content ?? "{}");

      console.log("Translation completed successfully");
      console.log("Translated resume:", JSON.stringify(translatedResume, null, 2));

      // Update the resume in the store
      const { setValue } = useResumeStore.getState();

      // Replace the entire data object
      setValue("data", translatedResume.data);

      return translatedResume;
    } catch (error) {
      console.error(`Translation attempt ${attempt + 1} failed:`, error);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Failed to translate resume after ${MAX_RETRIES} attempts: ${error}`);
      }
    }
  }

  throw new Error("Failed to translate resume after maximum retries.");
};