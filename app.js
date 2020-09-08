const dotenv=require('dotenv');
dotenv.config();

const   express                = require("express"),
        Campground             = require("./models/campground"),
	   cookieParser = require('cookie-parser'),
        Comment                = require("./models/comment"),
        mongoose               = require('mongoose'),
        bodyParser             = require("body-parser"),
        passport               = require("passport"),
	  	methodOverride         = require("method-override"),
        LocalStrategy          = require("passport-local"),
        passportLocalMongoose  = require("passport-local-mongoose"),
        User                   = require("./models/user"),
        app                    = express(),
	    favicon                = require('express-favicon'),
	    flash                  = require("connect-flash");

//requiring routes
const commentRoutes = require("./routes/comments"),
      campgroundRoutes = require("./routes/campgrounds"),
      indexRoutes = require("./routes/index");

const url=process.env.DATABASEURL;

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
app.use(favicon(__dirname + '/public/favicon.png'));

//PASSPORT config
app.use(require("express-session")(
{
	secret: "Rusty is the best and cutest",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) { 
    res.locals.currentUser = req.user; 
    res.locals.error = req.flash("error"); 
    res.locals.success = req.flash("success");  
	app.locals.moment = require('moment');
	next();
});

app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));


app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use( campgroundRoutes);


var port = process.env.PORT || 3000;
app.listen(port, function () {  
  console.log("Server Has Started!");
});