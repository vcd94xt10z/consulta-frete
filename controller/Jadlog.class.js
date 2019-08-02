const xml2js = require("xml2js");
const soap   = require("soap");
const utils  = require("./Utils.class.js");

var xmlParser = new xml2js.Parser();

var Jadlog = function(){};

Jadlog.carrierid = "jadlog";

Jadlog.buildTypeList = () => {
	let pack = new Object();
	pack.title = "jadlog.package";
	pack.name = "Jadlog Encomenda Convencional";
	
	let economic = new Object();
	economic.title = "jadlog.economic";
	economic.name = "Jadlog Encomenda Economica";
	
	let ecommerce = new Object();
	ecommerce.title = "jadlog.com";
	ecommerce.name = "Jadlog Encomenda E-commerce";
	
	let typeList = {
		"3": pack,
		"5": economic,
		"9": ecommerce
	};
	
	return typeList;
}

/**
 * Operação da jadlog que calcula o frete
 */
Jadlog.calc = (payload) => {
    let answerList = [];
    let carrierid = Jadlog.carrierid;
    
    return new Promise((resolve, reject) => {
        let start = new Date();
        let end = null;
        let diff = 0;
        
        let input = payload.input;
        let config = Object.get2(input.config, carrierid);
        
        if(Object.get("debug") == 1) {
            console.log(`${carrierid}: inicio`);
        }
        
        let params = {
            "vCnpj": config.vCnpj,
            "Password": config.Password,
            "vSeguro": config.vSeguro,
            "vModalidade": config.vModalidade,
            "vCepOrig": config.vCepOrig,
            "vCepDest": input.zipcode,
            "vPeso": input.weight,
            "vVlColeta": config.vVlColeta,
            "vProfudidade": input.length,
            "vAltura": input.height,
            "vLargura": input.width,
            "vFrap": config.vFrap,
            "vEntrega": config.vEntrega,
            "vVlDec": input.total
        };
        
        let url = "http://jadlog.com.br:8080/JadlogWebService/services/ValorFreteBean?wsdl";
        
        // fazendo requisição
        soap.createClient(url, {"wsdl_options": {"timeout": 10000}}, (cliErr, client) => {
            if(typeof(client) == "undefined") {
                end = new Date();
                diff = end - start;
                
                if(Object.get("debug") == 1) {
                    console.log(`${carrierid}: fim`);
                }
                
                resolve({
                    "carrierid": carrierid,
                    "status": "E",
                    "duration": diff,
                    "message": "Serviço indisponível",
                    "result": answerList
                });
                return;
            }
            
            client.valorar(params, (reqErr, data) => {
                end = new Date();
                diff = end - start;
                
                if(Object.get("debug") == 1) {
                    console.log(`${carrierid}: fim`);
                }
                
                if(reqErr) {
                	resolve({
                        "carrierid": carrierid,
                        "status": "E",
                        "duration": diff,
                        "message": "Requisição improcessável",
                        "result": answerList
                    });
                    return;
                }
                
                xmlParser.parseString(data.valorarReturn, (err, result) => {
                	if(parseFloat(result.string.Jadlog_Valor_Frete[0].Retorno[0]) < 0) {
                		resolve({
                            "carrierid": carrierid,
                            "status": "E",
                            "duration": diff,
                            "message": result.string.Jadlog_Valor_Frete[0].Mensagem[0],
                            "result": answerList
                        });
                        return;
        			}
                	
                	let typeList = Jadlog.buildTypeList();
                	let answer = utils.getDefaultAnswer();
                    answer.carrierid = carrierid;
                    answer.product.id = typeList[config.vModalidade].title;
                    answer.product.name = typeList[config.vModalidade].name;
                    answer.price = utils.parseCurrency(result.string.Jadlog_Valor_Frete[0].Retorno[0]);
                    answer.deliveryDays = 0;
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
            });
        });
    });
}

module.exports = Jadlog;