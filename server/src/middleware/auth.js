import jwt from 'jsonwebtoken';
import {User} from '../models/index.js';
export async function protect(req,res,next){
  try { const token=(req.headers.authorization||'').startsWith('Bearer ')?req.headers.authorization.slice(7):null; if(!token)return res.status(401).json({message:'Login required'}); const payload=jwt.verify(token,process.env.JWT_SECRET); const user=await User.findById(payload.id).select('-passwordHash'); if(!user)return res.status(401).json({message:'Account not found'}); req.user=user; next(); }
  catch { return res.status(401).json({message:'Invalid or expired token'}); }
}
export function adminOnly(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({message:'Admin access required'}); next();}
