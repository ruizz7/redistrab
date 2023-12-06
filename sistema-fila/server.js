const redis = require('redis');

var express = require('express');
var app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

var senha_atual;

const cli = redis.createClient({
    password: 'NwNij1WJyRubNvGOzBS3ZZuohf4zSXHN',
    socket: {
        host: 'redis-10771.c321.us-east-1-2.ec2.cloud.redislabs.com',
        port: 10771
    }
});

app.get("/", async (req, res) => {
    let fila_senhas = await cli.lRange('fila_senhas', 0, -1);
    res.render('index', { senha_atual: senha_atual, fila_senhas: fila_senhas });
})

app.get("/proximo", async (req, res) => {
    senha_atual = await cli.lPop('fila_senhas');
    res.render('proximaSenha', { senha_atual : senha_atual });
})

app.get("/retirar", async (req, res) => {
    let ultima_senha = await cli.lIndex('lista_senhas', -1);
    let senha_atual = parseInt(ultima_senha) + 1;
    await cli.rPush('fila_senhas', senha_atual.toString());
    await cli.rPush('lista_senhas', senha_atual.toString());
    res.render('retirarSenha', { senha_atual : senha_atual});
});

async function start() {
    await cli.connect()
    console.log('Conectado ao redis');
    app.listen(8000, async () => {
        console.log('Servidor iniciado porta 8000')
        await cli.del('fila_senhas')
        await cli.del('lista_senhas')
        await cli.rPush('lista_senhas', ['0'])
        senha_atual = await cli.lIndex('lista_senhas', 0)
    });
}
cli.on('connect', function (err) {
    if (err) {
      console.log('Could not establish a connection with Redis. ' + err);
    } else {
      console.log('Connected to Redis successfully!');
    }
  });

start();