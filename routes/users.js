const router = require("express").Router();
const User = require("../models/User");
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
  const latYear = today.setFullYear(today.setFullYear() - 1);

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

module.exports = router;
