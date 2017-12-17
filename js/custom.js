$(document).ready(function() {
  $.ajax({
    dataType: "json",
    url: "data/custom.json?" +new Date().getTime(),
    data: {},
    success: function (res) {
      localStorage.setItem("basicExchangesData", JSON.stringify(res))
      usdCurrencyData["dollar_rate"] = res.dollar_rate
      initializeUSDTab()
      poppulateWithdrawalCharges()
    }
  })
  document.getElementById("btnreload").addEventListener("click", function(){
      usdCurrencyData.dollar = Number($('#txtdollar').val())
      usdCurrencyData.dollar_rate = Number($('#txtdollar_rate').val())
      initializeUSDTab()
   });
})

// Usd functions
let usdCurrencyData = {
  "dollar" : 500
}

let cryptoPrices = {
  "exchanges" : {}
}

function initializeUSDTab() {
  const basicExchangesData = JSON.parse(localStorage.getItem("basicExchangesData"));
  $.each(basicExchangesData.exchanges, function(key, value) {
    //if(value.accepts_usd_visa === 1) {
      var bankFactor = 0.035
  		var gstFactor = 0.18
      var usdTotal = usdCurrencyData.dollar * (1 + value.visa_commision/100)  + value.visa_commision_tax
      var lblBankTrans = round(usdTotal * usdCurrencyData.dollar_rate,2)
      var lblBankMargin = round(lblBankTrans * basicExchangesData.bank_factor,2)
      var lblBankGST = round(lblBankMargin * basicExchangesData.gst_factor,2)
      lblBankTotal = round(lblBankTrans + lblBankMargin  + lblBankGST,2)
      usdCurrencyData[key+"_usd"] = value.accepts_usd_visa === 1 ? usdTotal : usdCurrencyData.dollar
      usdCurrencyData[key+"_inr"] = value.accepts_usd_visa === 1 ? lblBankTotal : usdCurrencyData.dollar_rate * usdCurrencyData.dollar
  //  }
  })
  populateDollarValues()
  loadCryptoPrices()
}

function loadCryptoPrices() {
  const basicExchangesData = JSON.parse(localStorage.getItem("basicExchangesData"));
  let deferredExchangeCalls = []
  $.each(basicExchangesData.exchanges, function(exchange, basicData) {
    let callback = $.Deferred();
    deferredExchangeCalls.push(callback)
    if (exchange != "bittrex") {
      $.ajax({url: basicData.api_url,
        success: function(result) {
          loadExchangePrice(exchange, basicData, result, callback)
        }
      })
    } else {
      loadBittrexData(basicData, callback)
    }
  })
  $.when.all(deferredExchangeCalls).then(function ( cryptos ) {
    $.each(cryptos, function(index, value) {
       let key = Object.keys(value)[0]
       cryptoPrices.exchanges[key] = value[key]
    })
    populateCryptoPrices()
    populateBuySellMarkets()
  });
}

function loadExchangePrice (exchange, basicData, apiResult, callback) {
  switch (exchange) {
    case "cex":
      loadCexPrices(basicData, apiResult, callback)
      break;
    case "koinex":
      loadKoinexPrices(basicData, apiResult, callback)
      break;
    case "bitfinex":
      loadBitfinexPrices(basicData, apiResult, callback)
      break;
    default:
  }
}

function loadCexPrices (basicData, apiResult, callback) {
   if(apiResult.ok === "ok") {
    let cryptoPrice = {}
    let retvalue = {}
    retvalue["cex"] = cryptoPrice
    $.each(apiResult.data, function(index, crypto) {
      //if(basicData.crypto_supported.indexOf(crypto.symbol1) != -1 && crypto.symbol2 === "USD") {
      if(crypto.symbol2 === "USD") {
        cryptoPrice[crypto.symbol1] = {}
        cryptoPrice[crypto.symbol1]["lpriceUsd"] = round(Number(crypto.lprice),2)
        cryptoPrice[crypto.symbol1]["lpriceInr"] = round(Number(crypto.lprice )* usdCurrencyData.dollar_rate,2)
        cryptoPrice[crypto.symbol1]["crypto"] = round(usdCurrencyData.dollar/Number(crypto.lprice),4)
      }
      //}
    })

    callback.resolve( retvalue)
   }
}

function loadKoinexPrices (basicData, apiResult, callback) {
 let cryptoPrice = {}
 let retvalue = {}
 retvalue["koinex"] = cryptoPrice
 let lprices = apiResult.prices;
 $.each(apiResult.prices, function(sym, crypto) {
   cryptoPrice[sym] = {}
   cryptoPrice[sym]["lpriceUsd"] = round(crypto / usdCurrencyData.dollar_rate,2)
   cryptoPrice[sym]["lpriceInr"] = Number(crypto)
   cryptoPrice[sym]["crypto"] = round(usdCurrencyData["koinex_inr"] / crypto,4)
 })
  callback.resolve(retvalue)
}

function loadBitfinexPrices(basicData, apiResult, callback) {
  let cryptoPrice = {}
  let retvalue = {}
  retvalue["bitfinex"] = cryptoPrice
  //let lprices = apiResult.prices;
   for (var index in apiResult) {
    const symbol = apiResult[index][0].substring(1,4)
    cryptoPrice[symbol] = {}
    cryptoPrice[symbol]["lpriceUsd"] = round(apiResult[index][1],2)
    cryptoPrice[symbol]["lpriceInr"] = round(Number(usdCurrencyData.dollar_rate * apiResult[index][1]),2)
    cryptoPrice[symbol]["crypto"] = round(usdCurrencyData["bitfinex_usd"] / apiResult[index][1],4)
  }
   callback.resolve(retvalue)
}

function loadBittrexData(basicData, callback) {
  let deferredCryptoCalls = []
  const proxyurl = "https://cors-anywhere.herokuapp.com/";
  const basicExchangesData = JSON.parse(localStorage.getItem("basicExchangesData"));
  let retvalue = {}
  let cryptoPrice ={}
  retvalue["bittrex"] = cryptoPrice
  $.each(basicExchangesData.global_crypto_supported, function(index, symbol) {
    let callbackCrypto = $.Deferred();
    deferredCryptoCalls.push(callbackCrypto)
    $.ajax({
      url: proxyurl + basicData.api_url + symbol.replace("BCH","BCC"),
      success: function(response){
        if(response.success){
          let lprice = response.result[0].Last
          cryptoPrice[symbol] = {}
          cryptoPrice[symbol]["lpriceUsd"] = round(lprice,2)
          cryptoPrice[symbol]["lpriceInr"] = round(Number(usdCurrencyData.dollar_rate * lprice),2)
          cryptoPrice[symbol]["crypto"] = round(usdCurrencyData["bitfinex_usd"] / lprice,4)
          callbackCrypto.resolve(cryptoPrice)
        }
      }
    })
  })
  $.when.all(deferredCryptoCalls).then(function ( cryptos ) {
    callback.resolve(retvalue)
  });

}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}


// Put somewhere in your scripting environment
if (typeof jQuery.when.all === 'undefined') {
  jQuery.when.all = function (deferreds) {
    return $.Deferred(function (def) {
      $.when.apply(jQuery, deferreds).then(
          function () {
              def.resolveWith(this, [Array.prototype.slice.call(arguments)]);
          },
          function () {
              def.rejectWith(this, [Array.prototype.slice.call(arguments)]);
          });
    });
  }
}
