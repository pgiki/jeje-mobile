const qs = require('query-string');
const _ = require("lodash");

class Utils {
    preProcessAmount = (value) => {
        /*
          sometimes account ID is mistaken for amount so check here to fix stuff
        */

        if (value && value.length > 8) {
            value = ""
        }

        return value
    }

    cleanText = (text) => {
        text = this.removePunctuation(text);
        text = text.replace(/(N|n)o\.[:]{0,}/g, ' ')
            .replace(/Tsh/gi, '')
            .replace(/\-/g, ' ')
            .replace(/\./g, ' . ')
        return text
    }

    getObject = (_obj, path, defaultValue = undefined) => {
        let obj = _.clone(_obj, true)
        if (!path) return obj
        if (obj == null) return defaultValue
        path = `${path}`.split('.');
        var current = obj;
        while (path.length) {
            if (typeof current !== 'object' || typeof path !== 'object') return defaultValue;

            if (!path || !current) return current
            current = current[path.shift()];
        }
        if (current == null) {
            current = defaultValue
        }
        return current
    }

    createObject = (obj, path = null, value = null) => {
        if (path == null) {//then shift the variables
            obj = {}
            path = obj
            value = path
        }
        if (!obj) {
            obj = {}
        }
        path = typeof path === 'string' ? path.split('.') : path;
        let current = obj;
        while (path.length > 1) {
            const [head, ...tail] = path;
            path = tail;
            if (!current[head]) {
                current[head] = {};
            }
            current = current[head];
        }
        current[path[0]] = value;
        return obj;
    }
    removePunctuation = (string, all = false) => {
        var regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
        string = string.replace("kwa", "")
        if (!all) {
            regex = /[,]/g;
        }
        string = string.replace(regex, '').trim();
        return string
    }

    formatNumbers = (string) => {
        //A quick fix to fix numbers//howevr it looses the decimal part
        if (string.indexOf('.') > -1) {
            return string.substr(0, string.indexOf('.')).replace(',', '');
        } else {
            return string
        }
    }


    getSearchParams = (str) => {
        let data = {}
        try {
            if (!str) return data
            const index = str.search(/(\?)\w+/i)
            if (index > -1) {
                data = qs.parse(str.slice(index))
            } else {
                data = qs.parse(str)
            }
            //clean data by removing []
            let cleanedData = {}
            Object.keys(data).map(key => {
                const _key = key.split("[]")[0]
                cleanedData[_key] = data[key]
            })
            return cleanedData
        } catch (error) {
            return data
        }
    }
    getIntents = (providers, text) => {
        let intents = []
        let textCleaned = this.cleanText(text);
        Object.keys(providers).map(providerName => {
            const params = providers[providerName]({ text: textCleaned })
            intents.push(params)
        });
        intents = _.sortBy(intents, "confidence");
        intents.reverse();
        return { intents };
    }
}

module.exports = new Utils()