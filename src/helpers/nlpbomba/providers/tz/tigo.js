const _ = require("lodash");
// const nlp = require("compromise");
import nlp from 'compromise';
const utils = require('../../utils');
const helpers = require('./helpers');

module.exports = function tigo({ text }) {
    /*
    Umetuma kikamilifu kwenda kwa mpokeaji wa Airtel AGNESS NTENGO - 255786220685. 
    Kiasi TSh 450,000. Jumla ya Makato TSh 3,886, VAT TSh 343. Salio jipya ni TSh 62,857. 
    Muamala: 35619798937. Risiti: MI220722.1611.O15634. 22/07/22 16:11.

    Umetuma kikamilifu kwenda kwa mpokeaji wa Airtel AGNESS NTENGO - 255786220685. 
    Kiasi TSh 450000. Jumla ya Makato TSh 3886, VAT TSh 343. Salio jipya ni TSh 62857. 
    Muamala: 35619798937. Risiti: MI220722.1611.O15634. 22/07/22 16:11.
    */
    //clean unneccessary breaks
    text = text.replace(/Tsh/gi, '')
    text = text.replace(/TSh/gi, '')
    text = text.replace(/,/gi, '')
    text = text.replace(/No\./gi, 'No');
    text = text.split(".").join(". ");
    text = utils.removePunctuation(text);
    let doc = nlp(text);

    let confirmationCode = doc.match('(kumbukumbu|muamala)')
        .lookAhead('#Value').out('array')[0]


    let transactionTime = doc.match('#Date').out('array').join(" ");
    let amount = utils.preProcessAmount(doc.match('(umelipa|ankara|umepokea|kiasi)').lookAhead('(#Value)').out('array')[0] ||
        doc.match('(umetuma|umelipa|wa|ankara|umepokea|kiasi)').lookAhead('(#Value)').out('array')[0]);

    let accountName = doc.match('(to|vodacom|kwa|wakala|ya|kikamilifu|kwenda)')
        .lookAhead('((#Value|#Noun|)|#acronym)').out('array').slice(1);

    accountName = [...new Set(accountName)].join(" ").replace('VAT', '')?.trim()

    let accountID = doc.match('(kutoka|kwa|from|to|kampuni|kwenda)').lookAhead('#Value').out('array').slice(-1)[0];
    let transactionFee = doc.match('(ada|charged|makato)').lookAhead('#Value').out('array').join(" ");
    let latestBalance = doc.match('(ni|is|jipya)').lookAhead('#Value').out('array')[0];
    let isAmountIn = true;
    if (doc.has("maongezi") | (doc.has("malipo") && doc.has("kumbukumbu") && !accountID)) {
        isAmountIn = false;
        accountName = accountName || "Airtime and Bundle";
        transactionFee = 0.0;
        if (!transactionTime) {
            transactionTime = JSON.parse(JSON.stringify(new Date()));
        }
    }
    let spending = ["umelipa", "umenunua", "umenunua", "spent", "umetuma", "imetumwa", "malipo"]
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


    return helpers.cleanValues({
        provider: 'Tigo TZ',
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