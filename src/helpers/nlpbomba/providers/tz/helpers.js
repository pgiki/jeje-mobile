const utils = require('../../utils');
const moment = require('dayjs');

class Helpers {
    getCurrency = (str) => {
        str = str.replace(",", "")
        str = str.replace(",", "")
        str = str.replace(",", "")
        var regex = /[+-]?\d+(\.\d+)?/g;
        var floats = str.match(regex);
        // console.log("string", str, floats)
        if (floats) {
            let amount = parseFloat(floats[0])
            let currency = str.replace(floats[0], "")
            currency = currency.replace(".", "").trim().toUpperCase()
            currency = currency.replace("TSH", "TZS")
            if (!currency) {
                currency = "TZS"
            }
            return { amount, currency }
        }
        return { amount: null, currency: null }
    }

    cleanValues = (data, text) => {
        /*
          * calculates score, format numbers etc
         :text=>the original text
         :data=>the processed data from provider
        */
        let score = 0;
        let amountKeys = ["amount", "transactionFee", "latestBalance"]
        let keys = Object.keys(data);
        keys.map(key => {
            let value = data[key]
            if (value) {
                score += 1
                if (typeof value === "string") {
                    if (this[`${key}Clean`]) {
                        value = this[`${key}Clean`](value)
                    } else {
                        //remove any leading .,
                        //format numbers
                        value = utils.formatNumbers(value)
                        value = value.replace(/[\.\,]\s*$/, "");
                        //remove puctuations
                        value = utils.removePunctuation(value, true)
                    }
                    //process currency
                    if (amountKeys.includes(key)) {
                        let { amount, currency } = this.getCurrency(value)
                        data[key] = amount
                        if (currency) {
                            data.currency = currency
                        }
                    } else {
                        data[key] = value
                    }
                }
            }
        })
        data.confidence = score / keys.length
        return data
    }

    accountNameClean = (name) => {
        /*
          in most cases names have capital words. 
        */
        let upperCaseWords = name.match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g);
        if (upperCaseWords) {
            upperCaseWords = upperCaseWords.join(" ")
        } else {
            upperCaseWords = name
        }
        return upperCaseWords.title()
    }
    providerClean = (name) => name;

    transactionTimeClean = (value) => {
        if (moment(value).isValid()) {
            value = moment(value).toDate()
        } else {
            value = new Date()
        }
        return value
    }

    sortIntents = (intents) => {
        intents = _.sortBy(intents, "confidence")
        intents.reverse();
        return intents
    }
}

module.exports = new Helpers()