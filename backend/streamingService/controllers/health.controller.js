const healthCheck = async (req,res) =>{
    try{
        res.json({msg: 'OK'})
    }catch(err){
        res.json({msg: 'Something went wrong.'})
    }
}

module.exports = { healthCheck }