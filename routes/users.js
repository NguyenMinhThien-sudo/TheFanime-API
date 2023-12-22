const router = require("express").Router();
const User = require("../models/User");
const Movie = require("../models/Movie");
const CryptoJS = require("crypto-js");
const verify = require("../verifyToken");
const nodemailer = require("nodemailer");

//-- ADMIN --//

// CREATE
router.post("/", async (req, res) => {
  const { username, email, password, profilePic, isAdmin } = req.body;

  // Tạo người dùng mới với các trường dữ liệu bổ sung
  const newUser = new User({
    username,
    email,
    password: CryptoJS.AES.encrypt(password, process.env.SECRET_KEY).toString(),
    profilePic: profilePic || "", // Sử dụng giá trị mặc định nếu không được cung cấp
    isAdmin: isAdmin || false, // Sử dụng giá trị mặc định nếu không được cung cấp
  });

  try {
    const savedUser = await newUser.save();
    return res.status(201).json(savedUser); // Trả về dữ liệu người dùng mới tạo
  } catch (err) {
    return res.status(500).json(err); // Xử lý lỗi nếu có
  }
});

// UPDATE
router.put("/:id", verify, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    if (req.body.password) {
      req.body.password = CryptoJS.AES.encrypt(
        req.body.password,
        process.env.SECRET_KEY
      ).toString();
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      return res.status(200).json(updatedUser); // Sử dụng return ở đây
    } catch (err) {
      return res.status(500).json(err); // Sử dụng return ở đây
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

// DELETE
router.delete("/:id", verify, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      return res.status(200).json("User has been deleted..."); // Sử dụng return ở đây
    } catch (err) {
      return res.status(500).json(err); // Sử dụng return ở đây
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

// GET
router.get("/find/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...info } = user._doc;
    return res.status(200).json(info); // Sử dụng return ở đây
  } catch (err) {
    return res.status(500).json(err); // Sử dụng return ở đây
  }
});

// GET ALL
router.get("/", verify, async (req, res) => {
  const query = req.query.new;
  if (req.user.isAdmin) {
    try {
      const users = query
        ? await User.find().sort({ _id: -1 }).limit(5)
        : await User.find();
      return res.status(200).json(users); // Sử dụng return ở đây
    } catch (err) {
      return res.status(500).json(err); // Sử dụng return ở đây
    }
  } else {
    return res.status(403).json("You are not allowed to see all users!");
  }
});

// GET USER STATS
router.get("/stats", async (req, res) => {
  const today = new Date();
  const lastYear = today.setFullYear(today.setFullYear() - 1);

  try {
    const data = await User.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    return res.status(200).json(data); // Sử dụng return ở đây
  } catch (err) {
    return res.status(500).json(err); // Sử dụng return ở đây
  }
});

// USER TRANSACIONS STATS
router.get("/transactions-stats", async (req, res) => {
  const today = new Date();
  const lastYear = today.setFullYear(today.setFullYear() - 1);

  try {
    const data = await User.aggregate([
      {
        $match: {
          vip: true,
          vipExpiration: { $gte: new Date(lastYear) },
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d", // Định dạng chuỗi mong muốn (năm-tháng-ngày)
              date: {
                $subtract: ["$vipExpiration", 30 * 24 * 60 * 60 * 1000], // Trừ đi 30 ngày
              },
            },
          },
          username: "$username",
          vip: "$vip",
          profilePic: "$profilePic",
        },
      },
      {
        $group: {
          _id: "$date",
          total: { $sum: 1 },
          users: {
            $push: {
              username: "$username",
              vip: "$vip",
              profilePic: "$profilePic",
            },
          },
        },
      },
      {
        $sort: { _id: -1 }, // Sắp xếp từ gần nhất đến xa nhất
      },
    ]);
    return res.status(200).json(data); // Sử dụng return ở đây
  } catch (err) {
    return res.status(500).json(err); // Sử dụng return ở đây
  }
});

//-- USER --//

