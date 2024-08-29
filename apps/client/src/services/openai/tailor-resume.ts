import { openai } from "./client";
import { useResumeStore } from "@/client/stores/resume";


const MAX_RETRIES = 3;

const singleWordHardSkills = [
  // Office Tools
  "Excel", "Word", "PowerPoint", "Outlook",
  
  // CRM and CSM Tools
  "Salesforce", "HubSpot", "Zendesk", "Freshdesk", "Intercom", 
  "ChurnZero", "Gainsight", "Totango", "Pendo", "Mixpanel",
  "Userpilot", "WalkMe", "Catalyst", "ClientSuccess",
  
  // Project Management Tools
  "Jira", "Trello", "Asana", "Monday", "Wrike", "ClickUp", 
  "Basecamp", "Notion", "Confluence", "Smartsheet", "LiquidPlanner",
  "Teamwork", "Backlog", "Workfront", "Airtable", "MicrosoftProject",
  
  // Communication Tools
  "Slack", "Zoom", "Skype", "MicrosoftTeams", "Webex", "GoToMeeting",
  "BlueJeans", "RingCentral",
  
  // Programming Languages and Frameworks
  "Python", "JavaScript", "Java", "C++", "React", "Angular", "Vue", "Node",
  "TypeScript", "HTML", "CSS", "SQL", "NoSQL", "MongoDB", "PostgreSQL",
  
  // DevOps Tools
  "Git", "Docker", "Kubernetes", "Terraform", "Ansible", "Puppet", "Chef",
  "Jenkins", "Vagrant", "Bitbucket", "Heroku", "Netlify", "Vercel",
  
  // Cloud Platforms
  "AWS", "Azure", "GCP", "Firebase", "Redshift", "Snowflake", "BigQuery",
  
  // Design and Multimedia Tools
  "Photoshop", "Illustrator", "InDesign", "Figma", "Sketch", 
  "AutoCAD", "Revit", "Blender", "SolidWorks",
  "FinalCut", "Premiere", "AfterEffects", "LogicPro", "Ableton", 
  "GarageBand", "ProTools",
  
  // Data and Analytics Tools
  "Tableau", "PowerBI", "Looker", "Qlik", "SAS", "SPSS", "GoogleAnalytics",
  "Mixpanel", "Hotjar", "Amplitude", "DataStudio", "TagManager", "Metabase",
  "Segment", "Tealium", "Braze", "Heap", "Pandas", "NumPy", "SciPy",
  "PyTorch", "TensorFlow", "Keras", "Scikit-learn", "Hadoop", "Spark",
  
  // Event Management Tools
  "Eventbrite", "Cvent", "Aventri", "Bizzabo", "Hopin", "Whova", "Splash", 
  "Boomset", "Socio", "Swapcard", "Airmeet", "vFairs", "Brella", "ON24",
  
  // Customer Support Tools
  "Zendesk", "Freshdesk", "Intercom", "LiveChat", "Helpscout", "Kayako", 
  "Olark", "ZohoDesk", "Front", "HappyFox", "Groove", "Desk.com",
  
  // Marketing Automation and Ads Tools
  "Marketo", "Mailchimp", "ConstantContact", "ConvertKit", 
  "HubSpot", "Hootsuite", "Buffer", "SproutSocial", "CoSchedule",
  "GoogleAds", "FacebookAds", "LinkedInAds", "BingAds", "TikTokAds", 
  "SnapchatAds", "Taboola", "Outbrain", "AdRoll",

  // Others
  "Stripe", "PayPal", "Twilio", "Shopify", "Magento", "WordPress",
  "Wix", "Squarespace", "Xero", "QuickBooks", "FreshBooks", "Harvest", 
  "Toggl", "Miro", "Sentry", "Crashlytics", "Rollbar", "FullStory",
  "Cloudflare", "PagerDuty", "Opsgenie", "SumoLogic", "Graylog",
  "Nagios", "Splunk", "Prometheus", "Grafana"
];


