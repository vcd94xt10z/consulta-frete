const xml2js = require("xml2js");
const utils  = require("./Utils.class.js");
const https  = require("https");
const moment = require("moment");
const fs     = require("fs");

var xmlParser = new xml2js.Parser();

/**
 * @author Henrique S. Ribeiro <henriqueribeiro42@gmail.com>
 * @since 30/07/2019
 * @version v1
 */
var Rodonaves = function(){};

Rodonaves.token = "";
Rodonaves.carrierid = "rodonaves";

Rodonaves.getToken = (config) => {
    return new Promise((resolve, reject) => {
        let params = {
            
        };
        let post = JSON.stringify(params);
    });
}

/**
 * Operação dos correios que calcula o frete e o prazo
 */
Rodonaves.calc = (payload) => {
    let answerList = [];
    let carrierid = Rodonaves.carrierid;

    return new Promise((resolve,reject) => {
        let start = new Date();
        let end = null;
        let diff = 0;

        let input = payload.input;
        let config = Object.get(carrierid);

        if (Object.get("debug")==1) {
            console.log(`${carrierid}: inicio`);
        }

        let params = {
            "OriginZipCode": config.OriginZipCode,
            "OriginCityId": config.OriginCityId,
            "DestinationZipcode": input.zipcode,
            "DestinationCityId": input.cityid,
            "TotalWeight": input.weight,
            "ElectronicInvoiceValue": input.total,
            "CustomerTaxIdRegistration": config.CustomerTaxIdRegistration,
            "ReceiverCpfcnp": input.docnr,
            "Packs": [{
                "AmountPackages": 1,
                "Weight": input.weight,
                "Length": input.length,
                "Height": input.height,
                "Width": input.width
            }]
        };

        let getToken = Rodonaves.getToken(config);
        let getCustomer = Rodonaves.getCustomer();
        let getFreight = Rodonaves.getFreight();

        let post = JSON.stringify(params);
        let options = {
            "host": "ws1.plimor.com.br",
            "path": "/Hayamax/v1/cotacao_hayamax",
            "port": 80,
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Content-Length": post.length
            },
        };
        
        // fazendo requisição
        let req = https.request(options, (resp) => {
            let data = '';
            
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            resp.on('end', () => {
                if (resp.statusCode == 422) {
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
                // let result = data;
                end = new Date();
                diff = end - start;
                
                if (Object.get("debug") == 1) {
                    console.log(`${carrierid}: fim`);
                }

                if (typeof(result.erro) != "undefined" && result.erro.length > 0) {
                    resolve({
                        "carrierid": carrierid,
                        "status": "E",
                        "duration": diff,
                        "message": result.erro,
                        "result": answerList
                    });
                    return;
                }
                
                if (result.atende == true) {
                    let answer = utils.getDefaultAnswer();
                    answer.carrierid = carrierid;
                    answer.product.id = "default";
                    answer.product.name = "default";
                    answer.price = result.preco;
                    answer.deliveryDays = result.prazo_entrega;
                    answer.status = "S";
                    answerList.push(answer);
                    
                    resolve({
                        "carrierid": carrierid,
                        "status"   : "S",
                        "duration" : diff,
                        "message"  : "",
                        "result"   : answerList
                    });
                    return;
                } else {
                    resolve({
                        "carrierid": carrierid,
                        "status": "E",
                        "duration": diff,
                        "message": "Cliente ou endereço não é atendido pela transportadora",
                        "result": answerList
                    });
                    return;
                }
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

        req.write(post);
        req.end();
    });
}

module.exports = Rodonaves;