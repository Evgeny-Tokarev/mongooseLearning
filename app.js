const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/fruitsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const fruitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 1,
  },
  rating: Number,
});
const Fruit = mongoose.model("Fruit", fruitSchema);

const peopleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Why no name"],
  },
  age: Number,
  favoritFruit: fruitSchema,
});

const Human = mongoose.model("Human", peopleSchema);

const apple = new Fruit({
  name: "apple",
  rating: 7,
});

const human = new Human({
  name: "John",
  age: 37,
  favoritFruit: apple,
});
const woman = new Human({
  name: "Jane",
  age: 28,
});

(async () => {
  await apple.save();
  await human.save();
  console.log("New items saved");

  const repFruits = await Fruit.aggregate([
    {
      $group: {
        _id: { name: "$name" },
        dups: { $addToSet: "$_id" },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]).exec();

  const repPeople = await Human.aggregate([
    {
      $group: {
        _id: { name: "$name" },
        dups: { $addToSet: "$_id" },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]).exec();
  let idsToDelete = [];
  idsToDelete = repPeople.reduce(
    (arr, current) => [...arr, ...current.dups.slice(1)],
    []
  );

  if (idsToDelete.length) {
    await Human.deleteMany({ _id: { $in: idsToDelete } });
  }

  idsToDelete = repFruits.reduce(
    (arr, current) => [...arr, ...current.dups.slice(1)],
    idsToDelete
  );
  console.log("idsToDelete  " + idsToDelete);
  if (idsToDelete.length) {
    await Fruit.deleteMany({ _id: { $in: idsToDelete } });
  }

  const [fruits, people] = await Promise.all([Fruit.find({}), Human.find({})]);
  console.log("people " + people);
  console.log("Fruits " + fruits);
  mongoose.disconnect();
})().catch(console.error);
