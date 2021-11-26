const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const url = require("url");
const date = require(__dirname + "/date.js")

const app = express();

// const items = ["Feed cat in the morning", "Feed cat at noon", "Feed cat in the afternoon"];
// let workItems = []

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Feed cat"
});
const item2 = new Item({
    name: "Take care of cat"
});
const item3 = new Item({
    name: "Love cat"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    let day = date.getDate();
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err)
                    console.log(err);
                else
                    console.log("successfully saved default items to database!")
            });
            res.redirect("/");
        } else
            // console.log(foundItems);
            res.render("lists", {listTitle: day, newListItems: foundItems});//must be in views folder

    })

});


app.post("/", function (req, res) {
    const item = req.body.newItem;
    const listName = req.body.list;
    // if(req.body.list === "Work"){
    //     workItems.push(item);
    //     res.redirect("/work")
    // }
    // else{
    //     items.push(item);
    //     res.redirect("/");
    // }
    const newItem = new Item({
        name: item,
    })

    List.findOne({name: listName}, function (err, foundList) {
        if (!foundList) {
            newItem.save();
            res.redirect("/")
        } else {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName)
        }
    });



    //console.log(item);
})

app.post("/delete", function (req, res) {


    const checkItemId = req.body.checkbox;
    const listName = req.body.listName;
    //console.log(foundList);
    let found = false;
    List.findOne({name: listName}, function (err, foundList) {
        if (!foundList) {
            Item.findByIdAndDelete(checkItemId, function (err) {
                if (err)
                    console.log(err);
                else {
                    console.log("Successfully delete the check item");
                    res.redirect("/");
                }
            });
        }
        else {
            List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}, function (err) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            });
        }
    });

})
app.post("/redirect", function (req, res){
    const newListName = req.body.newListName;
    if(newListName != null){
        res.redirect("/"+newListName);
    }
})
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);


    List.findOne({name: customListName}, function (err, foundList) {

        if (!err) {
            if (!foundList) {
                //create a list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();


                res.redirect("/" + customListName);

                // console.log("Exist!")
            } else {
                //show an existing list
                res.render("lists", {listTitle: customListName, newListItems: foundList.items})
                // console.log(foundList);
            }

        }

    })


    // res.render("lists", {listTitle: customListName, newListItems: workItems});
})
// app.post("/work", function (req, res){
//     let item = req.body.newItem;
//     workItems.push(item);
//     res.redirect("/work");
//     //console.log(item);
// })
app.listen(3000, function () {
    console.log("server started on port 3000");
});
