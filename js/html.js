
function populateDollarValues() {
  //let bstColoumNo = Object.keys(usdCurrencyData).length/12
  $('#usdHeader').html('')
  $('#usdConversions').html('')
  $.each(usdCurrencyData, function(key, value) {
    $('#usdHeader').append($("<div class='col-sm-1'></div>").text(key));
    if(key.indexOf("dollar") != -1) {
      $('#usdConversions').append($("<div class='col-sm-1 warning'></div>")
      .append('<input type="text" value="' +value+ '" style="color: black; width:50px" id="txt' + key+ '"></input>'));
    } else {
      $('#usdConversions').append($("<div class='col-sm-1'></div>").text(value));
    }
  });
}

function populateCryptoPrices () {
  $('#cryptoPricesHeader').html('')
  $('#cryptoPrices').html('')
  $('#cryptoPricesHeader').append($("<th></th>").text("Exchange"));
  const basicExchangesData = JSON.parse(localStorage.getItem("basicExchangesData"));
  $.each(basicExchangesData.global_crypto_supported, function(index, symbol) {
      $('#cryptoPricesHeader').append($("<th></th>").text(symbol));
  })
  $.each( cryptoPrices.exchanges, function(exchangeKey, exchange) {
     let row = "<tr><td>" + exchangeKey + "</td>"

    $.each(basicExchangesData.global_crypto_supported, function(index, symbol) {
      let cryptoColumn  = exchange[symbol].lpriceInr + " (" + exchange[symbol].lpriceUsd + ") - " + exchange[symbol].crypto
      row += "<td >" + cryptoColumn + "</td>"
    })
    $('#cryptoPrices').append(row +"</tr>")
  })
}

function populateBuySellMarkets() {
  $('#buySellMarkets').html('')
  const basicExchangesData = JSON.parse(localStorage.getItem("basicExchangesData"));
  let html = ""
  $.each(basicExchangesData.buy_sell_markets, function(index, market) {
    if (index % 2 == 0 ) {
      html =  "<div class='row'>"
    }
    html += "<div class='col-sm-6'><h3>"+market+"</h3>"+ getBuySellMarket(market)+"</div>"
    if ((index+1) % 2 == 0 || index+1 == basicExchangesData.buy_sell_markets.length) {
      html +=  "</div>"
      $('#buySellMarkets').append(html)
    }
  })
}

function getBuySellMarket(market) {
  const basicExchangesData = JSON.parse(localStorage.getItem("basicExchangesData"));

  let table = "<table class='table table-striped'>" +
                "<thead>" +
                  "<tr class='warning'>" +
                    "<th>Coin</th>" +
                    "<th>Diff</th>" +
                    "<th>Crypto</th>" +
                    "<th>Amount</th>" +
                    "<th>PL</th>" +
                  "</tr>" +
                "</thead>" +
                "<tbody >"
  let buyExchange = cryptoPrices.exchanges[market.split("-")[0]]
  let sellExchange = cryptoPrices.exchanges[market.split("-")[1]]
  $.each(basicExchangesData.global_crypto_supported, function(index, symbol) {
      let buyPrice = buyExchange[symbol].lpriceInr
      let sellPrice = sellExchange[symbol].lpriceInr
      let crypto = buyExchange[symbol].crypto - basicExchangesData.exchanges[market.split("-")[0]].withdrawal_charges[symbol]
      let inr = round(crypto *  sellExchange[symbol].lpriceInr,2)
      table += "<tr><td>" + symbol + "</td>"
      table += "<td>" + round (100 * ((sellPrice - buyPrice) / buyPrice) ,2)+ "</td>"
      table += "<td>" + round(crypto,4) + "</td>"
      table += "<td>" + inr + "</td>"
      table += "<td>" + round((inr - usdCurrencyData[market.split("-")[0]+"_inr"]),2) + "</td>"
      table += "</tr>"
  })
  table += "</tbody></table>"

  return table
}

function poppulateWithdrawalCharges() {
  $('#withdrawalChargesHeader').html('')
  $('#withdrawalCharges').html('')
  $('#withdrawalChargesHeader').append($("<th></th>").text("Exchange"));
  const basicExchangesData = JSON.parse(localStorage.getItem("basicExchangesData"));
  $.each(basicExchangesData.global_crypto_supported, function(index, symbol) {
      $('#withdrawalChargesHeader').append($("<th></th>").text(symbol));
  })
  $.each( basicExchangesData.exchanges, function(exchangeKey, exchange) {
    let row = "<tr><td>" + exchangeKey + "</td>"
    $.each(basicExchangesData.global_crypto_supported, function(index, symbol) {
      let cryptoColumn  = exchange.withdrawal_charges[symbol]
      row += "<td >" + cryptoColumn + "</td>"
    })
    $('#withdrawalCharges').append(row +"</tr>")
  })
}
