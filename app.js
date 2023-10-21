const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const multer = require('multer');
const xlsx = require('xlsx');
const { url } = require('inspector');


const app = express();
const port = 2727;

// Middleware para analisar o corpo da solicitação como JSON
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/TriggerForEvents', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'TriggerForEvents.html'));
});


const TriggerForListUrl = "https://n8n.dagestao.com/webhook/startorstop"
const TriggerForEventsUrl = "https://n8n.dagestao.com/webhook/controllertriggerevents"


app.get('/search-list', (req, res) => {
    const filePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'list.json');
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


app.get('/search-records', (req, res) => {
    const filePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'records.json');
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
        const listFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'list.json');
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
    axios.get(TriggerForListUrl , { params })
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

// Rota para iniciar alguma ação
app.get('/restart', (req, res) => {
    // Define o parâmetro "type" como "start"
    const params = { type: 'restart' };

    // Faz uma requisição GET para o serviço externo
    axios.get(TriggerForListUrl , { params })
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
    axios.get(TriggerForListUrl , { params })
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


// Rota para iniciar alguma ação
app.get('/enableTriggerForEvents', (req, res) => {
    // Define o parâmetro "type" como "start"
    const params = { type: 'enable' };

    // Faz uma requisição GET para o serviço externo
    axios.get(TriggerForEventsUrl , { params })
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

// Rota para iniciar alguma ação
app.get('/disableTriggerForEvents', (req, res) => {
    // Define o parâmetro "type" como "start"
    const params = { type: 'disable' };

    // Faz uma requisição GET para o serviço externo
    axios.get(TriggerForEventsUrl , { params })
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



app.get('/search-status', (req, res) => {
    const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'status.json');

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


app.get('/searchStatusTriggerForEvents', (req, res) => {
    const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'status.json');


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


app.get('/searchEventsTriggerForEvents', (req, res) => {
    const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'events.json');


    fs.readFile(statusFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo status.json:', err);
            res.status(500).json({ error: 'Erro ao buscar o arquivo' });
        } else {
            try {
                const statusData = JSON.parse(data);
                res.json(statusData);
            } catch (error) {
                console.error('Erro ao analisar o JSON:', error);
                res.status(500).json({ error: 'Erro ao buscar o status' });
            }
        }
    });
});



app.get('/set-status', (req, res) => {
    const newValue = req.query.value; // Obtém o valor do parâmetro "value" na URL.

    // Valide o novo valor, certificando-se de que atende aos requisitos desejados.
    if (newValue === 'started' || newValue === 'stopped' || newValue === 'processing') {
        // Leia o arquivo JSON existente.
        const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'status.json');
        const existingData = require(statusFilePath);

        // Atualize o valor de "status" no objeto JSON.
        existingData[0].status = newValue;

        // Salve o objeto JSON atualizado de volta no arquivo.
        fs.writeFileSync(statusFilePath, JSON.stringify(existingData, null, 2));

        res.json({ success: true, message: 'Status atualizado com sucesso.' });
    } else {
        res.status(400).json({ error: 'O valor "value" deve ser "started" ou "stopped".' });
    }
});


app.get('/setStatusTriggerForEvents', (req, res) => {
    const newValue = req.query.value; // Obtém o valor do parâmetro "value" na URL.

    // Valide o novo valor, certificando-se de que atende aos requisitos desejados.
    if (newValue === 'activated' || newValue === 'disabled' || newValue === 'processing') {
        // Leia o arquivo JSON existente.
        const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'status.json');
        const existingData = require(statusFilePath);

        // Atualize o valor de "status" no objeto JSON.
        existingData[0].status = newValue;

        // Salve o objeto JSON atualizado de volta no arquivo.
        fs.writeFileSync(statusFilePath, JSON.stringify(existingData, null, 2));

        res.json({ success: true, message: 'Status atualizado com sucesso.' });
    } else {
        res.status(400).json({ error: 'O valor "value" deve ser "started" ou "stopped".' });
    }
});



app.get('/set-line', (req, res) => {
    const newValue = req.query.value;

    // Certifique-se de validar o novo valor aqui, se necessário.

    // Converta a string em um número (inteiro neste caso).
    const numericValue = parseInt(newValue, 10);

    if (!isNaN(numericValue)) {
        // Leia o arquivo JSON existente.
        const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'status.json');
        const existingData = require(statusFilePath);

        // Atualize o valor de "lastLine" no objeto JSON com o valor numérico.
        existingData[0].lastLine = numericValue;

        // Salve o objeto JSON atualizado de volta no arquivo.
        fs.writeFileSync(statusFilePath, JSON.stringify(existingData, null, 2));

        res.json({ success: true, message: 'Linha atualizado com sucesso.' });
    } else {
        res.json({ success: false, message: 'O valor não é um número válido.' });
    }
});


app.get('/set-progress', (req, res) => {
    const newValue = req.query.value; // Obtém o valor do parâmetro "value" na URL.


    // Leia o arquivo JSON existente.
    const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'status.json');
    const existingData = require(statusFilePath);

    // Atualize o valor de "status" no objeto JSON.
    existingData[0].progress = newValue;

    // Salve o objeto JSON atualizado de volta no arquivo.
    fs.writeFileSync(statusFilePath, JSON.stringify(existingData, null, 2));

    res.json({ success: true, message: 'Status atualizado com sucesso.' });

});

app.get('/fetch-instances', async (req, res) => {
    const maxLine = req.query.maxline;
    const evo = req.query.evo;
    const apiKey = req.query.apikey;

    if (!maxLine || isNaN(maxLine)) {
        return res.status(400).json({ error: 'O parâmetro "maxline" deve ser um número válido.' });
    }

    const instances = [];

    // Faz um loop para criar as requisições e obter as instâncias.
    for (let i = 1; i <= maxLine; i++) {
        const instanceName = `Line${i}`;
        const url = `${evo}/instance/connectionState/${instanceName}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    apikey: apiKey,
                },
            });

            const instanceData = response.data;
            if (instanceData.instance && instanceData.instance.state === 'open') {
                instances.push({ line: i })
            }
        } catch (error) {
            console.error(`Erro ao obter instância ${instanceName}:`, error);
        }
    }

    res.json(instances);
});


app.listen(port, () => {
    console.log(`API está rodando em http://localhost:${port}`);
});