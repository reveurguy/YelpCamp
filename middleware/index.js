var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");

//all the middleware goes here
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req,res, next)
{
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
		if(err || !foundCampground)
			{
				req.flash("error", "Campground Not Found!");
				res.redirect("back");
			}
		else
		{
				//does user own campground?
			if(foundCampground.author.id.equals(req.user._id)){
				next();
			}
			else
				{
					req.flash("error", "You don't have permission to do that!");
					res.redirect("back");
				}
			}
	});
	}
	else
		{
			req.flash("error", "You need to be logged in!");
			res.redirect("back");
		}
}

middlewareObj.checkProfileOwnership = function(req, res, next) {
  User.findById(req.user._id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "Sorry, that user doesn't exist");
      res.redirect("/campgrounds");
    } else if (foundUser._id.equals(req.user._id) || req.user.isAdmin) {
      req.user = foundUser;
      next();
    } else {
      req.flash("error", "You don't have permission to do that!");
      res.redirect("/campgrounds/" + req.user._id);
    }
  });
};

middlewareObj.checkCommentOwnership = function(req,res, next)
{
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err || !foundComment)
			{
				req.flash("error", "Comment not found!");
				res.redirect("back");
			}
		else
		{
				//does user own comment?
			if(foundComment.author.id.equals(req.user._id)){
				next();
			}
			else
				{
					req.flash("error", "You don't have permission to do that!");
					res.redirect("back");
				}
			}
	});
	}
	else
		{
			req.flash("error", "You need to be logged in!");
			res.redirect("back");
		}
}

middlewareObj.isLoggedIn = function(req, res, next)
{
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in!");
	res.redirect("/login");
}




module.exports = middlewareObj ;