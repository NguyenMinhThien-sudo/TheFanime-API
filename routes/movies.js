const router = require("express").Router();
const Movie = require("../models/Movie");
const verify = require("../verifyToken");

//-- ADMIN --//

//CREATE
router.post("/", verify, async (req, res) => {
  if (req.user.isAdmin) {
    const newMovie = new Movie(req.body);
    try {
      const savedMovie = await newMovie.save();
      return res.status(201).json(savedMovie);
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
      const updatedMovie = await Movie.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      return res.status(200).json(updatedMovie);
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You are not allowed!");
  }
});

//DELETE
router.delete("/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      await Movie.findByIdAndDelete(req.params.id);
      return res.status(200).json("The movie has been deleted...");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You are not allowed!");
  }
});

//GET
router.get("/find/:id", verify, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    return res.status(200).json(movie);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//GET RANDOM
router.get("/random", verify, async (req, res) => {
  const type = req.query.type;
  let movie;
  try {
    if (type === "series") {
      movie = await Movie.aggregate([
        { $match: { isSeries: true } },
        { $sample: { size: 1 } },
      ]);
    } else {
      movie = await Movie.aggregate([
        { $match: { isSeries: false } },
        { $sample: { size: 1 } },
      ]);
    }
    return res.status(200).json(movie);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//GET ALL
router.get("/", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const movies = await Movie.find();
      return res.status(200).json(movies.reverse());
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You are not allowed!");
  }
});

//SEARCH
router.get("/search", verify, async (req, res) => {
  try {
    const { title, offset, limit } = req.query;
    const offsetValue = parseInt(offset) || 0;
    const limitValue = parseInt(limit) || 10;

    const movies = await Movie.find({
      title: { $regex: title, $options: "i" },
    })
      .skip(offsetValue)
      .limit(limitValue);

    const totalMovies = await Movie.countDocuments({
      title: { $regex: title, $options: "i" },
    });

    const response = {
      movies,
      totalMovies,
      offset: offsetValue,
      limit: limitValue,
      nextOffset: offsetValue + limitValue,
    };

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ error: "Movie search error!" });
  }
});

//-- USER --//

// ADD TO FAVORITES
// router.post("/favorites/:userId/:movieId", verify, async (req, res) => {
//   const userId = req.params.userId;
//   const movieId = req.params.movieId;

//   try {
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Kiểm tra xem phim đã có trong danh sách yêu thích của người dùng chưa
//     const isMovieInFavorites = user.favorites.includes(movieId);

//     if (isMovieInFavorites) {
//       return res.status(400).json({ error: "Movie already in favorites" });
//     }

//     // Thêm phim vào danh sách yêu thích của người dùng
//     user.favorites.push(movieId);
//     await user.save();

//     return res.status(200).json(user);
//   } catch (err) {
//     return res.status(500).json({ error: "Unable to add to favorites" });
//   }
// });

// REMOVE FROM FAVORITES
// router.delete("/favorites/:userId/:movieId", verify, async (req, res) => {
//   const userId = req.params.userId;
//   const movieId = req.params.movieId;

//   try {
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Kiểm tra xem phim có trong danh sách yêu thích của người dùng không
//     const isMovieInFavorites = user.favorites.includes(movieId);

//     if (!isMovieInFavorites) {
//       return res.status(404).json({ error: "Movie not found in favorites" });
//     }

//     // Loại bỏ phim khỏi danh sách yêu thích của người dùng
//     user.favorites.pull(movieId);
//     await user.save();

//     return res.status(200).json(user);
//   } catch (err) {
//     return res.status(500).json({ error: "Unable to remove from favorites" });
//   }
// });

//GET ALL (USER)
router.get("/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Trang mặc định là 1 nếu không có tham số page
    const limit = parseInt(req.query.limit) || 9; // Số lượng phim trên mỗi trang, mặc định là 10 nếu không có tham số limit

    const startIndex = (page - 1) * limit; // Vị trí bắt đầu lấy dữ liệu

    const movies = await Movie.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .exec();

    const totalMovies = await Movie.countDocuments();

    const result = {
      page,
      limit,
      totalMovies,
      totalPages: Math.ceil(totalMovies / limit),
      movies: movies.reverse(),
    };

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//GET SIMILAR BY GENRE
router.get("/similar/:id", verify, async (req, res) => {
  const movieId = req.params.id;

  try {
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const similarMovies = await Movie.find({
      genre: movie.genre,
      _id: { $ne: movie._id },
    });

    // Kiểm tra kết quả rỗng
    if (similarMovies.length === 0) {
      return res.status(404).json({ error: "No similar movies found" });
    }

    return res.status(200).json(similarMovies);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
