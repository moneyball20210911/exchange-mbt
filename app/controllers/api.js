const router = require("express").Router();
const {Users, Payments} = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const APIENTRY = "/api"

const addrs = {};

const getReferalInfo = async (address) => {
	const rows = await Users.find({address})
	let count = 0, rewards = 0;
	if (rows) {
		if (rows.length) {
			count = rows[0].count;
			rewards = rows[0].rewards
		}
	}
	return {count, rewards};
}

router.post(APIENTRY + "/add/user", async (req, res)=>{
	const {address} = req.body;
	if (address && address.length===42) {
		const rows = await Users.find({address})
		if (rows) {
			let result = {}
			if (rows.length===0) {
				await new Users({address, referer:null, count:0, rewards:0}).save();
			} else {
				result = await getReferalInfo(address)
			}
			return res.json({status:'ok', ...result});
		}
	}
	res.json({status:'fail'});
});

router.post(APIENTRY + "/get/user", async (req, res)=>{
	const {address} = req.body;
	if (address && address.length===42) {
		const result = await getReferalInfo(address);
		return res.json({status:'ok', ...result});
	}
	res.json({status:'fail'})
});

router.post(APIENTRY + "/get/all", async (req, res)=>{
	const rows = await Users.find()
	if (rows) {
		const data = [];
		rows.map(v=>data.push(v.address))
		return res.json({status:'ok', data})
	}
	res.json({status:'fail'})
});

router.post("/create-payment-intent", async (req, res) => {
	try {
		let { address, amount, referer } = req.body;
		amount = Math.round(amount*100);
		// Create a PaymentIntent with the order amount and currency
		const paymentIntent = await stripe.paymentIntents.create({amount, currency: "usd"});

		addrs[address] = {amount, referer, intendId:paymentIntent.id}
		console.log(paymentIntent)
		res.json({clientSecret: paymentIntent.client_secret});
	} catch (err) {
		console.log(err)		
		res.json({err:err.message})
	}
});
router.post("/set-payment-result", async (req, res) => {
	try {
	
		const { address, payload } = req.body;
		if (payload) {
			const {id, status, amount} = payload.paymentIntent;
			if (addrs[address]) {
				if (id===addrs[address].intendId && amount===addrs[address].amount && status==='succeeded') {
					let bRefered = false;
					let {referer} = addrs[address]
					if (!referer || referer.length!==42) referer = null
					let rows = await Users.find({address})
					if (rows) {
						if (rows.length===0) {
							await new Users({address, referer, count:0, rewards:0}).save();
						} else {
							bRefered = rows[0].referer===referer;
							if (referer && !bRefered) {
								rows[0].referer = referer
								await rows[0].save();
							}
						}
					}
					if (referer && referer!==address) {
						rows = await Users.find({address:referer})
						if (rows.length===0) {
							await new Users({address:referer, referer:null, count:1, rewards:(amount/1000)}).save();
						} else {
							if (!bRefered) rows[0].count++;
							rows[0].rewards += amount/1000;
							await rows[0].save()
						}
					}
					await new Payments({address, amount:amount/100}).save();
					return res.json({status:'ok'})
				}
			}
		}
		
	} catch (err) {
		console.log(err)
	}
	res.json({status:'failed'})
});

router.post(APIENTRY + "/get/payment-list", async (req, res)=>{
  
	const rows = await Payments.find()
	if (rows) {
	  const data = [];
	  for(let v of rows) {
		const {address, amount, updatedAt} = v;
		data.push({address, amount, updatedAt})
	  }
	  return res.json({status:'ok', data})
	}
	res.json({status:'fail'})
  });

  router.post(APIENTRY + "/get/refer-list", async (req, res)=>{
  
	const rows = await Users.find()
	if (rows) {
	  const data = [];
	  for(let v of rows) {
		const {address, count, rewards, updatedAt} = v;
		data.push({address, count, rewards, updatedAt})
	  }
	  return res.json({status:'ok', data})
	}
	res.json({status:'fail'})
  });

module.exports = router;
