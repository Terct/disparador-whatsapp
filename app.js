const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const multer = require('multer');
const xlsx = require('xlsx'); 


const app = express();
const port = 2727;

// Middleware para analisar o corpo da solicitação como JSON
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/search-list', (req, res) => {
    const filePath = path.join(__dirname, 'src', 'database', 'list.json');
    // Lê o arquivo list.json e envia os dados como resposta
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo list.json:', err);
            res.status(500).json({ error: 'Erro ao buscar a lista de contatos' });
        } else {
            const contactList = JSON.parse(data);
            res.json(contactList);
        }
    });
});


const upload = multer(); // Remove a configuração para salvar os uploads em disco.

app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo XLSX foi enviado.' });
        }

        const filePath = req.file.buffer; // Acessa o buffer do arquivo enviado.

        const workbook = xlsx.read(filePath, { type: 'buffer' }); // Lê a partir do buffer.

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        // Agora, você pode substituir a lista existente (list.json) pelos dados do arquivo XLSX.
        const listFilePath = path.join(__dirname, 'src', 'database', 'list.json');
        fs.writeFileSync(listFilePath, JSON.stringify(jsonData, null, 2));

        res.sendStatus(200);
    } catch (error) {
        console.error('Erro ao processar o arquivo XLSX:', error);
        res.status(500).json({ error: 'Erro ao processar o arquivo XLSX.' });
    }
});


// Rota para iniciar alguma ação
app.get('/start', (req, res) => {
    // Define o parâmetro "type" como "start"
    const params = { type: 'start' };

    // Faz uma requisição GET para o serviço externo
    axios.get('https://n8n.dagestao.com/webhook-test/startorstop', { params })
        .then(response => {
            // Se a ação for bem-sucedida, você pode enviar uma resposta 200 (OK).
            res.sendStatus(200);
        })
        .catch(error => {
            console.error('Erro ao fazer a requisição "start":', error);
            // Em caso de erro, você pode enviar uma resposta de erro, como 500 (Internal Server Error).
            res.sendStatus(500);
        });
});

// Rota para parar alguma ação
app.get('/stop', (req, res) => {
    // Define o parâmetro "type" como "stop"
    const params = { type: 'stop' };

    // Faz uma requisição GET para o serviço externo
    axios.get('https://n8n.dagestao.com/webhook-test/startorstop', { params })
        .then(response => {
            // Se a ação for bem-sucedida, você pode enviar uma resposta 200 (OK).
            res.sendStatus(200);
        })
        .catch(error => {
            console.error('Erro ao fazer a requisição "stop":', error);
            // Em caso de erro, você pode enviar uma resposta de erro, como 500 (Internal Server Error).
            res.sendStatus(500);
        });
});

app.get('/search-status', (req, res) => {
    const statusFilePath = path.join(__dirname, 'src', 'status.json');
    
    fs.readFile(statusFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo status.json:', err);
            res.status(500).json({ error: 'Erro ao buscar o status' });
        } else {
            try {
                const statusData = JSON.parse(data);
                res.json(statusData);
            } catch (error) {
                console.error('Erro ao analisar o JSON do arquivo status.json:', error);
                res.status(500).json({ error: 'Erro ao buscar o status' });
            }
        }
    });
});


app.listen(port, () => {
    console.log(`API está rodando em http://localhost:${port}`);
  });