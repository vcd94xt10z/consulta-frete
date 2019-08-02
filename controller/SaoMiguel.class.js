const xml2js = require("xml2js");
const utils  = require("./Utils.class.js");
const https  = require("https");
const moment = require("moment");
const fs     = require("fs");

var xmlParser = new xml2js.Parser();

/**
 * @author Henrique S. Ribeiro <henriqueribeiro42@gmail.com>
 * @since 01/08/2019
 * @version v1
 */
var SaoMiguel = function(){};

SaoMiguel.carrierid = "saomiguel";
/**
 * Operação dos correios que calcula o frete e o prazo
 */
SaoMiguel.calc = (payload) => {
    let answerList = [];
    let carrierid = SaoMiguel.carrierid;

    return new Promise((resolve,reject) => {
        let start = new Date();
        let end = null;
        let diff = 0;

        let input = payload.input;
        let config = Object.get2(input.config,carrierid);

        if (Object.get("debug")==1) {
            console.log(`${carrierid}: inicio`);
        }

        let params = {
            "tipoPagoPagar": "P",
            "codigoCidadeDestino": input.ibge,
            "quantidadeMercadoria": 1,
            "pesoMercadoria": input.weight,
            "valorMercadoria": input.total,
            "tipoPeso": "P",
            "clienteDestino": input.docnr,
            "dataEmbarque": "",
            "tipoPessoaDestino": input.persontype
        };

        let post = JSON.stringify(params);
        let options = {
            "host": "wsintegcli01.expressosaomiguel.com.br",
            "path": "/wsservernet/rest/frete/buscar/cliente",
            "port": 40504,
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "ACCESS_KEY": config.ACCESS_KEY,
                "CUSTOMER": config.CUSTOMER
            },
        };
        
        // fazendo requisição
        let req = https.request(options, (resp) => {
            let data = '';
            
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            resp.on('end', () => {
                let result = JSON.parse(data);
                // let result = data;
                end = new Date();
                diff = end - start;
                
                if (Object.get("debug") == 1) {
                    console.log(`${carrierid}: fim`);
                }

                if (result.status == "error") {
                    resolve({
                        "carrierid": carrierid,
                        "status": "E",
                        "duration": diff,
                        "message": result.mensagem,
                        "result": answerList
                    });
                    return;
                }

                let momentFreight = moment(result.previsaoEntrega,"DD/MM/YYYY HH:mm");
                let momentShipping = moment(new Date());
                let days = momentFreight.diff(momentShipping,"days");
                
                let answer = utils.getDefaultAnswer();
                answer.carrierid = carrierid;
                answer.product.id = "default";
                answer.product.name = "default";
                answer.price = result.valorFrete;
                answer.deliveryDays = days;
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

module.exports = SaoMiguel;