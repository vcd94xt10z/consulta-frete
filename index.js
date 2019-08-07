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
	let value1 = Object.data[key1];	
	let value2 = null;
	eval('value2 = value1.'+key2+';');
	return value2;
}

Object.set("debug",1);
Object.set("config",config);
Object.set("userList",userList);

freight.loadConfig();

/**
 * Calcula o frete de todas as transportadoras disponíveis
 * @param req
 * @param res
 * @returns
 */
app.post('/frete/', function(req, res){
	requestsCounter++;
	
	let payload  = {req:req,res:res,input:null};
	let promises = [];
	
	// validações
	try {
		utils.validateInput(req);
	}catch(message){
		res.status(400).send(message);
		return;
	}
	
	payload.input = utils.parseInput(req);
	
	if(Object.get("debug") == 1){
		console.log("-----------------------------------");
		console.log(`[${requestsCounter}] Inicio de chamadas assíncronas`);
	}
	
	freight.getInfo(payload,function(){
		for(let i in payload.info.carrierList){
			let carrier = payload.info.carrierList[i];
			if(typeof carrier == "string"){
				let carrierConfig = Object.get2(payload.input.config,carrier);
				
				try {
					if(carrierConfig != null && carrierConfig.provider == "ssw"){
						eval(`promises.push(ssw.calc("${carrier}",payload));`);
					}else{
						eval(`promises.push(${carrier}.calc(payload));`);
					}
				}catch(e){
					console.log(`Erro em chamar ${carrier}.calc(): ${e}`);
				}
			}
		}
		
		Promise.all(promises)
		.then(function(resultArray){
			if(Object.get("debug") == 1){
				console.log("Promise.all: done");
			}
			payload.info.result = resultArray;
			payload.res.send(payload.info);
		});
	});
});

/**
 * Retorna informações das transportadoras
 * @param req
 * @param res
 * @returns
 */
app.post('/info/', function(req, res){
	requestsCounter++;
	
	let payload = {req:req,res:res};
	
	// validações
	try {
		utils.validateInput(req);
	}catch(message){
		res.status(400).send(message);
		return;
	}
	
	freight.getInfo(payload,function(){
		res.send(payload.info);
	});
});

/**
 * Calcula o frete de uma transportadora
 * @param req
 * @param res
 * @returns
 */
app.post('/frete/:carrierid', function(req, res){
	requestsCounter++;
	
	let payload = {req:req,res:res};
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
	
	freight.getInfo(payload,function(){
		payload.info.carrierList = [carrierid];
		
		let carrierConfig = Object.get2(payload.input.config,carrierid);
		
		try {
			var promise = null;
			if(carrierConfig != null && carrierConfig.provider == "ssw"){
				eval(`var promise = ssw.calc("${carrierid}",payload);`);
			}else{
				eval(`var promise = ${carrierid}.calc(payload);`);
			}
			
			promise.then(function(result){
				if(Object.get("debug") == 1){
					console.log("Promise: done");
				}
				payload.info.result.push(result);
				payload.res.send(payload.info);
			});
		}catch(e){
			console.log(`Erro em chamar ${carrier}.calc(): ${e}`);
			payload.res.status(500).send("Erro na consulta");
		}
	});
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

console.log('URIs disponíveis:');
console.log('POST /info/');
console.log('POST /frete/');
console.log('POST /frete/<transportadora>/');
console.log("");