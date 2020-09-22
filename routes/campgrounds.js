var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken:'pk.eyJ1IjoicHJpeWFuc2h1OTk5IiwiYSI6ImNrZTM0bGNxYTA2MTIycmw2OTJzc2lpdzcifQ.rvyPvM76zMNJF6ZGR3ad8Q'});


var middleware = require("../middleware");

//INDEX - show all campgrounds
router.get("/campgrounds", function(req, res){
    var perPage = 9;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = req.query.search;
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}).sort({createdAt: -1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});





//CREATE- add new campground to dB
router.post("/campgrounds",middleware.isLoggedIn, async function(req,res){
	var name = req.body.name;
	var image = req.body.image;
	var price = req.body.price;
	var start= req.body.start;
	var end= req.body.end;
	var phone= req.body.phone;
	var location = req.body.location;
	var description = req.body.description;
	var author ={
		id: req.user._id,
		username: req.user.username
	}
	var newCampground = {
		name: name,
		image: image,
		description: description,
		author: author,
		price: price,
		location: location,
		start: start,
		end: end,
		phone: phone,
	}
	try
		{
			var response = await geocodingClient.forwardGeocode({
		    query: location,
				autocomplete: false,
		    limit: 1
		  })
		  .send();
		newCampground.coordinates = response.body.features[0].geometry.coordinates;
	
	
	Campground.create(newCampground, function(err, newlyCreated){
		if(err)
		{
			console.log(err);
		}
		else
			{
				res.redirect("/campgrounds");
			}
		
	});
		} catch (err){
			console.log(err.message);
			res.redirect('back');
		}
	
});

//NEW- show form to create new campground
router.get("/campgrounds/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new");
});

//SHOW- shows more info about one campground
router.get("/campgrounds/:id",function(req,res){
 var ratingsArray = [];
	Campground.findById(req.params.id).populate("comments likes").exec(function(err,foundCampground){
		if(err || !foundCampground)
		{
			req.flash("error", "Campground not found!");
			res.redirect("/campgrounds");
		}
		else
			{
				foundCampground.comments.forEach(function(rating) {
        ratingsArray.push(rating.rating);
      });
      if (ratingsArray.length === 0) {
        foundCampground.rateAvg = 0;
      } else {
        var ratings = ratingsArray.reduce(function(total, rating) {
          return total + rating;
        });
         foundCampground.rateAvg = ratings / foundCampground.comments.length;
        foundCampground.rateCount = foundCampground.comments.length;
      }
		foundCampground.save();
		res.render("campgrounds/show",({campground: foundCampground}));
			}
	});
});

// Campground Like Route
router.post("/campgrounds/:id/like", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});

//EDIT CAMPGROUND ROUTE
router.get("/campgrounds/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
		Campground.findById(req.params.id, function(err, foundCampground){
				res.render("campgrounds/edit",{campground: foundCampground});
		
		});
});

//UPDATE CAMPGROUND ROUTE
router.put('/campgrounds/:id', middleware.checkCampgroundOwnership, function (req,res) {
    const submittedCampground = req.body.campground;
    Campground.findById(req.params.id, async (err, campground) => {
        if (err || !campground) return res.redirect('back');

        if (campground.location !== submittedCampground.location) {
            try {
                var response = await geocodingClient
                    .forwardGeocode({
                        query: submittedCampground.location,
                        limit: 1,
                    })
                    .send();
                submittedCampground.coordinates =
                    response.body.features[0].geometry.coordinates;
            } catch (err) {
                console.log(err.message);
                res.redirect('back');
            }
        }

Campground.findByIdAndUpdate(req.params.id,submittedCampground,function (err, updatedCampground) {
                if (err) {
                    res.redirect('/campgrounds');
                } else {
                    res.redirect('/campgrounds/' + req.params.id);
                }
            }
        );
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;