'use strict'
/* eslint-disable */
const AWS = require('aws-sdk')
const message = require('config/message.js')
const json = require('config/response.js')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const code = require('config/code.js')
const uuid = require('uuid')
const jwt = require('../function/jwt')

module.exports.index = async (event) => {
  try {
    if(event.headers.Authorization == undefined) {
      return  {"statusCode": 401, "body" : "Unauthorized"}
    }
    let check = await jwt.verify(event.headers.Authorization.split(' ')[1]);
    if(!check) {
      return  {"statusCode": 401, "body" : "Unauthorized"}
    }

    const table = process.env.item_table
    const timestamp = new Date().toISOString()
    const data = JSON.parse(event.body)
      let head = 'rse-'
      if (data.id === undefined || data.id === '') {
        head = 'rse-'+uuid.v4()
      } else {
        head = data.id
      }
      const sk =  data.type
      const param = {
        TableName: table,
        Item: {
          pk: head,
          sk: sk,
          ...data ,
          type: data.type,

          createdAt: timestamp,
          updatedAt: timestamp,
        }
      }
      await dynamoDb.put(param).promise()
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
