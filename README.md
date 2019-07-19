![Node](https://img.shields.io/badge/node-%3E%3D%208.0.0-brightgreen.svg)

<p align="center">
  <h1 align="center">Consulta de Frete</h1>
</p>

Consulta de frete assíncrono com várias transportadoras, ideal para uso em sua plataforma de ecommerce.

### Transportadoras
- :heavy_check_mark: Correios (Funcionando)
- :x: TNT (Em desenvolvimento)
- :x: Rodonaves (Em desenvolvimento)
- :x: JadLog (Em desenvolvimento)
- :x: TotalExpress (Em desenvolvimento)
- :x: DirectLog (Em desenvolvimento)

### Instruções

1) Clone ou baixe o zip do projeto e extraia em um diretório de sua preferência.

2) Entre no diretório e execute o comando
 
```
npm install fs express http https xml2js
```

3) Copie o arquivo de configuração de exemplo de cada transportadora no diretório /public/sample/ para o diretório
/public/config/ e forneça as informações necessárias da sua empresa

4) Inicie o app
 
```
node index.js
```

5) Consuma o serviço conforme explicado abaixo. Para facilitar, copie o arquivo sample.html para um servidor web e execute para ver a consulta funcionando. Há basicamente duas formas de consumo do serviço:

- A primeira é consultando apenas uma url e recebendo todos os fretes de uma só vez. 
- A segunda forma (recomendada) é consultar as transportadoras que atendem a solicitação e depois chamar a consulta de frete de cada transportadora individualmente. Assim, conforme cada consulta é finalizada, o usuário já recebe
a informação, ao invés de esperar todas terminarem.

Biblioteca frontend para facilitar o consumo do serviço

```
https://cdn.jsdelivr.net/gh/vcd94xt10z/consulta-frete/freight.js
```
 
### Operações disponíveis

Calcula o frete das transportadoras disponíveis (o acesso ao WebService de cada transportadora é feito de forma assíncrona)

```
POST /frete/

{
	"zipcode": "04180112",
	"total": 300.5,
	"weight": 2,
	"width": 14,
	"height": 4,
	"length": 18,
	"diameter": 10	
}
```

Retorna as transportadoras que atendem o frete

```
POST /info/
 
{
	"zipcode": "04180112",
	"total": 300.5,
	"weight": 2,
	"width": 14,
	"height": 4,
	"length": 18,
	"diameter": 10	
}
```

Calcula o frete da transportadora TNT

```
POST /frete/tnt
 
{
	"zipcode": "04180112",
	"total": 300.5,
	"weight": 2,
	"width": 14,
	"height": 4,
	"length": 18,
	"diameter": 10	
}
```
