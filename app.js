//jshint esversion:6
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const fs=require("fs");
const session=require('express-session');
const mongoose=require("mongoose");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require("mongoose-findorcreate");
const multer=require("multer");

const upload = multer({
    dest: __dirname+"/public/UPLOAD/"
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

const app=express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');


app.use(session({
    secret: "Food is Life.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const RecipeDB=mongoose.createConnection('mongodb://localhost:27017/RecipeDB',{ useUnifiedTopology: true, useNewUrlParser: true  });
const userDB=mongoose.createConnection('mongodb://localhost:27017/userDB',{ useUnifiedTopology: true, useNewUrlParser: true  });

mongoose.set('useCreateIndex', true);

const recipeSchema=new mongoose.Schema({
    userID: String,
    title: String,
    image: String,
    desc: String,
    ingredients: String,
    steps: String
});


const userSchema=new mongoose.Schema({
    username: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User=userDB.model('User',userSchema);
const Recipe=RecipeDB.model('Recipe',recipeSchema);



passport.use(User.createStrategy());

passport.serializeUser(function(user,done) {
    done(null,user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

app.get("/",(req,res)=> {
    res.render("home");
});

app.get("/recipes",(req,res)=> {
    if(req.isAuthenticated()) {
        Recipe.find({},(err,foundRecipes)=> {
            res.render("recipes",{"recipeItems":foundRecipes});
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get("/submit",(req,res)=> {
    if(req.isAuthenticated()) {
        res.render("submit");
    }
    else {
        res.redirect("/login");
    }
});

app.post("/submit",upload.single('image'), (req,res)=> {
    const userID= req.user.id;
    const title=req.body.title;
    const desc=req.body.description;
    const ingredients=req.body.ingredients;
    const steps=req.body.steps;
    var filePath=req.file.destination+userID+"/";

    fs.mkdir(filePath,{ recursive: true },function (err) {
        if(err) {
            console.log(err);
        }
        else {
            console.log("Dir created");
        }
    });
    
    console.log(req.file.destination);
    fs.rename(req.file.path, req.file.destination+userID+"/"+req.file.originalname , (err)=>{
        if(err)
            console.log(err);
    });
    filePath="/UPLOAD/"+userID+"/"+req.file.originalname;

    User.findOne({"_id":userID},(err,user)=> {
        username=user.username;
        const recipe= new Recipe({
            userID: username,
            title: title,
            image: filePath,
            desc: desc,
            ingredients: ingredients,
            steps: steps
        });
        recipe.save();
    });
    res.redirect("/recipes");
    
});




app.get("/register",(req,res)=> {
    res.render("register");
});

app.post("/register",(req,res)=> {
    User.register({username: req.body.username}, req.body.password,(err,user)=> {
        if(err) { //if user already exists
            console.log(err);
            res.redirect("/login");
        }
        else {
            passport.authenticate("local")(req,res,()=> {
                res.redirect("/recipes");
            });
        }
    });
});

app.get("/login",(req,res)=> {
    res.render("login");
});

app.post("/login",(req,res)=> {
    const newUser=new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(newUser,(err)=>{
        if(err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req,res,()=> {
                console.log("user logged in");
                res.redirect("/recipes");
            });
        }
    });
});

app.get("/view",(req,res)=> {
    if(req.isAuthenticated()) {
        Recipe.find({"userID":req.user.username},(err,recipes)=> {
            res.render("ownrecipe",{recipes: recipes});
        });
        
    }
    else {
        res.redirect("/login");
    }
});

app.get("/edit/:recipeID",(req,res)=> {
    const requestedRecipeID=req.params.recipeID;
    Recipe.findOne({"_id":requestedRecipeID},(err,recipe)=> {
        res.render("edit",{"recipe": recipe});
    });
});

app.post("/edit/:recipeID",(req,res)=> {
    const requestedRecipeID=req.params.recipeID;
    Recipe.findOneAndUpdate({"_id":requestedRecipeID},{"$set": {title: req.body.title, desc: req.body.description ,ingredients: req.body.ingredients, steps: req.body.steps}},(err) =>{

        if(!err) {
            res.redirect("/recipes");
        }
        else {
            console.log(err);
        }
    });  
});

app.get("/logout",(req,res)=> {
    req.logout();
    res.redirect("/");
});

app.get("/:recipeID",(req,res)=> {
    const requestedRecipeID=req.params.recipeID;
    Recipe.findOne({"_id":requestedRecipeID},(err,recipe)=> {

        var ingredients= recipe.ingredients.split('\n');
        var steps=recipe.steps.split('\n');

        res.render("onerecipe",{"recipeTitle": recipe.title, "recipeDesc":recipe.desc, "recipeIngredients":ingredients, "recipeSteps":steps});
    });
});

app.post("/search",(req,res)=> {
    const search=req.body.search;
    var recipeWithSearchIngredient=[];
    Recipe.find({"title": search},(err,recipes)=> {
        if(!err) {
            if(recipes.length!==0)
                res.render("recipes",{"recipeItems":recipes});
            else {
                Recipe.find({},(err,ingredientRecipe)=> {
                    ingredientRecipe.forEach(function(recipe) {
                        if(recipe.ingredients.includes(search)) {
                            recipeWithSearchIngredient.push(recipe);
                        }
                    });
                    res.render("recipes",{"recipeItems":recipeWithSearchIngredient});
                });    
            }
        }
        else{
            console.log(err);
        }
    });
});

app.listen(3000,()=> {
    console.log("Server started on port 3000");   
});