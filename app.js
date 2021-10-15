//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");

const date = require(__dirname + "/date.js");


const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://toDoUser_1:dU2GqHAT7LTa0JaL@cluster0.bvc4d.mongodb.net/todolistDB?retryWrites=true&w=majority",
  { useNewUrlParser: true }
  );

const itemSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const listSchema = mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);


function getDefaultItems() {
  const item = new Item({ name: "Welcome to your todo list!"});
  const item2 = new Item({ name: "Hit the + button to add a new item"});
  const item3 = new Item({ name: "<-- Hit the the checkbox to delete an item."});

  return [item, item2, item3];
};


function insertDefaultItems () {
  Item.insertMany( getDefaultItems(), function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      console.log("Default items inserted.");
    }
    mongoose.connection.close();
  });
};


function capitalize(string) {
  return string.substr(0, 1).toUpperCase() + string.substr(1).toLowerCase();
}


app.get('/favicon.ico', (req, res) => res.status(204).end());


app.get("/", function(req, res) {

  Item.find({}, function(err, items) {
    
    if (err) {
      console.log(err);

    } else {
      if ( items === 0 ) {
        insertDefaultItems();
      }

      res.render("list", {listTitle: "Today", items: items});
    }
  });

});


app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({ name: item});

  if (req.body.list === "Today") {
    newItem.save();
    res.redirect("/");

  } else {
    List.findOneAndUpdate(
      {name: listName}, 
      {$push: {items: newItem}},
      {new: true},
      function(err, result) {
        if (err) {
          console.log(err)
        } else {
          console.log("Item added.")
        }
      }
    );

    res.redirect(`/${listName}`)
  }
});


app.post("/delete", function(req, res) {
  const itemId = req.body.checked;
  const listName = req.body.listName;

  // from which list is the item coming from?
  if (listName === "Today") {
    Item.findByIdAndDelete(itemId, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item deleted");
      }
    });
    res.redirect("/");

  } else {
    List.findOneAndUpdate(
      {name: listName}, 
      {$pull: {items: {_id: itemId}}},
      {new: true},
      function(err, result) {
        if (err) {
          console.log(err)
        } else {
          console.log("item deleted.")
        }
    });
    res.redirect(`/${listName}`);
  };
  
});


app.get("/:customListName", function(req, res) {
  const customListName = capitalize(req.params.customListName);
  console.log("Route param:", customListName);

  List.findOne( {name: customListName}, function(err, foundList) {
    if (err) {
      console.log(err)
    } else {
      if (!foundList) {
        console.log(`List ${customListName} not found. Creating it...`);
        const list = new List({
          name: customListName,
          items: getDefaultItems(),
        });
        list.save();

        res.render("list", {listTitle: customListName, items: list.items});
        // res.redirect(`/${customListName}`);
      } else {
        res.render("list", {listTitle: foundList.name, items: foundList.items});
      }
    };

    
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
};


app.listen(port, function() {
  console.log("Server has started successfully.");
});
