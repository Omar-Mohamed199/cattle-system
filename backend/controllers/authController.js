const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  let { username, password } = req.body;

  // تنظيف القيم (حل مشكلة المسافات)
  username = username?.trim();
  password = password?.trim();

  // Debug (هتشوفه في Render logs)
  console.log("USERNAME:", JSON.stringify(username));
  console.log("PASSWORD:", JSON.stringify(password));

  // شرط تسجيل الدخول
  if (username === 'محمد' && password === 'ehab2001') {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    return res.json({
      username,
      token,
    });
  }

  // لو غلط
  res.status(401);
  throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
});

module.exports = { loginUser };