const http   = require('http');
const https  = require('https');
const utils  = require('./Utils.class.js');

var Jamef = function(){};

Jamef.carrierid = "jamef";

/**
 * Operação da jamef que calcula o frete e o prazo
 */
Jamef.calc = (payload) => {
	let answerList = [];
    let carrierid = Jamef.carrierid;
	
    return new Promise(function(resolve, reject) {
    	let start = new Date();
        let end = null;
        let diff = 0;
    	
        let now = new Date();
        let input = payload.input;
        let config = Object.get2(input.config, carrierid);
    	
        if(Object.get("debug") == 1) {
        	console.log(`${carrierid}: inicio`);
        }
    	
    	// montando url
        let params = {
            "tiptra": config.tiptra,
            "stcd1": config.stcd1,
            "city1": config.city1,
            "regio": config.regio,
            "segprod": config.segprod,
            "weight": input.weight,
            "price": input.total,
            "metro3": "0.1",
            "cepdes": input.zipcode,
            "filcot": config.filcot,
            "dia": now.getDate(),
            "mes": (now.getMonth() + 1),
            "ano": now.getFullYear(),
            "usuario": config.usuario,
        };
    	
        let url = "https://www.jamef.com.br/frete/rest/v1";
        
        let args = "";
		for(let k in params) {
			args += "/"+params[k];
		}
		url += args;
        
		// fazendo requisição
        https.get(url, (resp) => {
            let data = "";
            
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            resp.on('end', () => {
            	if(resp.statusCode != 200 && resp.statusCode != 201) {
                    resolve({
                        "carrierid": carrierid,
                        "status": "E",
                        "duration": diff,
                        "message": "Requisição improcessável",
                        "result": answerList
                    });
                    return;
                }
            	
            	let result = JSON.parse(data);
            	end = new Date();
                diff = end - start;
            	
                if(Object.get("debug") == 1) {
                	console.log(`${carrierid}: fim`);
                }
                
                let price = parseFloat(result.valor);
                let dataString2 = result.previsao_entrega.split("/");
        		var date1 = new Date();
        		date1.setHours(0);
        		date1.setMinutes(0);
        		date1.setSeconds(0);
        		date1.setMilliseconds(0);
        		var date2 = new Date(dataString2[1] + "/" + dataString2[0] + "/" + dataString2[2]);
        		var days = parseInt((date2 - date1) / (1000 * 60 * 60 * 24));
                
                let answer = utils.getDefaultAnswer();
                answer.carrierid = carrierid;
                answer.product.id = "default";
                answer.product.name = "default";
                answer.price = price;
                answer.deliveryDays = days;
                answer.status = "S";
                answerList.push(answer);
                
                resolve({
                    "carrierid": carrierid,
                    "status": "S",
                    "duration": diff,
                    "message": "",
                    "result": answerList
                });
            });
        }).on("error", (err) => {
            if(Object.get("debug") == 1) {
            	console.log(`${carrierid}: error`);
            }
            
            resolve({
                "carrierid": carrierid,
                "status": "E",
                "duration": diff,
                "message": err.message,
                "result": answerList
            });
        }).setTimeout(10000, function() {
            end = new Date();
            diff = end - start;
            
            this.abort();
            
            resolve({
                "carrierid": carrierid,
                "status": "E",
                "duration": diff,
                "message": "timeout",
                "result": answerList
            });
        });
    });
}

module.exports = Jamef;