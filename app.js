const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const multer = require('multer');
const xlsx = require('xlsx');
const { url } = require('inspector');
const { createConnection } = require('net');


const app = express();
const port = 2727;

// Middleware para analisar o corpo da solicitação como JSON
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/TriggerForList', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'TriggerForList.html'));
});

app.get('/editTexts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'texts.html'));
});

app.get('/configEvents', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'configEvents.html'));
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


// Rota para editar um texto
app.put('/edit-text/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const newText = req.body.text;
    const texts = JSON.parse(fs.readFileSync('./src/database/texts.json'));

    const updatedTexts = texts.map(text => {
        if (text.id === id) {
            text.text = newText;
        }
        return text;
    });

    fs.writeFileSync('./src/database/texts.json', JSON.stringify(updatedTexts));
    res.send('Texto editado com sucesso');
});

// Rota para deletar um texto
app.delete('/delete-text/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const texts = JSON.parse(fs.readFileSync('./src/database/texts.json'));

    const filteredTexts = texts.filter(text => text.id !== id);

    fs.writeFileSync('./src/database/texts.json', JSON.stringify(filteredTexts));
    res.send('Texto deletado com sucesso');
});


// Rota para adicionar um novo texto
app.post('/add-text', (req, res) => {
    const newText = req.body.text;
    const texts = JSON.parse(fs.readFileSync('./src/database/texts.json'));

    // Gerar um novo ID (último ID + 1)
    const lastId = texts.length > 0 ? texts[texts.length - 1].id : 0;
    const newId = lastId + 1;

    // Adicionar o novo texto ao array de textos
    texts.push({ id: newId, text: newText });

    fs.writeFileSync('./src/database/texts.json', JSON.stringify(texts));
    res.send('Texto adicionado com sucesso');
});


// Rota para editar um texto
app.put('/edit-event/:params', (req, res) => {
    const params = req.params.params; // O nome do parâmetro deve ser igual ao especificado na rota

    const name = req.body.name;
    const messageid = req.body.messageid;
    const newparams = req.body.newparams


    // Ler as mensagens do arquivo texts.json
    const texts = JSON.parse(fs.readFileSync('./src/database/texts.json'));

    const messageExists = texts.some(message => message.id == messageid);

    if (messageExists) {
        // Crie um novo evento

        const events = JSON.parse(fs.readFileSync('./src/database/TriggerForEvents/events.json'));

        const updatedTexts = events.map(event => {
            if (event.params === params) {
                event.name = name;
                event.text = messageid;
                event.params = newparams
            }
            return event;
        });

        fs.writeFileSync('./src/database/TriggerForEvents/events.json', JSON.stringify(updatedTexts));
        res.send('Texto editado com sucesso');

    } else {
        res.send('O ID de mensagem não existe.');
    }

});

// Rota para deletar um texto
app.delete('/delete-event/:params', (req, res) => {
    const params = req.params.params;
    const events = JSON.parse(fs.readFileSync('./src/database/TriggerForEvents/events.json'));

    const filteredTexts = events.filter(event => event.params !== params);

    fs.writeFileSync('./src/database/TriggerForEvents/events.json', JSON.stringify(filteredTexts));
    res.send('Evento  deletado com sucesso');
});

