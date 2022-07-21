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
            keyboard: [['Kiev'], ['Dnipro']]
        }
    };

    if (msg.text === '/start') {
        bot.sendMessage(msg.chat.id, "choose from the menu", opts);
    }

    // const choose = ((city) => {
    //     const opts = {
    //         reply_markup: {
    //             keyboard: [['3h'], ['6h']]
    //         }
    //     };
    //     return city === 'Kiev' || city === 'Dnipro'
    //         ? bot.sendMessage(msg.chat.id, "alright choose time frame that u wanna display", opts)
    //         : bot.sendMessage(msg.chat.id, "in process")
    // })
    // choose(text)

    if (text === 'Kiev') {
        const opts = {
            reply_markup: {
                keyboard: [['Kiev 3 hours range'], ['Kiev 6 hours range']]
            }
        };
        bot.sendMessage(msg.chat.id, "alright choose time frame that u wanna display", opts)
    } else if (text === 'Dnipro') {
        const opts = {
            reply_markup: {
                keyboard: [['Dnipro 3 hours range'], ['Dnipro 6 hours range']]
            }
        };
        bot.sendMessage(msg.chat.id, "alright choose time frame that u wanna display", opts)
    }

    if (msg.text === 'Kiev 3 hours range') {
        // bot.sendMessage(chatId, `Погода в: ${msg.text}`);
        try {
            const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=50.4501&lon=30.5234&lang=ru&appid=4468e661cae3911dc87cc649a402ebf1&units=metric`);
            const { list } = data;

            // {
            //     dt: 1658091600,
            //     main: {
            //       temp: 287.71,
            //       feels_like: 286.84,
            //       temp_min: 287.71,
            //       temp_max: 287.71,
            //       pressure: 1020,
            //       sea_level: 1020,
            //       grnd_level: 1000,
            //       humidity: 62,
            //       temp_kf: 0
            //     },
            //     weather: [ [Object] ],
            //     clouds: { all: 34 },
            //     wind: { speed: 3.09, deg: 280, gust: 7.55 },
            //     visibility: 10000,
            //     pop: 0,
            //     sys: { pod: 'n' },
            //     dt_txt: '2022-07-17 21:00:00'
            //   },

            const degreeSymbol = (value) => {
                return value >= 0 ? `+${value} C°`
                    : value < 0
                        ? `-${value} C°`
                        : `${value} C°`
            }

            const preparedData = list.reduce((acc, item) => {
                const key = item.dt_txt.split(' ')[0];
                const time = dayjs.unix(item.dt).format('HH:mm')
                const feelsLike = item.main.feels_like.toFixed();
                const temp = item.main.temp.toFixed();
                const weather = item.weather[0].description;

                return {
                    ...acc,
                    [key]: [
                        ...acc?.[key] || [],
                        `${time}, ${degreeSymbol(temp)} ощущается как:${degreeSymbol(feelsLike)}, ${weather} `
                    ]
                }
            }, {})

            const outputData = Object.entries(preparedData).map(([key, value]) => {
                const title = dayjs(key).format('dddd, D MMMM')
                return `${title}: \n\t${value.join('\n\t')}`
            }).join('\n\n')

            bot.sendMessage(chatId, `${outputData}`);
//Dnipro
            if (msg.text === 'Dnipro 3 hours range') {
                const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=48.46471&lon=35.0462&lang=ru&appid=4468e661cae3911dc87cc649a402ebf1&units=metric`);
                const { list } = data;

                const preparedData = list.reduce((acc, item) => {
                    const key = item.dt_txt.split(' ')[0];
                    const time = dayjs.unix(item.dt).format('HH:mm')
                    const feelsLike = item.main.feels_like.toFixed();
                    const temp = item.main.temp.toFixed();
                    const weather = item.weather[0].description;

                    return {
                        ...acc,
                        [key]: [
                            ...acc?.[key] || [],
                            `${time}, ${degreeSymbol(temp)} ощущается как:${degreeSymbol(feelsLike)}, ${weather} `
                        ]
                    }
                }, {})

                const outputData = Object.entries(preparedData).map(([key, value]) => {
                    const title = dayjs(key).format('dddd, D MMMM')
                    return `${title}: \n\t${value.join('\n\t')}`
                }).join('\n\n')

                bot.sendMessage(chatId, `${outputData}`);
            }
        } catch (e) {
            console.log(e);
        }
    };
});