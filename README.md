# Lotería de Babilonia
Este contrato describe una lotería sencilla con un pozo, jugadores, "sorteador" random con un oráculo, y premio para el ganador. Se puede repetir infinitas veces.

## Funciones disponibles del contrato

* enterLottery: Comprar una entrada
* getTicketPrice: Obtener el precio de la entrada
* getPrize: Obtener el premio acumulado
* getWinner: Sortear un ganador
* ...

## Deploy on local node
```bash
yarn run local
```

Este comando va a ejecutar una serie de scripts detallados a continuación:

```bash
"run:local": "yarn wait-on && yarn run deploy:local",
"deploy:node": "hh node",
"deploy:local": "hh deploy --network localhost",
"wait-on": "wait-on -l tcp:8545",
```

### Pasos que ejecuta el script
1. Levanta un nodo local
2. Espera que el puerto 8545 empiece a estar disponible
3. Despliega el contrato al nodo local
4. Imprime un comando para probar manualmente el deploy ejecutando el script `scripts/enter.js`.

<b>Aclaración:</b> La función "hh deploy" detecta automáticamente todos los archivos dentro de la carpeta `deploy` y los ejecuta en orden primero `00-mocks.js`, y luego `01-lottery.js`.
Al hacer esto no es necesario especificar de donde leer los script de mock o deploy, siempre va a leer ambos.

## Test on local node
```js
yarn run test:local
```

## Deploy on Goerli
```js
yarn run deploy:goerli
```

<b>Aclaración:</b> Esta ejecución implica una verificación del contrato dentro del script que realiza el deploy `01-lottery.js`.

## Test on Goerli
```js
yarn run test:goerli // not working
```

## Deploy on Mainnet
```js
yarn run deploy:mainnet
```