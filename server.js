const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => res.send('Zenvora API running'));

app.post('/execute', (req, res) => {
  const { code } = req.body;

  try {
    const result = eval(code);
    res.json({ result });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// 🔥 REQUIRED FIX FOR RENDER
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on ${PORT}`);
});
