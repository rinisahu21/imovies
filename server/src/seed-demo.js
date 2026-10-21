import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Always load the server's own .env, regardless of the terminal's current folder.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env') });
import mongoose from 'mongoose';
import { Movie, Theatre, Show } from './models/index.js';

const movies = [
  {title:'Interstellar',description:'A team travels beyond this galaxy to discover whether humanity has a future among the stars.',posterUrl:'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',genre:['Sci-Fi','Adventure'],language:['English'],durationMinutes:169,rating:8.7},
  {title:'Dune: Part Two',description:'Paul Atreides unites with Chani and the Fremen while seeking revenge.',posterUrl:'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',genre:['Sci-Fi','Adventure'],language:['English'],durationMinutes:166,rating:8.5},
  {title:'The Batman',description:'A detective uncovers corruption while pursuing a mysterious killer.',posterUrl:'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',genre:['Action','Crime'],language:['English'],durationMinutes:176,rating:7.8},
  {title:'Spider-Man: Across the Spider-Verse',description:'Miles Morales journeys across the multiverse.',posterUrl:'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5XjIf8JB.jpg',genre:['Animation','Action'],language:['English'],durationMinutes:140,rating:8.6},
  {title:'Inception',description:'A skilled thief enters dreams to steal secrets and attempt an impossible task.',posterUrl:'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',genre:['Sci-Fi','Thriller'],language:['English'],durationMinutes:148,rating:8.8},
  {title:'The Dark Knight',description:'Batman faces a criminal mastermind who pushes Gotham into chaos.',posterUrl:'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',genre:['Action','Crime'],language:['English'],durationMinutes:152,rating:9.0},
  {title:'Oppenheimer',description:'The story of the scientist who led the Manhattan Project.',posterUrl:'https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg',genre:['Drama','History'],language:['English'],durationMinutes:180,rating:8.1},
  {title:'Inside Out 2',description:'Riley encounters new emotions as she grows up.',posterUrl:'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',genre:['Animation','Comedy'],language:['English'],durationMinutes:96,rating:7.6},
  {title:'Jawan',description:'A man driven by a personal mission fights corruption.',posterUrl:'https://image.tmdb.org/t/p/w500/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg',genre:['Action','Thriller'],language:['Hindi'],durationMinutes:169,rating:7.0},
  {title:'3 Idiots',description:'Three friends navigate college, friendship and expectations.',posterUrl:'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',genre:['Comedy','Drama'],language:['Hindi'],durationMinutes:170,rating:8.4},
  {title:'Drishyam 2',description:'A family tries to protect a secret as a case reopens.',posterUrl:'https://image.tmdb.org/t/p/w500/6JYHyv7J0dG2m4J7Z6Y5R0bXz2M.jpg',genre:['Thriller','Crime'],language:['Hindi'],durationMinutes:140,rating:8.0},
  {title:'RRR',description:'Two revolutionaries build a friendship in colonial India.',posterUrl:'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwMOuZJA1i.jpg',genre:['Action','Drama'],language:['Telugu'],durationMinutes:187,rating:7.8}
];
try {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in server/.env before seeding.');
  await mongoose.connect(process.env.MONGODB_URI);
  const movieDocs=[];
  for (const m of movies) movieDocs.push(await Movie.findOneAndUpdate({title:m.title},{$set:{...m,isActive:true}},{upsert:true,new:true,setDefaultsOnInsert:true}));
  const theatreSpecs=[
    {name:'IMovies Central',city:'Indore',address:'Central city sample location',amenities:['Dolby Audio','Parking','Food court']},
    {name:'IMovies Riverside',city:'Indore',address:'Riverside sample location',amenities:['Recliners','Parking','Snacks']},
    {name:'IMovies Premium',city:'Bhopal',address:'Premium sample location',amenities:['Dolby Atmos','Recliners','Food court']}
  ];
  const theatres=[];
  for(const t of theatreSpecs) theatres.push(await Theatre.findOneAndUpdate({name:t.name,city:t.city},{$set:t},{upsert:true,new:true,setDefaultsOnInsert:true}));
  const existing=await Show.countDocuments({startTime:{$gte:new Date()}});
  if(existing===0){const docs=[];for(let day=0;day<7;day++){for(let mi=0;mi<movieDocs.length;mi++){const theatre=theatres[(mi+day)%theatres.length];for(const hour of [13,17,20]){const startTime=new Date();startTime.setDate(startTime.getDate()+day);startTime.setHours(hour,((mi%2)*30),0,0);if(startTime<=new Date())continue;docs.push({movie:movieDocs[mi]._id,theatre:theatre._id,screen:`Screen ${(mi%3)+1}`,startTime,price:180+((mi+hour)%4)*40,rows:6,seatsPerRow:10,isActive:true});}}}await Show.insertMany(docs);}
  console.log(`Seed complete: ${movieDocs.length} sample movies, ${theatres.length} sample theatres, ${await Show.countDocuments({startTime:{$gte:new Date()}})} upcoming shows.`);
  console.log('IMPORTANT: These are demo schedules and locations, not verified real theatre inventory.');
} catch(e){console.error('Seed failed:',e.message);process.exitCode=1;} finally {await mongoose.disconnect();}
