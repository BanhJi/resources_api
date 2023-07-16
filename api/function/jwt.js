var jwt = require('jsonwebtoken');
const key = "abdfsfdfd*&*9898"

const verify = async (token) =>{
  const decode = await jwt.verify(token, key);
  return decode ;
}
const create = async (data) =>{
  var token = await jwt.sign(data, key);
  return token ;
}
module.exports = {
  verify,
  create
}