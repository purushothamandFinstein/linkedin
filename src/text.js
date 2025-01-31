
// Function to generate content using Gemini API
export async function generateLinkedInContent() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }
  
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
  
      const headers = {
        'Content-Type': 'application/json',
      };
  
      const prompt = `Create an engaging LinkedIn post about latest AI . The post should include a compelling title and a detailed description. Keep it professional, insightful, and engaging. If relevant, include a call to action for engagement.
      also use emoji in the post for better readability and attractiveness.
      !important: the post should be in the form of a linkedin post.
       and don't give like this **Description:** **Title:** **Content:** avoide the stars 
       and dont give like this **LinkedIn Post:** 
      `;
  
      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      };
  
      const response = await axios.post(url, payload, { headers });
  
      if (response.status === 200) {
        const result = response.data;
        if (result.candidates && result.candidates.length > 0) {
          const content = result.candidates[0].content.parts[0].text;
          resultTOsend =  await content.replace(/\*\*/g, '');
          return resultTOsend;
        } else {
          console.warn('No content generated');
          return null;
        }
      } else {
        console.error(`Failed to generate content. Status: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`Error generating LinkedIn content: ${error.message}`);
      return null;
    }
  }
  