const _ = require("lodash");
// const nlp = require("compromise");
import nlp from 'compromise';
const utils = require('../../utils');
const helpers = require('./helpers');

module.exports = function vodacom({ text }) {
    let doc = nlp(text)
    let confirmationCode = doc.match('(imethibitishwa|confirmed)').lookBehind('#Noun').out('array')[0]
    let transactionTime = doc.match('(tarehe|mnamo|on)').lookAhead('#Date').out('array').join(" ")
    let amount = utils.preProcessAmount(doc.match('(kutoka|imetumwa|to|from)').lookBehind('#Noun').out('array').slice(-1).join(" "));
    let accountName = doc.match('(kutoka|kwa|from|to)').lookAhead('#Noun').out('array').slice(0, 3).join(" ");
    let accountID = doc.match('(kutoka|kwa|from|to)').lookAhead('#Value').out('array').slice(-1)[0];
    let transactionFee = doc.match('(ada ya|charged)').lookAhead('#Noun').out('array').join(" ");
    let latestBalance = doc.match('(ni|is)').lookAhead('#Noun').out('array').join(" ");
    let isAmountIn = true;

    if (doc.has("maongezi")) {
        isAmountIn = false;
        accountName = "Airtime and Bundle";
    }
    let spending = ["umelipa", "umenunua", "umenunua", "spent", "umetuma", "imetumwa", "ada", "fee"]
    spending.map(keyWord => {//TODO; break once found value
        if (doc.has(keyWord)) {
            isAmountIn = false;
        }
    })

    if (accountID && accountID.includes(",")) { //this is currency mistaken for account ID
        accountID = accountName
    }
    if (!accountID) {//in some cases account ID misses
        accountID = accountName
    }

    if (!confirmationCode) {//sometimes confirmationCode is not picked up so use an alternative approach
        confirmationCode = text.split(" ")[0]
    }
    return helpers.cleanValues({
        provider: 'Vodacom TZ',
        confirmationCode,
        transactionTime,
        amount,
        accountID,
        accountName,
        transactionFee,
        latestBalance,
        isAmountIn
    })
}