const mongoose = require('mongoose');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  await mongoose.connect(process.env.ATLAS_CONNECTION); 
}
main().catch(err => console.log(err));

const Schema = mongoose.Schema;

// Create Model
const citySchema = new Schema({
  name: {type: String, required:true, unique:true},
  is_active:    {type: Number}
});

// Export Model
module.exports = mongoose.model('city', citySchema, 'city');