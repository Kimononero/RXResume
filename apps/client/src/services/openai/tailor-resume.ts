import { openai } from "./client";

export const tailorResume = async (resume: any, jobDescription: string) => {
    const prompt = `
      Tailor the following resume STRICTLY to this job description: "${jobDescription}"
  
      Current resume:
      ${JSON.stringify(resume, null, 2)}
  
      Provide a JSON object with this structure, following these STRICT rules:
      {
        "basics": {
          "headline": "TAILORED headline matching the job description exactly"
        },
        "sections": {
          "summary": {
            "content": "TAILORED summary (2 sentences MAX). If original is empty, LEAVE EMPTY."
          },
          "skills": {
            "items": [
              {
                "name": "Soft Skills",
                "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
              },
              {
                "name": "Hard Skills",
                "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
              }
            ]
          },
          "experience": {
            "items": [
              {
                "summary": "- Bullet point 1\\n- Bullet point 2\\n- Bullet point 3"
              },
              // ... for each experience item
            ]
          }
        }
      }
  
      CRITICAL INSTRUCTIONS:
      1. Use ONLY information from the original resume. DO NOT invent or add new information.
      2. The headline MUST accurately reflect the job description.
      3. If the original summary is empty, the tailored summary MUST also be empty.
      4. BOTH soft and hard skills MUST be tailored to the job description.
      5. Skills MUST be single words or very short phrases (e.g., "Communication", "Teamwork", "Salesforce", "Excel").
      6. Hard skills MUST focus on specific tools and software. Use ONE or TWO words MAX for each skill (e.g., "Salesforce", "Zendesk", "Excel", "Jira").
      7. Each experience summary MUST be specifically tailored to match the job description.
      8. Format experience summaries as bullet points, STRICTLY separated by "\\n" for proper line breaks.
      9. Ensure all changes directly relate to the provided job description.
    `;
  
    const result = await openai().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo-16k",
      max_tokens: 4096,
      temperature: 0.5,
    });

  if (result.choices.length === 0) {
    throw new Error(`OpenAI did not return any choices for tailoring your resume.`);
  }

  return JSON.parse(result.choices[0].message.content ?? "{}");
};