const axios = require('axios')

async function reviewWithOpenAI(code, prompt) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert code reviewer.' },
        { role: 'user', content: `${prompt}\n\nCode:\n${code}` }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  return response.data.choices[0].message.content
}

module.exports = { reviewWithOpenAI }
