const express = require('express');
const router = express.Router();
var request = require("request");
var paypal = require('paypal-rest-sdk');

var localStorage;

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

router.get("/logout",async(req,res)=>{
  localStorage.removeItem("admin")
  res.render("login",{message:"Please Login To continue"})
})

router.post("/tryLogin",async (req,res)=>{
  // .. your login process
  res.render("index")
})

router.get('/',checkLogin, async (req, res) => {
  var list_billing_plan = {
    'status': req.query.status || "active",
    'page_size': 9,
    'page': 0,
    'total_required': 'yes'
  };

  paypal.billingPlan.list(list_billing_plan, (error, billingPlans) => {
    if (error) {
      res.render('index',{billingPlans:[],plan_exists:false});
    } else {
      res.render('index',{billingPlans:billingPlans.plans,plan_exists:true});
    }
  });
})

router.get("/cancel_plan_from_id",async (req,res)=>{
  internal_plan_id = req.query.id
  res.redirect("/subscription_plans")
})

router.get("/plan_details",checkLogin,async (req,res)=>{
  plan_id = req.query.plan_id
  paypal.billingPlan.get(plan_id, function (error, billingPlan) {
    if (error) {
      res.render('plan_details',{billingPlan:billingPlan});
    } else {
      res.render('plan_details',{billingPlan:billingPlan});
    }
  });
})

router.get("/create_plan",checkLogin,async(req,res)=>{
  res.render("new_plan")
})

router.get("/create_new_plan",checkLogin, async(req,res)=>{
  var billingPlanAttributes = {
    "description":  req.query.description,
    "merchant_preferences": {
      "auto_bill_amount": "yes",
      "cancel_url": req.query.cancel_url,
      "initial_fail_amount_action": "continue",
      "max_fail_attempts": "1",
      "return_url": req.query.return_url,
    },
    "name": req.query.name,
    "payment_definitions": [
      {
        "amount": {
          "currency": "USD",
          "value": req.query.amount
        },
        "cycles": "0",
        "frequency": req.query.frequency,
        "frequency_interval": "1",
        "name": req.query.name,
        "type": "REGULAR"
      },
    ],
    "type": "INFINITE"
  };

  var billing_plan_update_attributes = [
    {
      "op": "replace",
      "path": "/",
      "value": {
        "state": "ACTIVE"
      }
    }
  ];

  paypal.billingPlan.create(billingPlanAttributes, async (error, newBillingPlan)=> {
    console.log("error",error)
    paypal.billingPlan.update(newBillingPlan.id,billing_plan_update_attributes, function (error, billingPlan) {
      res.redirect('/plan_details?plan_id='+newBillingPlan.id);
    });
  })
})

router.get("/cancel_plan",checkLogin,async(req,res)=>{
  plan_id = req.query.plan_id
  var billing_plan_update_attributes = [
    {
      "op": "replace",
      "path": "/",
      "value": {
          "state": "DELETED"
      }
    }
  ];

  paypal.billingPlan.update(plan_id,billing_plan_update_attributes, function (error, billingPlan) {
    res.redirect("/")
  });
})

router.get("/login",(req,res)=>{
  res.render("login",{message:"Please Login To continue"})
})

function checkLogin (req,res,next){
  if(localStorage.getItem("admin")!=null) {
    next()
  }
  else{
    res.render("login")
  }
}

module.exports = router;
