// heroku ps:scale web=0  

const { CURRENCY_ISO_MAP } = require('./currency-constants')

const { get } = require('http');
const dayjs = require('dayjs')

require('dayjs/locale/ru')
dayjs.locale('ru')

const TelegramBot = require('node-telegram-bot-api');
const ru = require('dayjs/locale/ru');
const { Command } = require('commander');
const axios = require('axios').default;

const express = require('express')
const app = express()

const token = '5553083920:AAEf8j_0bnTGgh0M_IDVjQzPzzWFXpFxFfA'
const API_KEY = '4468e661cae3911dc87cc649a402ebf1'
const bot = new TelegramBot(token, { polling: true });

// const token = process.env.API_KEY;
// const chatId = process.env.CHAT_ID;

app.set('port', (process.env.PORT || 6000));

//For avoiding Heroku $PORT error

app.get('/', function (request, response) {
    let result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function () {
    console.log('App is running, server is listening on port ', app.get('port'));
});


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const opts = {
        // reply_to_message_id: msg.message_id,
        reply_markup: {
            resize_keyboard: true,
            keyboard: [['Weather'], ['Currency']]
        }
    };

    if (msg.text === '/start') {
        bot.sendMessage(msg.chat.id, "choose from the menu", opts);
    }

    if (text === 'Weather') {
        const opts = {
            reply_markup: {
                keyboard: [['Kiev 3 hours range'], ['Kiev 6 hours range'], ['Prev menu']]
            }
        };
        bot.sendMessage(msg.chat.id, "alright choose time frame that u wanna display", opts)

    }

    if (text === 'Prev menu') {
        bot.sendMessage(msg.chat.id, 'choose from the menu', opts);
    }

    const degreeSymbol = (value) => {
        return value >= 0 ? `+${value} C°`
            : value < 0
                ? `-${value} C°`
                : `${value} C°`
    }

    const DEFAULT_TIME_INTERVAL_LIST = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    const PREPEARED_REQUEST_PARAMS = {
        appid: '4468e661cae3911dc87cc649a402ebf1',
        lat: '50.4501',
        lon: '30.5234',
        lang: 'ru',
        units: 'metric'
    }

    function getWeatherForecast(params = {}) {
        return axios.get('https://api.openweathermap.org/data/2.5/forecast?', {
            params: {
                ...PREPEARED_REQUEST_PARAMS,
                ...params
            }
        });
    }

    function getFormatedData(list = [], timeIntervalList = DEFAULT_TIME_INTERVAL_LIST) {
        return list.reduce((acc, item) => {
            const key = item.dt_txt.split(' ')[0];
            const time = dayjs.unix(item.dt).format('HH:mm') //.split(`/n`)
            const feelsLike = item.main.feels_like.toFixed();
            const temp = item.main.temp.toFixed();
            const weather = item.weather[0].description;

            const forecastData = {
                [key]: [
                    ...acc?.[key] || [],
                    `${time}, ${degreeSymbol(temp)} ощущается как:${degreeSymbol(feelsLike)}, ${weather} `
                ]
            }
            const localData = timeIntervalList.includes(time) ? forecastData : {}

            return {
                ...acc,
                ...localData
            }
        }, {})
    }

    function getPreparedTemplateData(data = {}) {
        return Object.entries(data).map(([key, value]) => {
            const title = dayjs(key).format('dddd, D MMMM')
            return `${title}: \n\t${value.join('\n\t')}`
        }).join('\n\n')
    }

    if (msg.text === 'Kiev 3 hours range') {
        try {
            const { data } = await getWeatherForecast();  //const { data } = await getWeatherForecast({lat: '4322', lon : '43222'});
            const { list } = data;

            const formatedData = getFormatedData(list)
            const outputData = getPreparedTemplateData(formatedData)

            bot.sendMessage(chatId, `${outputData}`);

        } catch (e) {
            console.log(e);
        }
    }

    if (msg.text === 'Kiev 6 hours range') {
        // bot.sendMessage(chatId, `Погода в: ${msg.text}`);
        try {
            const { data } = await getWeatherForecast();
            const { list } = data;

            const formatedData = getFormatedData(list, ['00:00', '06:00', '12:00', '18:00'])
            const outputData = getPreparedTemplateData(formatedData)

            bot.sendMessage(chatId, `${outputData}`);

        } catch (e) {
            console.log(e);
        }
    };

    // function getExcangeRate(params = {}) {
    //     return axios.get('https://api.monobank.ua/bank/currency')

    // };

    if (msg.text === 'Currency') {
        let opts = {
            reply_markup: {
                keyboard: [
                    ['USD by mono', 'EUR by privatBank'],
                    ['Prev menu'],
                ]
            }
        };
        bot.sendMessage(msg.chat.id, 'choose currency', opts);
    }

    function getCurrencyRate() {
        return axios.get('https://api.monobank.ua/bank/currency')
    }

    function getExchangeTemplate(list = []) {
        const filteredList = list.filter(({ rateBuy, rateSell }) => rateBuy && rateSell) //this is how it should be

        return filteredList.reduce((acc, item) => {

            const key = item.date;
            const code = item.currencyCodeA;
            const code2 = item.currencyCodeB;
            const rateBuy = item.rateBuy;
            const currSell = item.rateSell;

            const currentTempalte = {
                [key]: [
                    ...acc?.[key] || [],
                    `${CURRENCY_ISO_MAP[code]} - ${CURRENCY_ISO_MAP[code2]} \n \u2705 покупка - ${rateBuy}, \u2705 продажа - ${currSell}`
                ]
            };

            // const currectyRateTemplate = rateBuy && currSell
            //     ? currentTempalte
            //     : {};

            return {
                ...acc,
                // ...currectyRateTemplate
                ...currentTempalte
            }
        }, {})

    }

    function preparedCurrencyTemplate(data) {
        return Object.entries(data).map(([key, value]) => {
            const title = dayjs.unix(key).format('dddd, D MMMM, HH:m:ss')

            return `\ud83d\udd0e последее обновление курса - ${title}\u23f0 \n \ud83d\udcb1 ${value.join('\n\t')}`

        }).join('\n\n')
    }


    if (msg.text === 'USD by mono') {

        const { data } = await getCurrencyRate();
        // const { list } = data;

        const formatedData = getExchangeTemplate(data);
        const outputData = preparedCurrencyTemplate(formatedData)

        bot.sendMessage(chatId, `${outputData}`);
    }

    if (msg.text === 'EUR by privatBank') {

    }

});