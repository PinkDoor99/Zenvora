const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req,res)=>res.send('Zenvora API running'));

app.post('/execute', (req,res)=>{
  const {code} = req.body;
  try {
    const result = eval(code);
    res.json({result});
  } catch(e){
    res.json({error:e.message});
  }
});

app.listen(3001, ()=>console.log('API running on 3001'));
