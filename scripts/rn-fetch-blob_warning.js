const fs = require('fs');

const replaced = 'import RNFetchBlob from \'../index.js\'';
const replacement = 'import {NativeModules} from \'react-native\';\nconst RNFetchBlob = NativeModules.RNFetchBlob';

const replacements = [
    [replaced, replacement],
    [replaced, replacement],
    [replaced, replacement],
    [
        'import { BottomNavigation, DarkTheme, DefaultTheme } from \'react-native-paper\';',
        'import { BottomNavigation} from \'react-native-paper\';\nconst DarkTheme={}; const DefaultTheme ={};',
    ],
]

const files = [
    'node_modules/rn-fetch-blob/polyfill/Fetch.js',
    'node_modules/rn-fetch-blob/polyfill/Blob.js',
    'node_modules/rn-fetch-blob/polyfill/XMLHttpRequest.js',
    'node_modules/@react-navigation/material-bottom-tabs/src/views/MaterialBottomTabView.tsx',
];

files.map((file, index) => {
    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(new RegExp(replacements[index][0], 'g'), replacements[index][1]);
        fs.writeFile(file, result, 'utf8', function (e2) {
            if (err) { return console.log(e2); }
        });
    });
});