app.post('/add-event', (req, res) => {
    const newEventName = req.body.name;
    const newEventMensagemId = req.body.mensagemid;
    const newEventParams = req.body.params;

    // Ler a lista atual de eventos do arquivo
    const events = JSON.parse(fs.readFileSync('./src/database/TriggerForEvents/events.json'));

    // Ler as mensagens do arquivo texts.json
    const texts = JSON.parse(fs.readFileSync('./src/database/texts.json'));

    // Verificar se já existe um evento com o mesmo valor em params
    const existingEvent = events.find(event => event.params === newEventParams);

    if (existingEvent) {
        res.send('Um evento com o mesmo parâmetro já existe.');
    } else {
        // Verificar se o newEventMensagemId existe nas mensagens
        const messageExists = texts.some(message => message.id == newEventMensagemId);

        if (messageExists) {
            // Crie um novo evento
            const newEvent = {
                name: newEventName,
                text: newEventMensagemId,
                params: newEventParams,
            };

            events.push(newEvent);

            // Escreva a lista atualizada de eventos de volta no arquivo
            fs.writeFileSync('./src/database/TriggerForEvents/events.json', JSON.stringify(events));

            res.send('Evento adicionado com sucesso');
        } else {
            res.send('O ID de mensagem não existe.');
        }
    }
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
    axios.get(TriggerForListUrl, { params })
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
    axios.get(TriggerForListUrl, { params })
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
    axios.get(TriggerForListUrl, { params })
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


app.get('/enableTriggerForEvents', (req, res) => {
    // Passo 1: Ler o arquivo "events.json"
    const eventsFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'events.json');
    const eventsData = JSON.parse(fs.readFileSync(eventsFilePath, 'utf8'));

    // Passo 2: Extrair os valores de "text" de "events.json"
    const textValues = eventsData.map(event => event.text);

    // Passo 3: Ler o arquivo "texts.json"
    const textsFilePath = path.join(__dirname, 'src', 'database', 'texts.json');
    const textsData = JSON.parse(fs.readFileSync(textsFilePath, 'utf8'));

    // Passo 4: Verificar se os valores existem em "texts.json"
    const missingTextValues = textValues.filter(textValue => !textsData.find(text => text.id == textValue));

    if (missingTextValues.length > 0) {
        // Passo 5: Retornar um erro se algum valor estiver faltando
        console.error('Configurações incorretas: os seguintes textos estão faltando em texts.json:', missingTextValues);
        res.sendStatus(500);
    } else {
        // Passo 6: Ler o arquivo "status.json" para verificar o valor de "maxLines"
        const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'status.json');
        const statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));

        // Verificar se o valor de "maxLines" é maior que zero
        if (statusData.length > 0 && statusData[0].maxLines > 0) {
            // Se todas as verificações passarem, continue com a requisição para TriggerForEventsUrl.
            const params = { type: 'enable' };

            axios.get(TriggerForEventsUrl, { params })
                .then(response => {
                    res.sendStatus(200);
                })
                .catch(error => {
                    console.error('Erro ao fazer a requisição "start":', error);
                    res.sendStatus(500);
                });
        } else {
            // Retornar um erro se o valor de "maxLines" não for maior que zero
            console.error('Configurações incorretas: o valor de "maxLines" em status.json não é maior que zero.');
            res.sendStatus(500);
        }
    }
});


