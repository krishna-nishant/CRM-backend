const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to convert natural language to rule structure
async function convertNaturalLanguageToRules(prompt) {
  try {
    const systemPrompt = `You are a JSON generator that converts natural language queries into rule structures for customer segmentation. 
You must respond with a JSON object containing a "rules" array.

The response must follow this exact format:
{
  "rules": [
    {
      "condition": string (one of: 'totalSpent', 'visits', 'lastVisit'),
      "operator": string (one of: 'gt', 'lt', 'eq'),
      "value": number
    }
  ]
}

Example:
Input: "Customers who spent more than 10000 and visited less than 3 times"
Output: {
  "rules": [
    {"condition":"totalSpent","operator":"gt","value":10000},
    {"condition":"visits","operator":"lt","value":3}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content.trim();
    
    try {
      const parsedResponse = JSON.parse(text);
      
      if (!parsedResponse.rules || !Array.isArray(parsedResponse.rules)) {
        throw new Error("Response must contain a rules array");
      }

      const rules = parsedResponse.rules;

      rules.forEach(rule => {
        if (!rule.condition || !rule.operator || rule.value === undefined) {
          throw new Error("Invalid rule structure");
        }
        if (!['totalSpent', 'visits', 'lastVisit'].includes(rule.condition)) {
          throw new Error(`Invalid condition: ${rule.condition}`);
        }
        if (!['gt', 'lt', 'eq'].includes(rule.operator)) {
          throw new Error(`Invalid operator: ${rule.operator}`);
        }
        if (typeof rule.value !== 'number') {
          throw new Error("Value must be a number");
        }
      });

      return rules;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`AI service error: ${error.message}`);
  }
}

module.exports = {
  convertNaturalLanguageToRules
}; 