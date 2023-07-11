console.log("STARTING LABAYH API SERVICE");

const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser'); 
const session = require('express-session');  
const passport = require('passport');  
const connectEnsureLogin = require('connect-ensure-login'); 
const User = require('./auth/user');
const City = require('./routes/city');
const login = require('./auth/login');
const restaurant = require('./routes/restaurant');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger_output.json');

dotenv.config();

const app = express();
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//local strategy (mongoose)
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Labayh App is running on Port ${PORT}`);
});

//Register Admin on Startup
User.register({ username: 'admin', email: 'admin@test.com', role: 1, image: 'https://test.com/test.png' }, 'admin', (err, user) => {
  if (!err) {
    console.log("System Admin registered");
  }
})

//Register two cities on Startup
City.insertMany([ 
  { name: 'Madinah', is_active: 1}, 
  { name: 'Jeddah', is_active: 1}
])
.then(() => {
  console.log("Cities added successfully");
})
.catch(() => {});


//////AUTH//////

//API - Register new user
app.post('/register', login.registerNewUser);

//API - Send login prompt/message from (connect-ensure) 
app.get('/login_message', login.sendLoginMessage);

//API - Send login failure message
app.get('/login_failed', login.sendLoginFailureResponse);

//API - Login user
app.post('/login', passport.authenticate('local', { failureRedirect: '/login_failed', failureMessage: true }),  login.sendLoginResponse);

//API - Logout user
app.post('/logout', login.logoutUser);


//////RESTAURANT//////

//API - Add restaurant
app.post('/restaurant', connectEnsureLogin.ensureLoggedIn('/login_message'), restaurant.addRestaurant);

//API - Edit restaurant
app.put('/restaurant', connectEnsureLogin.ensureLoggedIn('/login_message'), restaurant.editRestaurant);

//API - Delete restaurant
app.delete('/restaurant', connectEnsureLogin.ensureLoggedIn('/login_message'), restaurant.deleteRestaurant);

//API - Nearest restaurants
app.get('/nearest_restaurants', connectEnsureLogin.ensureLoggedIn('/login_message'), restaurant.findNearestRestaurants);

//API - Nearest restaurants
app.get('/search_restaurants', connectEnsureLogin.ensureLoggedIn('/login_message'), restaurant.searchRestaurants);

//API - Nearest restaurants
app.get('/restaurant_statistics', connectEnsureLogin.ensureLoggedIn('/login_message'), restaurant.groupRestaurants);