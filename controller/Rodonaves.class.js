const xml2js = require("xml2js");
const utils  = require("./Utils.class.js");
const http   = require("http");
const https  = require("https");
const request = require("request");
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
Rodonaves.customer = null;
Rodonaves.carrierid = "rodonaves";

Rodonaves.getToken = (config) => {
    return new Promise((resolve, reject) => {
        let params = {
            "auth_type": config.auth_type,
            "grant_type": "password",
            "username": config.username,
            "password": config.password
        };

        let post = "";
        for (let key in params) {
            let param = params[key];
            post += `${key}=${param}&`;
        }

        let headers = {
            "Content-Type":"application/json",
            "Content-Length":Buffer.byteLength(post)
        };

        let options = {
            "host": "01wapi.rte.com.br",
            "port": "443",
            "path": "/token",
            "method": "POST",
            "headers": headers
        };

        let req = https.request(options,(resp) => {
            let data = "";

            resp.on("data",(chunk) => {
                data += chunk;
            });

            resp.on("end",() => {
                let result = JSON.parse(data);
                if (resp.statusCode != 200 && resp.statusCode != 204) {
                    resolve({
                        "status": "E",
                        "message": result.error
                    });
                } else {
                    resolve({
                        "status": "S",
                        "result": result
                    });
                }
            });
        });
        let wrote = req.write(post);
        req.end();
    });
}

Rodonaves.getCustomer = (input, token) => {
    return new Promise((resolve, reject) => {
        // let url = `https://01wapi.rte.com.br/api/v1/busca-por-cep?zipCode=${input.zipcode}`;
        let headers = {
            "Content-Type": "application/json",
            "Authorization":`Bearer ${token}`
        };

        let options = {
            "host": "01wapi.rte.com.br",
            "port": "443",
            "path": `/api/v1/busca-por-cep?zipCode=${input.zipcode}`,
            "method": "GET",
            "headers": headers
        };

        let req = https.request(options,(resp) => {
            let data = "";

            resp.on("data",(chunk) => {
                data += chunk;
            });

            resp.on("end",() => {
                let result = JSON.parse(data);
                
                if (resp.statusCode != 200 && resp.statusCode != 204) {
                    resolve({
                        "status": "E",
                        "message": result[0].Message
                    });
                } else {
                    resolve({
                        "status": "S",
                        "result": result
                    });
                }
            });
        });
        req.end();
    });
}

Rodonaves.getFreight = (params, token) => {
    return new Promise((resolve, reject) => {
        let post = JSON.stringify(params);

        let headers = {
            "Content-Type":"application/json",
            "Content-Length":post.length,
            "Authorization":`Bearer ${token}`
        };

        let options = {
            "host": "01wapi.rte.com.br",
            "port": "443",
            "path": "/api/v1/gera-cotacao",
            "method": "POST",
            "headers": headers
        };

        let req = https.request(options,(resp) => {
            let data = "";

            resp.on("data",(chunk) => {
                data += chunk;
            });

            resp.on("end",() => {
                let result = JSON.parse(data);
                if (resp.statusCode != 200 && resp.statusCode != 204) {
                    resolve({
                        "status": "E",
                        "message": result[0].Message
                    });
                } else {
                    resolve({
                        "status": "S",
                        "result": result
                    });
                }
            });
        });
        req.write(post);
        req.end();
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
        let config = Object.get2(input.config,carrierid);

        if (Object.get("debug")==1) {
            console.log(`${carrierid}: inicio`);
        }

        let params = {
            "OriginZipCode": config.OriginZipCode,
            "OriginCityId": config.OriginCityId,
            "DestinationZipcode": input.zipcode,
            "DestinationCityId": input.cityid,
            "TotalWeight": input.weight,
            "EletronicInvoiceValue": input.total,
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

        Rodonaves.getToken(config).then((token) => {
            if (token.status == "E") {
                end = new Date();
                diff = end - start;

                resolve({
                    "carrierid": carrierid,
                    "status"   : "E",
                    "duration" : diff,
                    "message"  : token.message,
                    "result"   : answerList
                });
                return;
            }

            Rodonaves.getCustomer(input,token.result.access_token).then((customer) => {
                if (customer.status == "E") {
                    end = new Date();
                    diff = end - start;

                    resolve({
                        "carrierid": carrierid,
                        "status"   : "E",
                        "duration" : diff,
                        "message"  : customer.message,
                        "result"   : answerList
                    });
                    return;
                }
                params.DestinationCityId = customer.result.CityId;

                Rodonaves.getFreight(params, token.result.access_token).then((freight) => {
                    end = new Date();
                    diff = end - start;

                    if (freight.status == "E") {
                        resolve({
                            "carrierid": carrierid,
                            "status"   : "E",
                            "duration" : diff,
                            "message"  : freight.message,
                            "result"   : answerList
                        });
                        return;
                    } else {
                        let answer = utils.getDefaultAnswer();
                        answer.carrierid = carrierid;
                        answer.product.id = "default";
                        answer.product.name = "default";
                        answer.price = freight.result.Value;
                        answer.deliveryDays = freight.result.DeliveryTime;
                        answer.status = "S";
                        answerList.push(answer);
                        
                        resolve({
                            "carrierid": carrierid,
                            "status"   : "S",
                            "duration" : diff,
                            "message"  : "",
                            "result"   : answerList
                        });
                    }
                });
            });
        });
    });
}

module.exports = Rodonaves;