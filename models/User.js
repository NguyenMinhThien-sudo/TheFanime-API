const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
    vip: { type: Boolean, default: false },
    vipExpiration: { type: Date, default: null },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie", // Tham chiếu đến mô hình của đối tượng phim
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema(
//   {
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     profilePic: { type: String, default: "" },
//     isAdmin: { type: Boolean, default: false },
//     favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("User", UserSchema);