// GET USER PROFILE
// router.get("/profile/:id", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     const { password, ...info } = user._doc;
//     return res.status(200).json(info);
//   } catch (err) {
//     return res.status(500).json(err);
//   }
// });

// Bước 1: Người dùng nhập email (không cần kiểm tra tồn tại thực sự)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra email giả có tồn tại trong cơ sở dữ liệu không
    const user = await User.findOne({ email });

    if (!user) {
      // Email không tồn tại, có thể trả về lỗi hoặc thông báo khác
      return res.status(404).json("Email không tồn tại");
    }

    // Nếu tồn tại, chuyển người dùng đến trang ResetPassword
    return res.status(200).json("Email xác nhận đã được gửi.");
  } catch (error) {
    console.error("Đã xảy ra lỗi khi quên mật khẩu:", error);
    return res.status(500).json("Đã xảy ra lỗi khi xử lý yêu cầu.");
  }
});

// Bước 3: Người dùng đặt lại mật khẩu
router.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json("Người dùng không tồn tại");
    }

    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.SECRET_KEY
    ).toString();

    // Cập nhật mật khẩu
    user.password = encryptedPassword;

    // Lưu thay đổi vào cơ sở dữ liệu
    await user.save();

    return res.status(200).json("Đổi mật khẩu thành công.");
  } catch (error) {
    console.error("Đã xảy ra lỗi khi đặt lại mật khẩu:", error);
    return res.status(500).json("Đã xảy ra lỗi khi xử lý yêu cầu.");
  }
});

// Cập nhật VIP
router.post("/updateVip/:id", async (req, res) => {
  const { userId, vipStatus } = req.body;

  try {
    // Tìm người dùng theo userId
    const user = await User.findById(userId);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Cập nhật trạng thái VIP
    user.vip = vipStatus;
    user.vipExpiration = expirationDate;

    // Lưu người dùng đã cập nhật
    await user.save();

    // console.log(
    //   `Trạng thái VIP của người dùng ${userId} đã được cập nhật thành: ${vipStatus}`
    // );
    return res
      .status(200)
      .json({ message: "Cập nhật trạng thái VIP của người dùng thành công" });
  } catch (error) {
    console.error(
      "Lỗi khi cập nhật trạng thái VIP của người dùng:",
      error.message
    );
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});

// ADD FAVORITE
router.post("/favorites-add", async (req, res) => {
  const userId = req.body.userId; // Lấy id của người dùng từ token
  const movieId = req.body.movieId; // Lấy id của phim từ request body

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Kiểm tra xem phim đã có trong danh sách yêu thích của người dùng chưa
    const isMovieInFavorites = user.favorites.includes(movieId);

    if (isMovieInFavorites) {
      return res.status(400).json({ error: "Movie already in favorites" });
    }

    // Thêm phim vào danh sách yêu thích của người dùng
    user.favorites.push(movieId);
    await user.save();

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: "Unable to add to favorites" });
  }
});

// GET FAVORITE
router.get("/favorites/:id", async (req, res) => {
  try {
    const userId = req.params.id; // Lấy id của người dùng từ token

    // Tìm người dùng trong cơ sở dữ liệu
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const favoriteMovies = await Movie.find({ _id: { $in: user.favorites } });

    // Trả về danh sách yêu thích của người dùng với thông tin chi tiết của từng phim
    res.status(200).json(favoriteMovies);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// REMOVE FAVORITE
router.post("/favorites-remove", async (req, res) => {
  const userId = req.body.userId; // Lấy id của người dùng từ token
  const movieId = req.body.movieId; // Lấy id của phim từ request body

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Kiểm tra xem phim có trong danh sách yêu thích của người dùng không
    const isMovieInFavorites = user.favorites.includes(movieId);

    if (!isMovieInFavorites) {
      return res.status(404).json({ error: "Movie not found in favorites" });
    }

    // Loại bỏ phim khỏi danh sách yêu thích của người dùng
    user.favorites.pull(movieId);
    await user.save();

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: "Unable to remove from favorites" });
  }
});

module.exports = router;
