const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
let spreadsheetData = {};

app.get('/api/spreadsheet', (req, res) => {
    res.json(spreadsheetData);
});

app.post('/api/update-cell', (req, res) => {
    const { cell, value } = req.body;
    spreadsheetData[cell] = value;
    res.json({ success: true, updatedCell: { [cell]: value } });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
