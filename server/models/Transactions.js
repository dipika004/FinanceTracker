const mongoose=require("mongoose");

const transactionSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"SignUp",
        required:true,
    },

    type:{
        type:String,
        enum:["Income", "Expense"],
        required:true,
    },
    amount:{
        type:Number,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        required:true,
        default:Date.now,
    },
    paymentMethod:{
        type:String,
        enum:["Cash","Credit Card","Debit Card","UPI","Net Banking","Others"],
        required:true,
    },
    description:{
        type:String,
    },
});

module.exports=mongoose.model("Transaction", transactionSchema);