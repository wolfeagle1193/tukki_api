const errorHandler=(req,res,next)=>{
    return res.status(500).json({status:false,message:"Une erreur est survenue."})

}
module.exports = errorHandler;