export const tailorResume = async (resume: any, jobDescription: string) => {
  const initialPrompt = `
    Tailor IN ENGLISH the following resume STRICTLY to this job description: "${jobDescription}"

    Current resume:
    ${JSON.stringify(resume, null, 2)}

    Provide a JSON object with this structure, following these STRICT rules:
    {
      "basics": {
        "headline": "TAILORED headline matching the job description exactly"
      },
      "sections": {
        "summary": {
          "content": "TAILORED summary (2 sentences MAX). If original is "<p></p>", LEAVE "<p></p>"."
        },
        "skills": {
          "items": [
            {
              "name": "Soft Skills",
              "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
            },
            {
              "name": "Hard Skills",
              "keywords": ["tool1", "tool2", "tool3", "tool4", "tool5"]
            }
          ]
        },
        "experience": {
          "items": [
            {
              "summary": "<p>Bullet point 1</p><p>Bullet point 2</p><p>Bullet point 3</p><p>Bullet point 4</p><p>Bullet point 5</p>"
            },
            // ... for EACH experience item, ensure it's tailored
          ]
        }
      }
    }

    CRITICAL INSTRUCTIONS:
    1. Use ONLY information from the original resume. DO NOT invent or add new information.
    2. The headline MUST be a job title ONLY (e.g., "Product Manager", "Junior Developer"). NO additional descriptions.
    3. If the original summary is empty, the tailored summary MUST also be empty.
    4. DO NOT modify the soft skills. Keep them exactly as they are in the original resume.
    5. Hard skills will be handled separately, leave them as placeholders for now.
    6. EACH experience summary MUST be specifically tailored to match the job description. This is MANDATORY for ALL experience items.
    7. Format each bullet point in experience summaries wrapped in <p></p> tags.
    8. Ensure all changes directly relate to the provided job description.
    9. DOUBLE-CHECK that ALL experience summaries are tailored before returning the result.
    10. Each experience summary should have a MAXIMUM of 5 bullet points.

    IMPORTANT: 
    - Ensure that EVERY experience item is tailored, not just the first one.
    - DO NOT modify soft skills under any circumstances.
    - Ensure there is a maximum of 5 bullet points per experience item, each wrapped in <p></p> tags.
  `;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const initialResult = await openai().chat.completions.create({
        messages: [{ role: "user", content: initialPrompt }],
        model: "gpt-3.5-turbo-16k",
        max_tokens: 8192,
        temperature: 0.7,
      });

      if (initialResult.choices.length === 0) {
        throw new Error(`OpenAI did not return any choices for tailoring your resume.`);
      }

      const tailoredResume = JSON.parse(initialResult.choices[0].message.content ?? "{}");

      // Validate and format experience summaries
      const formattedExperience = tailoredResume.sections.experience.items.map((item: any) => {
        const bulletPoints = item.summary.match(/<p>.*?<\/p>/g) || [];
        if (bulletPoints.length === 0 || bulletPoints.length > 5) {
          throw new Error("Invalid number of bullet points in experience summary.");
        }
        return {
          ...item,
          summary: bulletPoints.join('')
        };
      });

      tailoredResume.sections.experience.items = formattedExperience;

      // Now, let's handle the hard skills
      const hardSkillsPrompt = `
        Given the job title "${tailoredResume.basics.headline}" and the following list of hard skills:
        ${JSON.stringify(singleWordHardSkills)}

        Select the 5 most relevant hard skills for this job title. Provide them as a JSON array of strings.
        IMPORTANT: Each hard skill MUST be a single word only. Multi-word skills are not allowed.
      `;

      const hardSkillsResult = await openai().chat.completions.create({
        messages: [{ role: "user", content: hardSkillsPrompt }],
        model: "gpt-3.5-turbo-16k",
        max_tokens: 2048,
        temperature: 0.0,
      });

      if (hardSkillsResult.choices.length === 0) {
        throw new Error(`OpenAI did not return any choices for selecting hard skills.`);
      }

      const selectedHardSkills = JSON.parse(hardSkillsResult.choices[0].message.content ?? "[]");

      if (!Array.isArray(selectedHardSkills) || 
          selectedHardSkills.length !== 5 || 
          !selectedHardSkills.every(skill => skill.split(' ').length === 1)) {
        throw new Error("Invalid hard skills selection. Retrying...");
      }

      // Update the hard skills in the tailored resume
      const hardSkillsItem = tailoredResume.sections.skills.items.find((item: any) => item.name === "Hard Skills");
      if (hardSkillsItem) {
        hardSkillsItem.keywords = selectedHardSkills;
      }

      // Update the resume in the store
      const { setValue } = useResumeStore.getState();
      
      // Update headline
      setValue("data.basics.headline", tailoredResume.basics.headline);
      
      // Update summary
      setValue("data.sections.summary.content", tailoredResume.sections.summary.content);
      
      // Update skills
      setValue("data.sections.skills.items", tailoredResume.sections.skills.items);
      
      // Update experience
      tailoredResume.sections.experience.items.forEach((item: any, index: number) => {
        setValue(`data.sections.experience.items.${index}.summary`, item.summary);
      });

      return tailoredResume;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("Failed to generate valid tailored resume after multiple attempts.");
      }
    }
  }

  throw new Error("Failed to tailor resume after maximum retries.");
};