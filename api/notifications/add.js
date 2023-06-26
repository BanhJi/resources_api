'use strict'
/* eslint-disable */
const AWS = require('aws-sdk')
const message = require('config/message.js')
const json = require('config/response.js')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const code = require('config/code.js')
const uuid = require('uuid')
const axios = require('axios')

module.exports.index = async (event) => {
  try {
    const table = process.env.item_table
    const timestamp = new Date().toISOString()
    const data = JSON.parse(event.body)
      let head = 'nti-'
      if (data.id === undefined || data.id === '') {
        head = 'nti-' + data.transaction_id
      } else {
        head = data.id
      }
      const pk =  event.pathParameters.institute_id
      const param = {
        TableName: table,
        Item: {
          pk: pk,
          sk: head,
          ...data ,
          type: data.type,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      }
      await dynamoDb.put(param).promise()
      console.log(' notification' , param.Item)
      await onSendNotification(param.Item);
      return {
        statusCode: code.httpStatus.Created,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // to allow cross origin access
        },
        body: json.responseBody(code.httpStatus.Created, param.Item, message.msg.ItemCreatedSuccessed, '', 1)
      }

  } catch (error) {
    console.log('ERROR on nbcAddExchangeRate', error)
  }

}

function onSendNotification(data){
  var data = JSON.stringify({
    "notification": {
      "title": data.title,
      "body":  data.body,
      "icon": "https://banz.banhji.com/img/Logo_dark%20blue.ef05fa5e.png"
    },
    "data": {
      "sound": "default",
      "content_available": true,
      "priority": "high",
      "pk": data.pk,
      "sk" : data.sk,
    },
    "to": data.to,
  });
  console.log(' data body' ,data)
  var config = {
    method: 'post',
    url: 'https://fcm.googleapis.com/fcm/send',
    headers: { 
      'Authorization': 'Bearer AAAAhNBgDQw:APA91bHQjxPhWEa5dpBatUAE8me2DVe7kwihvc2KCpINFhMJxZcj8eHHPXcoj8BkkifkhlAnK889-2tfUUiqdrzP8Nwjt85CQxCkCE3K0dgmNvNoy53pT880nQqv6NyBOFcGT_VgPgjo', 
      'Content-Type': 'application/json'
    },
    data : data
  };
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
}