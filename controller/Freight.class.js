const fs    = require('fs');
const http  = require('http');
const https = require('https');

/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 11/12/2018 v0.1
 */
var Freight = function(){};
Freight.timeout = 2000;

/**
 * Carrega as configurações das transportadoras
 */
Freight.loadConfig = function(){
	let config = Object.get("config");
	let folder = './config/';
	
	console.log("Carregando configurações das transportadoras");
	
	let folderList = fs.readdirSync(folder);
	for(let i in folderList){
		let subfolder = folderList[i];
		let sublist   = [];
		
		for(let j in config.carrierList){
			var carrier = config.carrierList[j];
			var file = folder+subfolder+"/"+carrier+".json";
			var jsonData = null;
			
			try {
				jsonData = JSON.parse(fs.readFileSync(file, 'utf-8'));
				console.log(subfolder+" "+carrier+": OK");
			}catch(e){
				console.log(subfolder+" "+carrier+": Erro ("+e+")");
			}
			sublist[carrier] = jsonData;
		}
		Object.set(subfolder,sublist);
	}
};

/**
 * Retorna informações das transportadoras
 */
Freight.getInfo = function(payload,callback){
	let config = Object.get("config");
	
	let obj = {
		'carrierList': [],
		'input': payload.input,
		'result': []
	};
	
	// se nenhum endpoint foi definido, usa a configuração padrão
	if(config.infoEndpoint == undefined || config.infoEndpoint == ""){
		obj.carrierList = config.carrierList;
		payload.info = obj;
		callback();
		return;
	}
	
	// chamando o endpoint do usuário
	let ref = http;
	if(config.infoEndpoint.indexOf("https://") == 0){
		ref = https;	
	}
	
	ref.get(config.infoEndpoint, (resp) => {
		let data = '';
		
		resp.on('data', (chunk) => {
			data += chunk;
		});
      
		resp.on('end', () => {
			payload.info = JSON.parse(data);
			callback();
		}
	}).on("error", (err) => {
		payload.info = obj;
		callback();
	}).setTimeout(3000, function(){
		this.abort();
        payload.info = obj;
		callback();
    });
}

module.exports = Freight;