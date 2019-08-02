const xml2js = require("xml2js");
const utils  = require("./Utils.class.js");
const https   = require("https");
const moment = require("moment");

var xmlParser = new xml2js.Parser();

/**
 * @author Henrique S. Ribeiro <henriqueribeiro42@gmail.com>
 * @since 30/07/2019
 * @version v1
 */
var Braspress = function(){};

Braspress.carrierid = "braspress";

Braspress.validate = (input) => {
    if (input.docnr.length == 0) {
        return "Cliente sem número de documento não é aceito";
    }
    return null;
}

/**
 * Operação dos correios que calcula o frete e o prazo
 */
Braspress.calc = (payload) => {
    let answerList = [];
    let carrierid = Braspress.carrierid;

    return new Promise((resolve,reject) => {
        let start = new Date();
        let end = null;
        let diff = 0;

        let input = payload.input;
        if (err = Braspress.validate(input)) {
            end = new Date();
            diff = end - start;
            
            if (Object.get("debug") == 1) {
                console.log(`${carrierid}: fim`);
            }

            resolve({
                "carrierid": carrierid,
                "status": "E",
                "duration": diff,
                "message": err,
                "result": answerList
            });
            return;
        }
        
        let config = Object.get2(input.config,carrierid);

        if (Object.get("debug")==1) {
            console.log(`${carrierid}: inicio`);
        }

        let params = {
            "CNPJ": config.CNPJ,
            "EMPORIGEM": 2,
            "CEPORIGEM": config.CEPORIGEM,
            "CEPDESTINO": input.zipcode,
            "CNPJREM": config.CNPJREM,
            "CNPJDES": input.docnr,
            "TIPOFRETE": 1,
            "PESO": input.weight,
            "VALORNF": input.total,
            "VOLUME": 1,
            "MODAL": "R"
        };

        let url = "https://www.braspress.com.br:443/cotacaoXml?param=";        
        let args = [];
        for (let i in params) {
            args.push(params[i]);
        }
        args = args.join(",");
        url += args;
        
        // fazendo requisição
        https.get(url, (resp) => {
            let data = '';
            
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            resp.on('end', () => {
                end = new Date();
                diff = end - start;
                
                if (Object.get("debug") == 1) {
                    console.log(`${carrierid}: fim`);
                }
                
                xmlParser.parseString(data, (err, result) => {
                    // console.log(JSON.stringify(result, null, 2));
                    if (err) {
                        resolve({
                            "carrierid": carrierid,
                            "status": "E",
                            "duration": diff,
                            "message": err,
                            "result": answerList
                        });
                        return;
                    }
                    
                    if (typeof(result.calculofrete) != "undefined" && typeof(result.calculofrete.erro) != "undefined" && result.calculofrete.erro[0].length > 0) {
                        resolve({
                            "carrierid": carrierid,
                            "status": "E",
                            "duration": diff,
                            "message": result.calculofrete.erro[0],
                            "result": answerList
                        });
                        return;
                    }

                    let cot = result.CALCULOFRETE;
                    
                    let answer = utils.getDefaultAnswer();
                    answer.carrierid = carrierid;
                    answer.product.id = "default";
                    answer.product.name = "default";
                    answer.price = cot.TOTALFRETE[0];
                    answer.deliveryDays = cot.PRAZO[0];
                    answer.status = "S";
                    answerList.push(answer);
                    
                    resolve({
                        "carrierid": carrierid,
                        "status"   : "S",
                        "duration" : diff,
                        "message"  : "",
                        "result"   : answerList
                    });
                });
            });
        }).on("error", (err) => {
            if (Object.get("debug") == 1) {
                console.log(`${carrierid}: error`);
            }
            
            resolve({
                "carrierid": carrierid,
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
                "carrierid": "alfa",
                "status"   : "E",
                "duration" : diff,
                "message"  : "timeout",
                "result"   : answerList
            });
            
        });
    });
}

module.exports = Braspress;