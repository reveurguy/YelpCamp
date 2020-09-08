var express = require("express");
var router = express.Router({mergeParams: true});
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");
var   Comment                = require("../models/comment");

//root route
router.get("/",function(req,res){
	res.render("landing");
});

//show register form
router.get("/register",function(req,res){
	if (req.user) {
		req.flash("error", "You can't do that, you are already logged in.");
    return res.redirect("/campgrounds");
		
  } else {
    res.render("register");
  }
});

//handle sign up logic
router.post("/register",function(req,res){
	var newUser= new User(
		{
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			avatar: req.body.avatar,
			email: req.body.email,
			phone: req.body.phone
		
		});
	User.register(newUser,req.body.password, function(err, user){
		if(err)
			{
				req.flash("error", err.message);
				 return res.redirect("/register");
			}
		passport.authenticate("local")(req,res, function(){
			req.flash("success", "Welcome to YelpCamp "+ user.username + "!");
				res.redirect("/campgrounds");
			});
	});
});

//show login form
router.get("/login",function(req,res){
	if (req.user) {
		req.flash("error", "You can't do that, you are already logged in.");
    return res.redirect("/campgrounds");
		
  } else {
    res.render("login");
  }
});
//handling login logic
router.post("/login", function (req, res, next) {
  passport.authenticate("local",
    {
      successRedirect: "/campgrounds",
      failureRedirect: "/login",
      failureFlash: true,
      successFlash: "Welcome to YelpCamp, " + req.body.username + "!"
    })(req, res);
});

//logout route
router.get("/logout",function(req, res){
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/campgrounds");
});

//user profile
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
	   if (err || !foundUser) {
      req.flash("error", "This user doesn't exist");
      return res.redirect("/campgrounds");
   		 }
    Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
      if(err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/campgrounds");
      }
		Comment.find().where("author.id").equals(foundUser._id).exec(function(err, ratedCount) {
            if (err) {
              req.flash("error", "Something went wrong");
              res.render("error");
            }
      res.render("users/show", {user: foundUser, campgrounds: campgrounds, reviews: ratedCount});
    });
  });
  });
});

// edit profile
router.get("/users/:id/edit",middleware.isLoggedIn,middleware.checkProfileOwnership,function(req, res) {
    res.render("users/edit", {user: req.user});
  });

// update profile
router.put("/users/:id",middleware.isLoggedIn,middleware.checkProfileOwnership,function(req, res) {
    User.findOneAndUpdate({_id: req.params.id}, req.body.user, function(err, user) {
      if (err)
	  {
        req.flash("error", err.message);
      } 
	else 
		{
        req.flash("success", "Updated your profile!");
        res.redirect("/users/" + req.user._id);
      	}
    });
  });

// delete user
router.delete("/users/:id",middleware.isLoggedIn, middleware.checkProfileOwnership, function(req,res) {
  User.findOneAndDelete({_id: req.params.id}, function(err){
	  if (err)
		  {
			  req.flash("error", err.message);
		  }
	  else 
		{
        req.flash("success", "Deleted your profile!");
        res.redirect("/campgrounds");
      	}
  });
});


//about route
router.get("/about",function(req,res){
	res.render("about");
});

module.exports = router;