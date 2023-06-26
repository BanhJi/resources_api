'use strict'
const axios = require('axios')
// const { db } = require('../firebase')
// const { doc, setDoc } = require('firebase/firestore')
let urlEnv = process.env.url
let env = process.env.stage
if (urlEnv.includes('prod')) {
  urlEnv = 'https://apis.banhji.com'
}
if (env.includes('prod')) {
  env = 'production'
}
const accountingV2 = urlEnv + '/accounting-v2/'
const accounts = async (instituteId, type) => {
  const response = await axios.get(accountingV2 + instituteId + '/accounts', {
    params: {
      reqeust_acc_balance: false,
      start_date: false,
      end_date: false,
      inst_type: type
    },
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      origin: 'https://banhji.com'
    }
  })
  return response.data
}

module.exports = {
  accounts
}
