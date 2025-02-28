import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const Spreadsheet = () => {
    const [data, setData] = useState({});
    const [selectedCell, setSelectedCell] = useState(null);
    const [formula, setFormula] = useState('');
    const [selectedRange, setSelectedRange] = useState([]);
    const [cellStyles, setCellStyles] = useState({});

    useEffect(() => {
        axios.get('http://localhost:5000/api/spreadsheet').then(response => {
            setData(response.data);
        });
    }, []);

    const handleChange = (e, cell) => {
        const newValue = e.target.value;
        let updatedData = { ...data, [cell]: newValue };

        if (newValue.startsWith("=")) {
            updatedData[cell] = evaluateFormula(newValue.substring(1), data);
        }

        Object.keys(updatedData).forEach(key => {
            if (updatedData[key].startsWith("=")) {
                updatedData[key] = evaluateFormula(updatedData[key].substring(1), updatedData);
            }
        });

        setData(updatedData);
        axios.post('http://localhost:5000/api/update-cell', { cell, value: newValue });
    };

    const evaluateFormula = (formula, data) => {
        const match = formula.match(/(SUM|AVERAGE|MAX|MIN|COUNT)\(([^)]+)\)/);
        if (!match) return formula;

        const [_, func, range] = match;
        const cells = getCellsFromRange(range, data);
        
        switch (func) {
            case "SUM":
                return cells.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            case "AVERAGE":
                return cells.length ? (cells.reduce((sum, val) => sum + (parseFloat(val) || 0), 0) / cells.length) : 0;
            case "MAX":
                return Math.max(...cells.map(val => parseFloat(val) || 0));
            case "MIN":
                return Math.min(...cells.map(val => parseFloat(val) || 0));
            case "COUNT":
                return cells.filter(val => !isNaN(parseFloat(val))).length;
            default:
                return formula;
        }
    };

    const getCellsFromRange = (range, data) => {
        const [start, end] = range.split(":");
        const startCol = start[0], startRow = parseInt(start.slice(1));
        const endCol = end[0], endRow = parseInt(end.slice(1));

        let values = [];
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
                const cell = String.fromCharCode(col) + row;
                values.push(data[cell] || 0);
            }
        }
        return values;
    };

    const handleMouseDown = (cell) => {
        setSelectedRange([cell]);
    };

    const handleMouseOver = (cell) => {
        if (selectedRange.length > 0) {
            setSelectedRange(prev => [...new Set([...prev, cell])]);
        }
    };

    const handleMouseUp = () => {
        setSelectedRange([]);
    };

    const applyStyle = (style, value) => {
        if (selectedCell) {
            setCellStyles(prev => ({
                ...prev,
                [selectedCell]: { ...prev[selectedCell], [style]: value }
            }));
        }
    };

    const saveData = () => {
        localStorage.setItem("spreadsheetData", JSON.stringify(data));
        localStorage.setItem("spreadsheetStyles", JSON.stringify(cellStyles));
    };

    const loadData = () => {
        const savedData = JSON.parse(localStorage.getItem("spreadsheetData")) || {};
        const savedStyles = JSON.parse(localStorage.getItem("spreadsheetStyles")) || {};
        setData(savedData);
        setCellStyles(savedStyles);
    };

    return (
        <div className="spreadsheet-container">
            <div className="toolbar">
                <button onClick={() => applyStyle("fontWeight", "bold")}>Bold</button>
                <button onClick={() => applyStyle("fontStyle", "italic")}>Italic</button>
                <input type="color" onChange={(e) => applyStyle("color", e.target.value)} />
                <button onClick={saveData}>Save</button>
                <button onClick={loadData}>Load</button>
            </div>
            <div className="formula-bar">
                <span>{selectedCell || 'Select a cell'}</span>
                <input type="text" value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="Enter formula or value" />
                <button onClick={() => handleChange({ target: { value: formula } }, selectedCell)}>Apply</button>
            </div>
            <div className="spreadsheet">
                <div className="row">
                    <div className="corner-cell"></div>
                    {[...Array(5)].map((_, col) => (
                        <div key={col} className="column-label">{String.fromCharCode(65 + col)}</div>
                    ))}
                </div>
                {[...Array(5)].map((_, row) => (
                    <div key={row} className="row">
                        <div className="row-label">{row + 1}</div>
                        {[...Array(5)].map((_, col) => {
                            const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
                            return (
                                <input key={cellId} className={`cell ${selectedRange.includes(cellId) ? "selected-cell" : ""}`} 
                                    value={data[cellId] || ''} 
                                    style={cellStyles[cellId] || {}} 
                                    onMouseDown={() => handleMouseDown(cellId)}
                                    onMouseOver={() => handleMouseOver(cellId)}
                                    onMouseUp={handleMouseUp}
                                    onClick={() => { setSelectedCell(cellId); setFormula(data[cellId] || ''); }} 
                                    onChange={(e) => handleChange(e, cellId)}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Spreadsheet;