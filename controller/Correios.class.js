const http   = require('http');
const https  = require('https');
const xml2js = require('xml2js');
const utils  = require('./Utils.class.js');

var xmlParser = new xml2js.Parser();

/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 10/07/2019 v0.1
 */
var Correios = function(){};

Correios.modalidades = {
    40010: 'Sedex',
    40045: 'Sedex a cobrar',
    40215: 'Sedex 10',
    40290: 'Sedex hoje',
    41106: 'PAC'
};

/**
 * Calcula o frete
 */
Correios.calc = function(payload){
	return Correios.calcPrecoPrazo(payload);
};

/**
 * Operação dos correios que calcula o frete e o prazo
 */
Correios.calcPrecoPrazo = function(payload){
	let answerList = [];
	
	return new Promise(function(resolve,reject){
		let start = new Date();
		let end   = null;
		let diff  = 0;
		
		let input = payload.input;
		let produtosIds = [];
		let config = Object.get2(input.config,"correios");
		
		if(Array.isArray(config.modalidades) === false || 
		   config.modalidades.length <= 0){
			resolve({
		    	"carrierid": "correios",
		    	"status"   : "E",
				"duration" : 0,
				"message"  : "Nenhuma modalidade definida no arquivo de configuração!",
		    	"result"   : []
			});
			return;
		}
		
		for(let i in config.modalidades){
			produtosIds.push(config.modalidades[i]);
		}
		
		if(Object.get("debug") == 1){
			console.log("correios: inicio");
		}
		
		// montando url
		let params = {
			nCdEmpresa: config.nCdEmpresa,
			sDsSenha: config.sDsSenha,
			nCdServico: produtosIds.join(","),
			sCepOrigem: config.sCepOrigem,
			sCepDestino: input.zipcode,
			nVlPeso: input.weight,
			nCdFormato: 1, // 1 - Formato caixa/pacote 2 - Formato rolo/prisma
			nVlComprimento: input.length,
			nVlAltura: input.height,
			nVlLargura: input.width,
			nVlDiametro: input.diameter,
			sCdMaoPropria: config.sCdMaoPropria,
			nVlValorDeclarado: input.total,
			sCdAvisoRecebimento: config.sCdAvisoRecebimento
		};
		
		let url = "http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx/CalcPrecoPrazo";
		
		let args = [];
		for(let i in params){
			args.push(i+"="+params[i]);
		}
		args = args.join("&");
		url += "?"+args;
		
		// fazendo requisição
		http.get(url, (resp) => {
			let data = '';
			
			resp.on('data', (chunk) => {
				data += chunk;
			});
	      
			resp.on('end', () => {
				end = new Date();
				diff = end - start;
				
				if(Object.get("debug") == 1){
					console.log("correios: fim");
				}
				
				xmlParser.parseString(data, function (err, result) {
					if(err){
						resolve({
							"carrierid": "correios",
							"status": "E",
							"duration" : diff,
							"message"  : err,
							"result": answerList
						});
						return;
					}
					
					//console.log(JSON.stringify(result, null, 2));
					let servicos0 = result.cResultado.Servicos[0];
					let mainStatus = 'E';
					let mainMessage = "";
					
					try {
						// a chamada deu sucesso mas não retornou nenhuma informação
						if(servicos0 === ""){
							mainStatus  = "S"; 
							mainMessage = "Nenhuma informação retornada";
						}else{
							let servicos = servicos0.cServico;
							
							for(let i = 0; i < servicos.length; i++){
								var servico = servicos[i];
								var answer = utils.getDefaultAnswer();
								answer.carrierid = "correios";
								answer.product.id = servico.Codigo[0];
								answer.product.name = Correios.modalidades[answer.product.id];
								
								//console.log(JSON.stringify(servico, null, 2));
								var erro = servico.Erro[0];
								var msgErro = servico.MsgErro[0];
								
								if(erro != "" && erro != "0"){
									answer.errorCode = erro;
									answer.message = msgErro;
									answerList.push(answer);
									continue;
								}
								
								answer.price = utils.parseCurrency(servico.Valor[0]);
								answer.deliveryDays = parseInt(servico.PrazoEntrega[0]);
								answer.status = 'S';
								answerList.push(answer);
								mainStatus = 'S';
							}
						}
					}catch(e){
						mainStatus  = "E"; 
						mainMessage = 'Erro em processar informação';
					}
					
					resolve({
						"carrierid": "correios",
						"status"   : mainStatus,
						"duration" : diff,
						"message"  : mainMessage,
						"result"   : answerList
					});
				});
			});
			
		}).on("error", (err) => {
			if(Object.get("debug") == 1){
				console.log("correios: error");
			}
			
			resolve({
		    	"carrierid": "correios",
		    	"status"   : "E",
				"duration" : diff,
				"message"  : err.message,
		    	"result"   : answerList
			});
		}).setTimeout(10000, function(){
			end = new Date();
			diff = end - start;
			
	        this.abort();
	        
	        resolve({
		    	"carrierid": "correios",
		    	"status"   : "E",
				"duration" : diff,
				"message"  : "timeout",
		    	"result"   : answerList
			});
	        
	    });
	});
}

module.exports = Correios;