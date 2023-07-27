const express=require("express");
const {modelNames}=require("mongoose");
var mongoose=require("mongoose");
// var schema=mongoose.Schema;
var router=express.Router();

// const DATA=mongoose.model('DATA',schema);

router.get("/",function(req,resp){
    DATA.find().then((data) => {
        resp.status(200).json(data);
      })
      .catch((err) => {
        console.log('Error fetching data from MongoDB: ', err);
        resp.status(500).json({ error: 'Error fetching data' });
      });
});

module.exports=router;