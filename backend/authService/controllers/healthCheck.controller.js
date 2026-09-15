const healthCheck = async (req,res) =>{
    try{
        res.send({"status": "OK"})
    }catch(err){
        console.log(err)
        res.send({"status": "DOWN"})
    }
}

module.exports = {healthCheck}