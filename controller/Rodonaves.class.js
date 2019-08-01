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
        let post = JSON.stringify(params);
        let headers = {
            "Content-Type":"application/json",
            "Content-Length":post.length
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
                console.log("token: "+data);
                console.log("token response: "+resp);
                if (resp.statusCode != 200 && resp.statusCode != 204) {
                    return reject(data);
                } else {
                    Rodonaves.token = data;
                    resolve(data);
                }
            });
        });
        req.write(post);
        req.end();
    });
}

Rodonaves.getCustomer = (input) => {
    return new Promise((resolve, reject) => {
        // let url = `https://01wapi.rte.com.br/api/v1/busca-por-cep?zipCode=${input.zipcode}`;
        let headers = {
            "Content-Type": "application/json",
            "Authorization":`Bearer ${Rodonaves.token}`
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
                console.log("getCustomer response: "+resp.statusCode);
                let result = JSON.parse(data);
                console.log("getCustomer: "+JSON.stringify(result));
                if (resp.statusCode != 200 && resp.statusCode != 204) {
                    return reject(result.Message);
                } else {
                    Rodonaves.customer = result;
                    resolve(result);
                }
            });
        });
        req.end();
    });
}

Rodonaves.getFreight = (params) => {
    return new Promise((resolve, reject) => {
        let url = `https://01wapi.rte.com.br/api/v1/gera-cotacao`;
        let post = JSON.stringify(params);

        let headers = {
            "Content-Type":"application/json",
            "Content-Length":post.length,
            "Authorization":`Bearer ${Rodonaves.token}`
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
                console.log("getFreight response: "+resp);
                if (resp.statusCode != 200 && resp.statusCode != 204) {
                    return reject(data);
                } else {
                    let result = JSON.parse(data);
                    console.log("getFreight: "+JSON.stringify(result));
                    resolve(result);
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
        let getCustomer = Rodonaves.getCustomer(input);
        let getFreight = Rodonaves.getFreight(params);

        getToken.then(() => {
            getCustomer.then(() => {
                getFreight.then((res,rej) => {
                    resolve(res);
                }).catch((err) => {
                    console.log("getFreightError: "+err);
                });
            }).catch((err) => {
                console.log("getCustomerError: "+err);
            });
        }).catch((err) => {
            console.log("getTokenError: "+err);
        });
    });
}

module.exports = Rodonaves;