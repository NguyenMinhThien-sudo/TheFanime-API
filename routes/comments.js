const router = require("express").Router();
const Comment = require("../models/Comment");
const verify = require("../verifyToken");

// LƯU
router.post("/", async (req, res) => {
  const { userId, movieId, content, parentId } = req.body;

  try {
    const comment = new Comment({ userId, movieId, content, parentId });
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating comment" });
  }
});

// HIỂN THỊ
router.get("/:movieId", async (req, res) => {
  const { movieId } = req.params;
  try {
    const comments = await Comment.find({ movieId })
      .populate("userId")
      .populate("parentId");
    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching comments" });
  }
});

//HIỂN THỊ BÌNH LUẬN TRẢ LỜI
// router.get("/find/:id", verify, async (req, res) => {
//   try {
//     const comment = await Comment.findById(req.params.id);
//     return res.status(200).json(comment);
//   } catch (err) {
//     return res.status(500).json(err);
//   }
// });

// SỬA
router.put("/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    );
    res.status(200).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating comment" });
  }
});

// XÓA
router.delete("/:commentId", async (req, res) => {
  const { commentId } = req.params;

  try {
    await Comment.findByIdAndDelete(commentId);
    res.status(204).send(); // Trả về mã trạng thái 204 No Content khi xóa thành công
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting comment" });
  }
});

module.exports = router;
