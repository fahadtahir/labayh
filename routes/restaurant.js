const mongoose = require('mongoose');
const City = require('./city');
const constants = require('./constants');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  await mongoose.connect(process.env.ATLAS_CONNECTION); 
}
main().catch(err => console.log(err));

const Schema = mongoose.Schema;

// Create Model
const restaurantSchema = new Schema({
  name: {type: String, required:true, unique:true},
  email:    {type: String, required:true, unique:true},
  image:    {type: String, required:true}, //link
  city:    {type: Schema.Types.ObjectId, ref: City, required:true},
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
  is_active: {type: Number}
});

// Export Model
const Restaurant = mongoose.model('restaurant', restaurantSchema, 'restaurant');
Restaurant.collection.createIndex( { 'location' : '2dsphere' } );


exports.addRestaurant = function (req, res) {
  //#swagger.description = Add a new restaurant

  if (req.user.role != constants.userType.ADMIN) return res.status(401).send({result: constants.responses.INSUFFICIENT_PRIVELEGES});

  const body = req.body;

  const schema = Joi.object().keys({
    name : Joi.string().required(),
    city : Joi.string().required(),
    email :    Joi.string().email().required(),
    image :    Joi.string().uri().required(),
    location : Joi.array().items(Joi.number()).length(2)
  });

  const result = schema.validate(body);

  if(result.error) {
    console.log(result.error);
    res.status(400).send({error: result.error.message}); //sending errors in response for easy testing. Normally not displayed to user
  }
  else {
    const restaurant = new Restaurant({  name: body.name, email: body.email, image: body.image, city: body.city, location: {type:'Point', coordinates: body.location}, is_active: 1 });
    restaurant.save()
    .then(() => {
      res.status(200).send({result: 'Restaurant added successfully'});
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({result: constants.responses.FAILURE_RESPONSE});
    });
  }
}


exports.editRestaurant = function (req, res) {
  //#swagger.description = Edit an existing restaurant

  if (req.user.role != constants.userType.ADMIN) return res.status(401).send({result: constants.responses.INSUFFICIENT_PRIVELEGES});

  const body = req.body;

  const schema = Joi.object().keys({
    id : Joi.string().required(),
    name : Joi.string().required(),
    city : Joi.string().required(),
    email :    Joi.string().email().required(),
    image :    Joi.string().uri().required(),
    location : Joi.array().items(Joi.number()).length(2)
  });

  const result = schema.validate(Object.assign(body,req.query));

  if(result.error) {
    console.log(result.error);
    res.status(400).send({error: result.error.message}); //sending errors in response for easy testing. Normally not displayed to user
  }
  else {
    Restaurant.findByIdAndUpdate(req.query.id, {name: body.name, email: body.email, image: body.image, city: body.city, location: {type:'Point', coordinates: body.location}})
    .then((result) => {
      if (result) res.status(200).send("Restaurant updated successfully");
      else res.status(400).send({result: "No restaurant found for the given ID"});
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({result: constants.responses.FAILURE_RESPONSE});
    });
  }
}

//Delete an existing restaurant (set is_active=0)
exports.deleteRestaurant = function (req, res) {
  //#swagger.description = Delete an existing restaurant
  
  if (req.user.role !=constants.userType.ADMIN) return res.status(401).send({result: constants.responses.INSUFFICIENT_PRIVELEGES});

  const body = req.query;

  const schema = Joi.object().keys({
    id : Joi.string().required()
  });

  const result = schema.validate(body);

  if(result.error) {
    console.log(result.error);
    res.status(400).send({error: result.error.message}); //sending errors in response for easy testing. Normally not displayed to user
  }
  else {
    Restaurant.findByIdAndUpdate(body.id, {is_active: 0})
    .then(() => {
      res.status(200).send({result: "Restaurant deleted successfully"});
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(constants.responses.FAILURE_RESPONSE);
    });
  }
};


exports.findNearestRestaurants = function (req, res) {
  //#swagger.description = Find nearest (5) restaurants to a given location (point)

  const body = req.query;
  const location = body.location;

  const schema = Joi.object().keys({
    location : Joi.array().items(Joi.number()).length(2)
  });

  const result = schema.validate(body);

  if(result.error) {
    console.log(result.error);
    res.status(400).send({error: result.error.message}); //sending errors in response for easy testing. Normally not displayed to user
  }
  else {

    Restaurant.aggregate([
       {
         $geoNear: {
            near: { 
              type: 'Point',
              coordinates: [parseFloat(location[0]), parseFloat(location[1])]
            },
            // maxDistance: 100000, //100km
            distanceField: 'distance',
            distanceMultiplier: 0.001,
            spherical: true
         }
       },
       { "$match": { "is_active": 1 } },
       {
          $project: {
            _id: 0,
            name: 1,
            email: 1,
            city: 1, 
            "distance (km)": { 
              $round: ["$distance", 4] 
            }
          }
        },
       { $limit: 5 }
      ]).then( (data)=>  {
          return Restaurant.populate(data, { path:'city', select: 'name -_id' });
        })
        .then( (data)=>  {
          return res.status(200).send({result: data});
        })
        .catch((err)=> {
          console.log(err);
          return res.status(400).send({result: constants.responses.FAILURE_RESPONSE});
        })
  }
}


exports.searchRestaurants = function (req, res) {
  //#swagger.description = Find all restaurant that have 'name' beginning with the given text
  const body = req.query;
  const text = body.text;

  const schema = Joi.object().keys({
    text : Joi.string().required()
  });

  const result = schema.validate(body);

  if(result.error) {
    console.log(result.error);
    res.status(400).send({error: result.error.message}); //sending errors in response for easy testing. Normally not displayed to user
  }
  else {
    Restaurant.find({ name: {$regex : `^${text}`}, is_active: 1 }).select('name -_id')
      .then( (data)=>  {
        return res.status(200).send({result: data});
      })
      .catch((err)=> {
        console.log(err);
        return res.status(400).send({result: constants.responses.FAILURE_RESPONSE});
      })
  }
}


exports.groupRestaurants = function (req, res) {
  //#swagger.description = Group restaurant count by 'city'
    Restaurant.aggregate([
      { "$match": { "is_active": 1 } },
       {
        $group: {
          _id: "$city",
          count: { $sum: 1 }
        }
       },
       {
       $lookup: {
        from: "city",
        localField: "_id",
        foreignField: "_id",
        as: "city",
      }},
      {
        $set: {
          city_name: { $arrayElemAt: ["$city.name", 0] }
        }
      },{
      "$project": {
        "_id": 0,
        "city_name": 1,
        "count": 1
      }
      },
      ])
        .then( (data)=>  {
          return res.status(200).send({result: data});
        })
        .catch((err)=> {
          console.log(err);
          return res.status(400).send({result: constants.responses.FAILURE_RESPONSE});
        })
}
