const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { reviewWithOpenAI } = require('./services/openai')
const { reviewWithGemini } = require('./services/gemini')

const app = express()
app.use(cors())
app.use(express.json())

app.post('/get-review', async (req, res) => {
  const { code, prompt } = req.body

  try {
    const [openaiResponse, geminiResponse] = await Promise.all([
      reviewWithOpenAI(code, prompt),
      reviewWithGemini(code, prompt)
    ])

    const combinedFeedback = `
🔍 OpenAI Feedback:\n${openaiResponse}
🧠 Gemini Feedback:\n${geminiResponse}
✅ Combined Suggestions:
${openaiResponse.length > geminiResponse.length ? openaiResponse : geminiResponse}
    `
    res.json({ feedback: combinedFeedback })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong', details: err.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`MCP server running on port ${PORT}`))
