import re, json
import glob
import os
import pandas as pd
from python_translator import Translator
from langdetect import detect
import gspread as gs
from gspread_dataframe import set_with_dataframe
gc = gs.service_account()

translator = Translator()
translation = set()
language_dir = './src/helpers/localization';
language_codes = ['en', 'sw', 'zh', 'hi']
translation_text_regex = r"""i18n\.t\([\'\"]([\w\s\.\{\}\,\_\(\%\)\?]+)[\'\"][\),]"""

def get_url(language_code='sw', return_url=True):
    urls={
        "sw": {
            "sheet_id": '1e8BzMyh8D3-frSbXmqGg7LHpxjmCDbbXGy1aApCuQAY',
            "sheet_index":language_codes.index(language_code),
            "gid":'2114607573',
        },
        "en": {
            "sheet_id": '1e8BzMyh8D3-frSbXmqGg7LHpxjmCDbbXGy1aApCuQAY',
            "sheet_index":language_codes.index(language_code),
            "gid":'1258348705',
        },
        "hi": {
            "sheet_id": '1e8BzMyh8D3-frSbXmqGg7LHpxjmCDbbXGy1aApCuQAY',
            "sheet_index":language_codes.index(language_code),
            "gid":'1869082891',
        },
        "zh": {
            "sheet_id": '1e8BzMyh8D3-frSbXmqGg7LHpxjmCDbbXGy1aApCuQAY',
            "sheet_index":language_codes.index(language_code),
            "gid":'1523365400',
        },
    }
    if not return_url:
        return urls[language_code]
    else:
        sheet_id = urls[language_code]['sheet_id']
        gid = urls[language_code]['gid']
        return f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&tq&gid={gid}'

def json_save(obj, file_name):
    with open(os.path.join(language_dir, file_name), 'w+') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        print("saved", file_name)

def json_load(filename):
    data=dict()
    with open(filename, 'r') as f:
        data = json.load(f)
    return data

def get_languages():
    languages ={}
    for lang_code in language_codes+['general']:
        try:
            languages[lang_code] = json_load(os.path.join(language_dir, f'{lang_code}.json'))
        except Exception as e:
            print('error getting language', lang_code, e)
            languages[lang_code] = dict()
    return languages

def save_gs(df, sheet_index=0, sheet_id=None, **kwargs):
    sh = gc.open_by_key(sheet_id)
    # client email: wimt-service@dar-audits.iam.gserviceaccount.com
    worksheet = sh.get_worksheet(sheet_index) #-> 0 - first sheet, 1 - second sheet etc. 
    set_with_dataframe(worksheet, df) #-> THIS EXPORTS YOUR DATAFRAME TO THE GOOGLE SHEET
    print(f"Saved updated sheet {sheet_index}")

def auto_translate(s, language_code):
    result = s
    is_same_language = True
    detected_language = ''
    _language_code={
        "zh": 'chinese',
        "sw":'swahili',
    }.get(language_code, language_code)
    similar_languages ={
        'zh': ['zh', 'ko', 'et', 'hr', 'it', 'no', 'ka', 'ro', 'da', 'vi', 'ca']
    }
    try:
        detected_language =detect(s)
        is_same_language = detected_language.split('-')[0] in similar_languages.get(language_code, [language_code])
    except Exception as e:
        print("Error lan detect", s, e)
        pass

    if not is_same_language:
        _result = translator.translate(s, _language_code)
        result = str(_result) if _result else s
    return result

def format_language_key(s):
    placeholders = re.findall(r'{([\w\._]+)}', s)
    for placeholder in placeholders:
        s=s.replace('{' + placeholder +'}', '%{' + placeholder +'}')
    return s.replace('%'+'%', '%')

def generate_custom_translations(language_code='sw'):
    """
    generates a language specific translation spreadsheet
    """
    # gettext()
    df = pd.read_csv(get_url(language_code))
    # change to json object so it is easy to access
    translated_strings =dict()

    for entry in json.loads(df.to_json(orient='records')):
        translated_strings[entry['key']] = entry
     
    languages = get_languages()
    data=languages[language_code]

    for index, row in df.iterrows():
        data[row.key] = row.value 
    
    # generate csv file and upload spreadsheet
    df1=pd.DataFrame.from_dict(
        data=[{ "key": key, 
                "value": value, 
                'is_translated': translated_strings.get(key, {}).get('is_translated', False) == True} for key, value in data.items()
            ])
    save_gs(df1, **get_url(language_code, return_url=False))

def translate(language_code = 'sw'):
    """
    Downloads google spreadsheet translations
    and autotranslate strings which are not translated yet
    """
    df = pd.read_csv(get_url(language_code)).dropna(subset=['key'])
    translated_language = []
    for index, row in df.iterrows():
        key = row.key
        value = row.value
        is_translated = row.is_translated
        try:
            new_text = auto_translate(value, language_code) if not is_translated else value
            translated_language.append({
                "key": key, 
                "value": new_text, 
                'is_translated':is_translated
            })
            if not is_translated:
                print(key, new_text)
        except Exception as e:
            print("Error  ", e)

    # generate csv file and upload spreadsheet
    df1=pd.DataFrame.from_dict(data=translated_language)
    save_gs(df1, **get_url(language_code, return_url=False))

def download_custom_translations(language_code='sw'):
    df = pd.read_csv(get_url(language_code)).dropna(subset=['key'])
    data={}
    for index, row in df.iterrows():
        data[row.key] = row.value 
    # print(data)
    json_save(data,  f'{language_code}.json')

def gettext(_language_codes=[], languages=None, auto_translate_languages=[], auto_download_languages=[]):
    if not _language_codes:
        _language_codes = language_codes

    files =  glob.glob('./src/**/**/**/*.js', recursive=True) + glob.glob('./App.js')
    for file_name in files:
        with open(file_name, 'r') as f:
            data = f.read()
            matches=re.findall(translation_text_regex, data)
            # print(matches)
            if matches:
                translation.update(set(matches))
    languages = get_languages()
    # update language translations
    for lang_code in _language_codes:
        valid_language_keys = list(set(
            list(languages['general'].keys())+list(languages.get(lang_code, {}).keys())+list(translation)
        ))
        valid_language_keys.sort()
        language = dict()

        for valid_language_key in valid_language_keys:
            key_translation = languages[lang_code].get(valid_language_key)
            # if not exist format that key
            if  (not key_translation and not valid_language_key in languages['general']):
                key_translation_formated = format_language_key(valid_language_key)

                if (valid_language_key == key_translation_formated and lang_code != 'en'):
                    # get english terminology
                    key_translation_formated = languages['en'].get(valid_language_key, valid_language_key)
                    # print("key_translation_formated", key_translation, key_translation_formated)

                key_translation = key_translation_formated
                print("NN",lang_code != 'en', lang_code, valid_language_key, key_translation, sep='>>')

            if key_translation == valid_language_key and  valid_language_key in languages['general']:
                key_translation=languages['general'].get(valid_language_key, valid_language_key)
            
            language[valid_language_key] = key_translation or languages['general'].get(valid_language_key, valid_language_key)
        json_save(language,  f'{lang_code}.json')
        generate_custom_translations(lang_code)
        if lang_code in auto_translate_languages:
            translate(lang_code)
        if lang_code in auto_download_languages:
            download_custom_translations(lang_code)
        print("saved language ", lang_code)


gettext(
    # _language_codes=language_codes,
    # auto_translate_languages=language_codes, 
    # auto_download_languages=language_codes
    _language_codes=language_codes,
    auto_translate_languages=[], 
    auto_download_languages=[]
)