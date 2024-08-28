import { openai } from "./client";

export const tailorResume = async (resume: any, jobDescription: string) => {
  const prompt = `
    Tailor the following resume to better fit this job description: "${jobDescription}"

    Current resume:
    ${JSON.stringify(resume, null, 2)}

    Please provide a JSON object with the following structure:
    {
      "basics": {
        "headline": "Tailored headline"
      },
      "sections": {
        "summary": {
          "content": "Tailored summary content"
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
              "summary": "Tailored experience summary"
            },
            // ... for each experience item
          ]
        }
      }
    }

    Important: Do not invent or fabricate any information. Use only the information provided in the original resume. For skills, only replace existing keywords, do not add or remove any. Ensure there are always exactly 5 keywords for each skill item.
  `;

  const result = await openai().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo-16k",
    max_tokens: 2048,
    temperature: 0,
  });

  if (result.choices.length === 0) {
    throw new Error(`OpenAI did not return any choices for tailoring your resume.`);
  }

  return JSON.parse(result.choices[0].message.content ?? "{}");
};