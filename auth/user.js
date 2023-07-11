const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  await mongoose.connect(process.env.ATLAS_CONNECTION); //temporary
}
main().catch(err => console.log(err));

const Schema = mongoose.Schema;

// Create Model
const User = new Schema({
  username: {type: String, required:true, unique:true},
  email:    {type: String, required:true, unique:true},
  role:     {type: Number, required:true}, //1=admin 2=user
  image:    {type: String, required:true} //link
});

// Export Model
User.plugin(passportLocalMongoose);
module.exports = mongoose.model('user', User, 'user');