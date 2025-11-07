const express=require("express");
const router=express.Router();
const Goal=require("../models/Goal");
const verifyToken=require("../middleware/verifyToken");

router.post("/add", verifyToken, async (req, res) => {
  try {
    const { goalName, targetAmount, savedSoFar, deadline, priority, notes } = req.body;

    const addGoal = new Goal({
      userId: req.userId,
      goalName,
      targetAmount,
      savedSoFar,
      deadline,
      priority,
      notes,
    });

    await addGoal.save();
    res.status(201).json({ goal: addGoal, token: req.headers.authorization.split(" ")[1] });
  } catch (err) {
    console.error("Error adding goal:", err);
    res.status(500).json({ error: "Failed to add goal" });
  }
});

router.put("/add-savings/:id", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    goal.savedSoFar += Number(amount);
    await goal.save();

    res.json({ message: "Savings added successfully", goal });
  } catch (err) {
    console.error("Error adding savings:", err);
    res.status(500).json({ message: "Server error while adding savings" });
  }
});


router.get("/", verifyToken, async(req,res)=>{
    try{
        const goals=await Goal.find({userId:req.userId}).sort({deadline:1});
        res.json(goals);
    }catch(err){
        console.error("Error fetching goals:", err);
        res.status(500).json({
            error:"Failed to fetch goals"
        });
    }
});

router.put("/:id", verifyToken, async(req,res)=>{
    try{
        const updateGoal=await Goal.findByIdAndUpdate(req.params.id, req.body, {new:true});
        res.json(updateGoal);
    }catch(err){
        console.error("Error updating goal:", err);
        res.status(500).json({
            error:"Failed to updated goal"
        });
    }
});

router.delete("/:id", verifyToken, async(req,res)=>{
    try{
        await Goal.findByIdAndDelete(req.params.id);
        res.json({message:"Goal deleted successfully"});
    }catch(err){
        console.error("Error deleting error:", err);
        res.status(500).json({
            error:"Failed to delete goal"
        });
    }
});

module.exports=router;