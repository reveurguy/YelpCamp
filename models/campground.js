const mongoose = require('mongoose');
//Schema
var campgroundSchema = new mongoose.Schema({
	name: String,
	price: String,
	image: String,
	description: String,
	coordinates: Array,
	location: String,
	phone: String,
    start: String,
    end: String,
	createdAt: 
	{
		type: Date,
		default: Date.now	
	},
	author:{
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
			},
		username: String
	},
	comments:
	[
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}	
	],
	 rateAvg: Number,
  rateCount: Number,
  hasRated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
	likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports = mongoose.model("Campground",campgroundSchema);