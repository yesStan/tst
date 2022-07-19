const { get } = require('http');
const dayjs = require('dayjs')
require('dayjs/locale/ru')
dayjs.locale('ru')
const TelegramBot = require('node-telegram-bot-api');
const ru = require('dayjs/locale/ru');
const { Command } = require('commander');
const axios = require('axios').default;

const token = '5553083920:AAEf8j_0bnTGgh0M_IDVjQzPzzWFXpFxFfA'
const API_KEY = '4468e661cae3911dc87cc649a402ebf1'

const PORT = process.env.PORT || 5000;

// http.listen(5000, function(){
//     console.log('listening on *:5000');
//   });

// const token = process.env.API_KEY;
// const chatId = process.env.CHAT_ID;
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    bot.onText(/^\/start$/, function (msg) {
        let opts = {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                resize_keyboard: true,
                keyboard: [['Kiev'], ['Dnipro']]
            }
        };
        bot.sendMessage(msg.chat.id, "choose from the menu", opts);
    });

    console.log(text);

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
                keyboard: [['3h'], ['6h']]
            }
        };
        bot.sendMessage(msg.chat.id, "alright choose time frame that u wanna display", opts)
    } else if (text === 'Dnipro') {
        const opts = {
            reply_markup: {
                keyboard: [['3h'], ['6h']]
            }
        };
        bot.sendMessage(msg.chat.id, "alright choose time frame that u wanna display", opts)
    } 

    if (msg.text === '3h') {
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

            const preparedData = list.reduce((acc, item) => {
                const key = item.dt_txt.split(' ')[0];
                const time = dayjs.unix(item.dt).format('HH:mm')
                const feelsLike = item.main.feels_like
                const temp = item.main.temp
                const weather = item.weather[0].description;

                const degreeSymbol = (value) => {
                    return value >= 0 ? `+${value} C°`
                        : value < 0
                            ? `-${value} C°`
                            : `${value} C°`
                }
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

        } catch (e) {
            console.log(e);
        }
    };
});