const router = require("express").Router();
const List = require("../models/List");
const verify = require("../verifyToken");

// //CREATE

// router.post("/", verify, async (req, res) => {
//   if (req.user.isAdmin) {
//     const newList = new List(req.body);
//     try {
//       const savedList = await newList.save();
//       res.status(201).json(savedList);
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   } else {
//     return res.status(403).json("You are not allowed!");
//   }
// });

// //DELETE

// router.delete("/:id", verify, async (req, res) => {
//   if (req.user.isAdmin) {
//     try {
//       await List.findByIdAndDelete(req.params.id);
//       res.status(201).json("The list has been delete...");
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   } else {
//     return res.status(403).json("You are not allowed!");
//   }
// });

// //GET

// router.get("/", verify, async (req, res) => {
//   const typeQuery = req.query.type;
//   const genreQuery = req.query.genre;
//   let list = [];
//   try {
//     if (typeQuery) {
//       if (genreQuery) {
//         list = await List.aggregate([
//           { $sample: { size: 10 } },
//           { $match: { type: typeQuery, genre: genreQuery } },
//         ]);
//       } else {
//         list = await List.aggregate([
//           { $sample: { size: 10 } },
//           { $match: { type: typeQuery } },
//         ]);
//       }
//     } else {
//       list = await List.aggregate([{ $sample: { size: 10 } }]);
//     }
//     res.status(200).json(list);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// module.exports = router;

// CREATE
router.post("/", verify, async (req, res) => {
  if (req.user.isAdmin) {
    const newList = new List(req.body);
    try {
      const savedList = await newList.save();
      return res.status(201).json(savedList);
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You are not allowed!");
  }
});

//UPDATE
router.put("/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const updatedList = await List.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      return res.status(200).json(updatedList); // Sử dụng return ở đây
    } catch (err) {
      return res.status(500).json(err); // Sử dụng return ở đây
    }
  } else {
    return res.status(403).json("You are not allowed!");
  }
});

// DELETE
router.delete("/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      await List.findByIdAndDelete(req.params.id);
      return res.status(201).json("The list has been deleted..."); // Sử dụng return ở đây
    } catch (err) {
      return res.status(500).json(err); // Sử dụng return ở đây
    }
  } else {
    return res.status(403).json("You are not allowed!");
  }
});

// GET
router.get("/", verify, async (req, res) => {
  const typeQuery = req.query.type;
  const genreQuery = req.query.genre;
  let list = [];
  try {
    if (typeQuery) {
      if (genreQuery) {
        list = await List.aggregate([
          { $sample: { size: 10 } },
          { $match: { type: typeQuery, genre: genreQuery } },
        ]);
      } else {
        list = await List.aggregate([
          { $sample: { size: 10 } },
          { $match: { type: typeQuery } },
        ]);
      }
    } else {
      list = await List.aggregate([{ $sample: { size: 10 } }]);
    }
    return res.status(200).json(list); // Sử dụng return ở đây
  } catch (err) {
    return res.status(500).json(err); // Sử dụng return ở đây
  }
});

module.exports = router;