// Rota para iniciar alguma ação
app.get('/disableTriggerForEvents', (req, res) => {
    // Define o parâmetro "type" como "start"
    const params = { type: 'disable' };

    // Faz uma requisição GET para o serviço externo
    axios.get(TriggerForEventsUrl, { params })
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

app.post('/atualizar-Selected-Tesxts', (req, res) => {
    const { data } = req.body;

    if (data) {
        const numbers = data.split(',').map(Number);

        try {
            const jsonFile = './src/database/TriggerForList/selectedTexts.json';
            const jsonData = numbers.map(id => ({ id })); // Crie um novo array com os novos valores

            fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));

            res.json({ message: 'Seleção de mensgens atualizado com sucesso!' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar a seleção' });
        }
    } else {
        res.status(400).json({ error: 'Dados inválidos' });
    }
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


app.get('/searchTextsTriggerForEvents', (req, res) => {
    const statusFilePath = path.join(__dirname, 'src', 'database', 'texts.json');


    fs.readFile(statusFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
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



app.get('/searchTextsSelected', (req, res) => {
    const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'selectedTexts.json');


    fs.readFile(statusFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
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


app.get('/setLineTriggerForEvents', (req, res) => {
    const newValue = req.query.value;

    // Certifique-se de validar o novo valor aqui, se necessário.

    // Converta a string em um número (inteiro neste caso).
    const numericValue = parseInt(newValue, 10);

    if (!isNaN(numericValue)) {
        // Leia o arquivo JSON existente.
        const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'status.json');
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


app.get('/setProgressTriggerForEvents', (req, res) => {
    const newValue = req.query.value; // Obtém o valor do parâmetro "value" na URL.


    // Leia o arquivo JSON existente.
    const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'status.json');
    const existingData = require(statusFilePath);

    // Atualize o valor de "status" no objeto JSON.
    existingData[0].progress = newValue;

    // Salve o objeto JSON atualizado de volta no arquivo.
    fs.writeFileSync(statusFilePath, JSON.stringify(existingData, null, 2));

    res.json({ success: true, message: 'Status atualizado com sucesso.' });

});



app.get('/setMaxLineTriggerForEvents', (req, res) => {
    const newValue = req.query.value;

    // Certifique-se de validar o novo valor aqui, se necessário.

    // Converta a string em um número (inteiro neste caso).
    const numericValue = parseInt(newValue, 10);

    if (!isNaN(numericValue)) {
        // Leia o arquivo JSON existente.
        const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'status.json');
        const existingData = require(statusFilePath);

        // Atualize o valor de "lastLine" no objeto JSON com o valor numérico.
        existingData[0].maxLines = numericValue;

        // Salve o objeto JSON atualizado de volta no arquivo.
        fs.writeFileSync(statusFilePath, JSON.stringify(existingData, null, 2));

        res.json({ success: true, message: 'Linha atualizado com sucesso.' });
    } else {
        res.json({ success: false, message: 'O valor não é um número válido.' });
    }
});



app.get('/set-MaxLines', (req, res) => {
    const newValue = req.query.value;

    // Certifique-se de validar o novo valor aqui, se necessário.

    // Converta a string em um número (inteiro neste caso).
    const numericValue = parseInt(newValue, 10);

    if (!isNaN(numericValue)) {
        // Leia o arquivo JSON existente.
        const statusFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'status.json');
        const existingData = require(statusFilePath);

        // Atualize o valor de "lastLine" no objeto JSON com o valor numérico.
        existingData[0].maxLines = numericValue;

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

// Rota para adicionar um novo registro
app.post('/set-records', (req, res) => {
    const { Nome, Numero, Status, Hora, Linha, msg } = req.body;

    if (!Nome || !Numero || !Status || !Hora || !Linha || !msg) {
        return res.status(400).json({ error: 'Todos os campos (Nome, Numero, Status, Hora, Linha, msg) são obrigatórios.' });
    }

    const newRecord = {
        Nome,
        Numero,
        Status,
        Hora,
        Linha,
        msg
    };

    const recordsFilePath = path.join(__dirname, 'src', 'database', 'TriggerForEvents', 'records.json');
    let existingRecords;

    try {
        existingRecords = JSON.parse(fs.readFileSync(recordsFilePath));
    } catch (error) {
        existingRecords = [];
    }

    existingRecords.push(newRecord);

    fs.writeFileSync(recordsFilePath, JSON.stringify(existingRecords, null, 2));

    res.send('Registro adicionado com sucesso');
});



// Rota para adicionar um novo registro
app.post('/set-logs', (req, res) => {
    const { Nome, Numero, Status, Hora, Linha, msg } = req.body;

    if (!Nome || !Numero || !Status || !Hora || !Linha || !msg) {
        return res.status(400).json({ error: 'Todos os campos (Nome, Numero, Status, Hora, Linha, msg) são obrigatórios.' });
    }

    const newRecord = {
        Nome,
        Numero,
        Status,
        Hora,
        Linha,
        msg
    };

    const recordsFilePath = path.join(__dirname, 'src', 'database', 'TriggerForList', 'logs.json');
    let existingRecords;

    try {
        existingRecords = JSON.parse(fs.readFileSync(recordsFilePath));
    } catch (error) {
        existingRecords = [];
    }

    existingRecords.push(newRecord);

    fs.writeFileSync(recordsFilePath, JSON.stringify(existingRecords, null, 2));

    res.send('Registro adicionado com sucesso');
});


app.get('/set-typebot', async (req, res) => {
    try {
      const { url, apikey, maxlines, urlbot } = req.query;
  
      if (!url || !apikey || !maxlines || !urlbot) {
        return res.status(400).json({ error: 'Parâmetros ausentes ou inválidos' });
      }
  
      const baseUrl = urlbot.split('/')[2]; // Extrai o domínio/subdomínio da urlbot
      const typebotSlug = urlbot.split('/')[3]; // Extrai o slug do typebot
      const urlEvo = url
  
      for (let i = 1; i <= maxlines; i++) {
        const line = `Line${i}`;
        const url = `${urlEvo}/typebot/set/${line}`;
        const data = {
          enabled: true,
          url: `https://${baseUrl}`,
          typebot: typebotSlug,
          expire: 20,
          keyword_finish: '/SAIR',
          delay_message: 1000,
          unknown_message: '',
        };
        const headers = {
          'Content-Type': 'application/json',
          'apikey': apikey,
        };
  
        // Faz a requisição Axios para cada linha
        await axios.post(url, data, { headers });
  
        console.log(`Requisição feita para ${urlEvo}`);

      }
  
      res.status(200).json({ message: 'Requisições concluídas com sucesso' });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: 'Ocorreu um erro ao processar a solicitação' });
    }
  });
  


app.listen(port, () => {
    console.log(`API está rodando em http://localhost:${port}`);
});