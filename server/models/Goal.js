const mongoose=require("mongoose");

const goalSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"SignUp",
        required:true
    },
    goalName:{
        type:String,
        required:true
    },
    targetAmount:{
        type:Number,
        required:true
    },
    savedSoFar:{
        type:Number,
        default:0
    },
    deadline:{
        type:Date,
        required:true,
    },
    priority:{
        type:String,
        enum:["High", "Medium", "Low"],
        required:true,
    },
    notes:{
        type:String,
        default:""
    },
});

module.exports=mongoose.model("Goal", goalSchema);