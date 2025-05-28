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
      "operator": string (one of: 'gt', 'lt', 'eq', 'between'),
      "value": number,
      "value2": number (required only when operator is 'between'),
      "conjunction": string (one of: 'AND', 'OR', optional for first rule)
    }
  ]
}

Examples:
1. Input: "Customers who spent more than ₹10,000 and visited less than 3 times"
Output: {
  "rules": [
    {"condition":"totalSpent","operator":"gt","value":10000},
    {"condition":"visits","operator":"lt","value":3,"conjunction":"AND"}
  ]
}

2. Input: "Customers who spent between ₹5,000 and ₹10,000 or visited more than 5 times"
Output: {
  "rules": [
    {"condition":"totalSpent","operator":"between","value":5000,"value2":10000},
    {"condition":"visits","operator":"gt","value":5,"conjunction":"OR"}
  ]
}

3. Input: "Customers who haven't visited in the last 30 days and spent between ₹1,000 and ₹5,000"
Output: {
  "rules": [
    {"condition":"lastVisit","operator":"gt","value":30},
    {"condition":"totalSpent","operator":"between","value":1000,"value2":5000,"conjunction":"AND"}
  ]
}

Note: The system will automatically handle the currency symbol (₹) and number formatting. You should only return the numeric values without the currency symbol in the JSON response.`;

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

      rules.forEach((rule, index) => {
        if (!rule.condition || !rule.operator || rule.value === undefined) {
          throw new Error("Invalid rule structure");
        }
        if (!['totalSpent', 'visits', 'lastVisit'].includes(rule.condition)) {
          throw new Error(`Invalid condition: ${rule.condition}`);
        }
        if (!['gt', 'lt', 'eq', 'between'].includes(rule.operator)) {
          throw new Error(`Invalid operator: ${rule.operator}`);
        }
        if (typeof rule.value !== 'number') {
          throw new Error("Value must be a number");
        }
        if (rule.operator === 'between') {
          if (typeof rule.value2 !== 'number') {
            throw new Error("value2 is required for between operator and must be a number");
          }
          if (rule.value > rule.value2) {
            // Swap values if they're in wrong order
            const temp = rule.value;
            rule.value = rule.value2;
            rule.value2 = temp;
          }
        }
        if (index > 0 && !['AND', 'OR'].includes(rule.conjunction)) {
          throw new Error(`Invalid conjunction for rule ${index + 1}: ${rule.conjunction}`);
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