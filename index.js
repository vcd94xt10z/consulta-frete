/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 10/12/2018 v0.1
 */
const fs 		 = require('fs');
const http       = require('http');
const https      = require('https');
const express    = require('express');
const bodyParser = require('body-parser');

const freight    = require('./controller/Freight.class.js');
const alfa		 = require("./controller/Alfa.class.js");
const atlas		 = require("./controller/Atlas.class.js");
const braspress	 = require("./controller/Braspress.class.js");
const correios   = require('./controller/Correios.class.js');
const jadlog	 = require("./controller/Jadlog.class.js");
const jamef	 	 = require("./controller/Jamef.class.js");
const plimor	 = require("./controller/Plimor.class.js");
const rodonaves	 = require("./controller/Rodonaves.class.js");
const saomiguel	 = require("./controller/SaoMiguel.class.js");
const ssw        = require('./controller/SSW.class.js');
const tnt		 = require("./controller/TNT.class.js");
const translovato= require("./controller/TransLovato.class.js");
const utils      = require('./controller/Utils.class.js');

var config       = null;
var userList     = [];
var requestsCounter = 0;

// inicialização
console.log("+---------------------------------------------------------------+");
console.log("| Consulta Frete (https://github.com/vcd94xt10z/consulta-frete) |");
console.log("+---------------------------------------------------------------+");

// arquivo de configuração
try {
	console.log("Carregando configuração geral");
	config = JSON.parse(fs.readFileSync('./config.json','utf8'));
}catch(e){
	console.log("Erro em carregar configuração, crie o arquivo config.json e tente novamente");
	process.exit(0);
	return;
}

// arquivo de usuários
try {
	console.log("Carregando configuração de usuários");
	userList = JSON.parse(fs.readFileSync('./user.json','utf8'));
}catch(e){
	console.log("Nenhum arquivo user.json encontrado");
}

// certificados SSL
var options  = null;

try {
  options = {
    ca: [fs.readFileSync('./cert/ca.crt'), fs.readFileSync('./cert/ca.pem')],
    cert: fs.readFileSync('./cert/site.crt'),
    key: fs.readFileSync('./cert/site.key')
  };
}catch(e){
}

const app = express();

app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", config.accessControlAllowOrigin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  
  next();
});

Math.zrand = function(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min));
}

Object.data = [];
Object.set = function(key,value){
	Object.data[key] = value;
}

Object.get = function(key){
	return Object.data[key];
}

Object.get2 = function(key1,key2){
	try {
		let value1 = Object.data[key1];	
		let value2 = null;
		eval('value2 = value1.'+key2+';');
		return value2;
	}catch(e){
		return null;
	}
}

Object.set("debug",0);
Object.set("config",config);
Object.set("userList",userList);

freight.loadConfig();

/**
 * Calcula o frete de várias transportadoras ao mesmo tempo
 * @param req
 * @param res
 * @returns
 */
app.post('/frete/', function(req, res){
	requestsCounter++;
	
	let payload = {
		req: req,
		res: res,
		input: null,
		resultList: null
	};
	
	if(Object.get("debug") == 1){
		console.log("-----------------------------------");
		console.log(`[${requestsCounter}] Inicio de chamada`);
	}
	
	// validações
	try {
		utils.validateInput(req);
	}catch(message){
		res.status(400).send(message);
		return;
	}
	
	payload.input = utils.parseInput(req);
	let carrierList = payload.input.carrierList;
	
	try {
		if(!Array.isArray(carrierList)){
			throw "Parâmetro obrigatório carrierList com a lista de transportadoras";
		}
		
		let promises = [];
		
		for(var i in carrierList){
			let carrierid     = carrierList[i];
			let carrierConfig = Object.get2(payload.input.config,carrierid);
			
			if(carrierConfig == null){
				continue;
			}
			
			var promise = null;
			if(carrierConfig != null && carrierConfig.provider == "ssw"){
				eval(`promise = ssw.calc("${carrierid}",payload);`);
			}else{
				eval(`promise = ${carrierid}.calc(payload);`);
			}
			
			promises.push(promise);
		}
		
		if(promises.length <= 0){
			res.status(400).send("Nenhuma transportadora válida encontrada pra calcular o frete");
			return;
		}
		
		Promise.all(promises).then(function(resultArray){
			if(Object.get("debug") == 1){
				console.log("Promise: done");
			}
			
			payload.resultArray = resultArray;
			payload.res.send(payload.resultArray);
		});
	}catch(e){
		console.log(`Erro em consultar transportadoras: ${e}`);
		payload.res.status(500).send("Erro em consultar transportadoras");
	}
});

/**
 * Calcula o frete de uma transportadora
 * @param req
 * @param res
 * @returns
 */
app.post('/frete/:carrierid', function(req, res){
	requestsCounter++;
	
	let payload = {
		req: req,
		res: res,
		input: null,
		result: null
	};
	let carrierid = req.params.carrierid;
	
	if(Object.get("debug") == 1){
		console.log("-----------------------------------");
		console.log(`[${requestsCounter}] Inicio de chamada para ${carrierid}`);
	}
	
	// validações
	try {
		utils.validateInput(req);
	}catch(message){
		res.status(400).send(message);
		return;
	}
	
	payload.input = utils.parseInput(req);
	
	let carrierConfig = Object.get2(payload.input.config,carrierid);
	try {
		var promise = null;
		if(carrierConfig != null && carrierConfig.provider == "ssw"){
			eval(`promise = ssw.calc("${carrierid}",payload);`);
		}else{
			eval(`promise = ${carrierid}.calc(payload);`);
		}
		
		promise.then(function(result){
			if(Object.get("debug") == 1){
				console.log("Promise: done");
			}
			
			payload.result = result;
			payload.res.send(payload.result);
		});
	}catch(e){
		console.log(`Erro em chamar ${carrierid}.calc(): ${e}`);
		payload.res.status(500).send("Erro na consulta");
	}
});

// manipulador de erros
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Serviço indisponível');
});

// disponibilizando tanto via http como https
var httpServer = http.createServer(app);
httpServer.listen(config.httpPort,function(){
	console.log(`Rodando na porta ${config.httpPort} (http)`);
});

if(options != null){
	var httpsServer = https.createServer(options, app);
	httpsServer.listen(config.httpsPort,function(){
		console.log(`Rodando na porta ${config.httpsPort} (https)`);
	});
}

console.log("");
console.log('Transportadoras disponíveis:');
console.log(config.carrierList);
console.log("");

console.log('URIs disponíveis');
console.log('POST /frete/');
console.log('POST /frete/<transportadora>/');
console.log("");