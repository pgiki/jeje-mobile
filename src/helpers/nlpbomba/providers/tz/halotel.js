const _ = require("lodash");
// const nlp = require("compromise");
import nlp from 'compromise';
const utils = require('../../utils');
const helpers = require('./helpers');

module.exports = function halotel({ text }) {
    /*
    Utambulisho wa muamala: 1285329889. 
    Umelipia tsh 10,000 kwa ajili ya kifurushi, 
    salio lako jipya la Halopesa ni tsh 11,698. Asante!
    */
    let doc = nlp(utils.cleanText(text))
    let confirmationCode = doc.match('(id|muamamala|muamala)').lookAhead('#Value').out('array')[0]
    let transactionTime = doc.match('(tarehe|mnamo|on|time|wakati|kumbukumbu)').lookAhead('#Date').out('array').join(" ")

    let amount = utils.preProcessAmount(doc.match('(kiasi|received|paid|sent|umetoa|umetuma|umepokea|umelipia)').lookAhead('#Value'))
        .out('array').slice(0, 1).join(" ") || doc.match('(was)').lookBehind('#Value')
            .out('array').slice(0, 1).join(" ");

    let accountName = doc.match('(kutoka|kwa|from|name)').lookAhead('(#Value|#Noun)')
        .out('array')
        .filter(y => {
            //filter only ones which are all caps
            let results = y.match(/[A-Z]+/)
            if (results && results[0] === y) {
                return true
            }
        }).join(" ")

    let accountID = doc.match('(number|utambulisho|namba|mpokeaji)').lookAhead('#Value').out('array')[0];
    let transactionFee = doc.match('(ada|charged|fee)').lookAhead('#value').out('array').join(" ");
    let latestBalance = doc.match('(new|salio)').lookAhead('#value').out('array').join(" ");
    let isAmountIn = true;

    if (confirmationCode === accountID) {
        accountID = doc.match('(ada|wakati)').lookBehind('#Value').out('array').slice(-1)[0];
    }

    if (doc.has("maongezi") || doc.has("Bundle") || doc.has("kifurushi")) {
        isAmountIn = false;
        accountName = "Airtime and Bundle";
        transactionFee = 0
    }

    if (!accountID) {//in some cases account ID misses
        accountID = accountName
    }

    // console.log("Tigo transactionTime", transactionTime)

    if (!transactionTime) {
        transactionTime = new Date()
    }

    let spending = ["umelipa", "umenunua", "umenunua", "spent", "umetuma", "imetumwa", "paid", "umetoa"];
    spending.map(keyWord => {//TODO; break once found value
        if (doc.has(keyWord)) {
            isAmountIn = false;
        }
    })

    return helpers.cleanValues({
        provider: 'Halotel TZ',
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