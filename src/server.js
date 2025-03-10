const app = require('../src/app');
require ('dotenv').config;
app.use(
    cors({
      origin: "https://ai-code-reviewer-pi.vercel.app", 
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
})