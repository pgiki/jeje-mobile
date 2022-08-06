const _ = require("lodash");
// const nlp = require("compromise");
import nlp from 'compromise';
const utils = require('../../utils');
const helpers = require('./helpers');

module.exports = function airtel({ text }) {
    const cleanConfirmationCode = (value) => {
        if (!value) return value
        return value.split(".").slice(0, 3).join(".")
    }
    const cleanAccountID = (value) => {
        if (!value) return value
        return value //.split(",")
    }

    const cleanAccountName = (value) => {
        if (!value) return value
        return value.split(",").slice(-1)[0]
    }

    let cleanedText = text.match(/[^_\W]+/g)?.join(' ') || ''
    let doc = nlp(text)
    let cleanedDoc = nlp(cleanedText);
    let confirmationCode = cleanConfirmationCode(
        doc.match('(rejea|refer|muamala|kumbukumbu)').lookAhead('(#Noun|#Value)').out('array')[0]
    )
    //not available in most messages
    let transactionTime = JSON.parse(JSON.stringify(new Date())).toString()
    let amount = utils.preProcessAmount(doc.match('(kutoka|imetumwa|to|from|kwenda)').lookBehind('#Value').out('array').slice(-1)?.join(" "));
    let accountName = cleanAccountName(doc.match('(kutoka|kwa|from|to)').lookAhead('#Noun').out('array').slice(0, 2)?.join(" "));
    let accountID = cleanAccountID(cleanedDoc.match('(kutoka|kwa|from|to)').lookAhead('#Value').out('array')[0]);
    let transactionFee = doc.match('(ada ya|charged|kamisheni)').lookAhead('#Value').out('array')?.join(" ");
    let latestBalance = doc.match('(ni|is)').lookAhead('#Value').out('array').slice(0, 1)?.join(" ");
    let isAmountIn = true;

    if (doc.has("maongezi")) {
        isAmountIn = false;
        accountName = 'Airtime and Bundle';
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
        provider: 'Airtel TZ',
        confirmationCode,
        transactionTime,
        amount, accountID,
        accountName,
        transactionFee,
        latestBalance,
        isAmountIn
    })
}